import { supabase } from './supabaseClient';
import { getCurrentPlan } from './subscriptionService';
import { getCreditBalance } from './creditService';
import { QueueItem, QueuePriority, QueueItemStatus } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Database type that matches Supabase schema
interface DbQueueItem {
  id: string;
  user_id: string;
  project_id?: string;
  priority: QueuePriority;
  status: QueueItemStatus;
  request_data: {
    prompt: string;
    images: string[];
    aspectRatio?: string;
    duration?: number;
    videoGeneration?: boolean;
  };
  result_data?: {
    generatedImages?: string[];
    videoUrl?: string;
    duration?: number;
  };
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface RenderRequest {
  userId: string;
  projectId?: string;
  prompt: string;
  images: string[];
  aspectRatio?: string;
  duration?: number;
  videoGeneration?: boolean;
}

export interface QueuePosition {
  position: number;
  totalInQueue: number;
  estimatedWaitTime: number; // seconds
}

export interface QueueStatus {
  activeRequests: QueueItem[];
  pendingCount: number;
  averageProcessingTime: number; // seconds
}

// Average processing time per request (in seconds)
const AVERAGE_PROCESSING_TIME = 30;

// Realtime subscription channel
let queueChannel: RealtimeChannel | null = null;

/**
 * Convert database queue item to application format
 */
function dbToQueueItem(dbItem: DbQueueItem): QueueItem {
  return {
    id: dbItem.id,
    userId: dbItem.user_id,
    projectId: dbItem.project_id,
    priority: dbItem.priority,
    status: dbItem.status,
    requestData: dbItem.request_data,
    resultData: dbItem.result_data,
    errorMessage: dbItem.error_message,
    createdAt: dbItem.created_at,
    startedAt: dbItem.started_at,
    completedAt: dbItem.completed_at,
  };
}

/**
 * Get user's priority based on their subscription or credit balance
 */
export async function getUserPriority(userId: string): Promise<QueuePriority> {
  try {
    // Check if user has an active subscription
    const subscription = await getCurrentPlan(userId);
    
    if (subscription && subscription.status === 'active') {
      // Free tier gets low priority, paid tiers get high priority
      if (subscription.planId === 'free') {
        return 'low';
      }
      return 'high';
    }

    // Check if user has credits
    const creditBalance = await getCreditBalance(userId);
    if (creditBalance > 0) {
      return 'high';
    }

    // Default to low priority
    return 'low';
  } catch (error) {
    console.error('Error getting user priority:', error);
    return 'low';
  }
}

/**
 * Add a render request to the queue
 */
export async function addToQueue(request: RenderRequest): Promise<QueueItem> {
  // Validate request has prompt
  if (!request.prompt || !request.prompt.trim()) {
    throw new Error('Prompt is required and cannot be empty');
  }

  // Get user's priority
  const priority = await getUserPriority(request.userId);

  // Prepare insert data
  const insertData = {
    user_id: request.userId,
    project_id: request.projectId,
    priority,
    status: 'pending' as QueueItemStatus,
    prompt: request.prompt.trim(), // Add prompt as separate column for database constraint
    input_images: request.images, // Add input_images as separate column for database constraint
    aspect_ratio: request.aspectRatio || '1:1', // Add aspect_ratio as separate column
    request_data: {
      prompt: request.prompt.trim(),
      images: request.images,
      aspectRatio: request.aspectRatio,
      duration: request.duration,
      videoGeneration: request.videoGeneration,
    },
  };

  // Debug log
  console.log('Adding to queue with data:', {
    userId: insertData.user_id,
    projectId: insertData.project_id,
    prompt: insertData.request_data.prompt,
    promptLength: insertData.request_data.prompt.length,
    imagesCount: insertData.request_data.images.length,
    videoGeneration: insertData.request_data.videoGeneration,
    duration: insertData.request_data.duration,
  });

  // Insert into queue
  const { data, error } = await supabase
    .from('render_queue')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Queue insert error:', error);
    console.error('Insert data was:', insertData);
    throw new Error(`Failed to add to queue: ${error.message}`);
  }

  return dbToQueueItem(data as DbQueueItem);
}

/**
 * Get the position of a request in the queue
 */
export async function getQueuePosition(requestId: string): Promise<QueuePosition> {
  // Get the request
  const { data: request, error: requestError } = await supabase
    .from('render_queue')
    .select('*')
    .eq('id', requestId)
    .single();

  if (requestError) {
    throw new Error(`Failed to get queue position: ${requestError.message}`);
  }

  const queueItem = request as DbQueueItem;

  // Count requests ahead in queue
  // Priority queue (high priority) is processed first
  // Within same priority, older requests are processed first (FIFO)
  const { count: highPriorityAhead, error: highError } = await supabase
    .from('render_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('priority', 'high')
    .lt('created_at', queueItem.created_at);

  if (highError) {
    throw new Error(`Failed to count high priority queue: ${highError.message}`);
  }

  let position = highPriorityAhead || 0;

  // If current request is low priority, add all high priority requests
  if (queueItem.priority === 'low') {
    const { count: allHighPriority, error: allHighError } = await supabase
      .from('render_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('priority', 'high');

    if (allHighError) {
      throw new Error(`Failed to count all high priority: ${allHighError.message}`);
    }

    position += allHighPriority || 0;

    // Count low priority requests ahead
    const { count: lowPriorityAhead, error: lowError } = await supabase
      .from('render_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('priority', 'low')
      .lt('created_at', queueItem.created_at);

    if (lowError) {
      throw new Error(`Failed to count low priority queue: ${lowError.message}`);
    }

    position += lowPriorityAhead || 0;
  }

  // Get total pending count
  const { count: totalPending, error: totalError } = await supabase
    .from('render_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (totalError) {
    throw new Error(`Failed to count total pending: ${totalError.message}`);
  }

  // Calculate estimated wait time
  const estimatedWaitTime = position * AVERAGE_PROCESSING_TIME;

  return {
    position: position + 1, // +1 because position 0 means "next in line"
    totalInQueue: totalPending || 0,
    estimatedWaitTime,
  };
}

/**
 * Process the next request in the queue
 * Returns the next pending request with highest priority
 */
export async function processNextRequest(): Promise<QueueItem | null> {
  // Get the next pending request (high priority first, then FIFO)
  const { data, error } = await supabase
    .from('render_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false }) // high priority first
    .order('created_at', { ascending: true }) // oldest first
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get next request: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // Update status to processing
  const { data: updated, error: updateError } = await supabase
    .from('render_queue')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
    })
    .eq('id', data.id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update request status: ${updateError.message}`);
  }

  return dbToQueueItem(updated as DbQueueItem);
}

/**
 * Get queue status for a user
 */
export async function getQueueStatus(userId: string): Promise<QueueStatus> {
  // Get user's active requests (pending or processing)
  const { data: activeData, error: activeError } = await supabase
    .from('render_queue')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: false });

  if (activeError) {
    throw new Error(`Failed to get active requests: ${activeError.message}`);
  }

  const activeRequests = (activeData as DbQueueItem[]).map(dbToQueueItem);

  // Get total pending count
  const { count: pendingCount, error: pendingError } = await supabase
    .from('render_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (pendingError) {
    throw new Error(`Failed to count pending requests: ${pendingError.message}`);
  }

  // Calculate average processing time from recent completed requests
  const { data: recentCompleted, error: completedError } = await supabase
    .from('render_queue')
    .select('started_at, completed_at')
    .eq('status', 'completed')
    .not('started_at', 'is', null)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(10);

  if (completedError) {
    console.error('Failed to get completed requests:', completedError);
  }

  let averageProcessingTime = AVERAGE_PROCESSING_TIME;
  if (recentCompleted && recentCompleted.length > 0) {
    const processingTimes = recentCompleted
      .map((item: any) => {
        const started = new Date(item.started_at).getTime();
        const completed = new Date(item.completed_at).getTime();
        return (completed - started) / 1000; // convert to seconds
      })
      .filter((time: number) => time > 0 && time < 300); // filter out invalid times

    if (processingTimes.length > 0) {
      averageProcessingTime = Math.round(
        processingTimes.reduce((sum: number, time: number) => sum + time, 0) / processingTimes.length
      );
    }
  }

  return {
    activeRequests,
    pendingCount: pendingCount || 0,
    averageProcessingTime,
  };
}

/**
 * Estimate wait time for a given priority level
 */
export async function estimateWaitTime(priority: QueuePriority): Promise<number> {
  // Count pending requests with higher or equal priority
  let query = supabase
    .from('render_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (priority === 'low') {
    // Low priority waits for all pending requests
    // (no additional filter needed)
  } else {
    // High priority only waits for other high priority requests
    query = query.eq('priority', 'high');
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to estimate wait time: ${error.message}`);
  }

  // Calculate estimated wait time
  const requestsAhead = count || 0;
  return requestsAhead * AVERAGE_PROCESSING_TIME;
}

/**
 * Subscribe to queue updates for real-time notifications
 * Returns a cleanup function to unsubscribe
 */
export function subscribeToQueueUpdates(
  userId: string,
  onUpdate: (payload: QueueItem) => void
): () => void {
  // Clean up existing subscription if any
  if (queueChannel) {
    supabase.removeChannel(queueChannel);
  }

  // Create new subscription
  queueChannel = supabase
    .channel('queue-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'render_queue',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) {
          const queueItem = dbToQueueItem(payload.new as DbQueueItem);
          onUpdate(queueItem);
        }
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    if (queueChannel) {
      supabase.removeChannel(queueChannel);
      queueChannel = null;
    }
  };
}

/**
 * Update queue item status (for processing completion)
 */
export async function updateQueueItemStatus(
  requestId: string,
  status: QueueItemStatus,
  resultData?: { generatedImages?: string[]; videoUrl?: string; duration?: number },
  errorMessage?: string
): Promise<QueueItem> {
  const updateData: any = {
    status,
  };

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
    if (resultData) {
      updateData.result_data = resultData;
    }
  }

  if (status === 'failed' && errorMessage) {
    updateData.error_message = errorMessage;
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('render_queue')
    .update(updateData)
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update queue item: ${error.message}`);
  }

  return dbToQueueItem(data as DbQueueItem);
}

/**
 * Get a queue item by ID
 */
export async function getQueueItem(requestId: string): Promise<QueueItem | null> {
  const { data, error } = await supabase
    .from('render_queue')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get queue item: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return dbToQueueItem(data as DbQueueItem);
}
