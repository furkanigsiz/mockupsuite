import { supabase } from './supabaseClient';
import { Project, BrandKit, PromptTemplate } from '../types';
import { cacheService } from './cacheService';

// Database types that match Supabase schema
interface DbProject {
  id: string;
  user_id: string;
  name: string;
  prompt: string | null;
  aspect_ratio: '1:1' | '16:9' | '9:16';
  created_at: string;
  updated_at: string;
}

interface DbBrandKit {
  id: string;
  user_id: string;
  logo_path: string | null;
  use_watermark: boolean;
  colors: string[];
  created_at: string;
  updated_at: string;
}

interface DbPromptTemplate {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
}

interface DbMockup {
  id: string;
  project_id: string;
  user_id: string;
  image_path: string;
  thumbnail_path: string | null;
  created_at: string;
}

interface DbVideo {
  id: string;
  user_id: string;
  project_id: string | null;
  storage_path: string;
  source_image_path: string | null;
  prompt: string;
  duration: number | null;
  aspect_ratio: string | null;
  brand_kit_id: string | null;
  created_at: string;
  updated_at: string;
}

// Project Operations
export async function getProjects(userId: string): Promise<Project[]> {
  // Check cache first
  const cachedProjects = cacheService.getProjects(userId);
  if (cachedProjects) {
    return cachedProjects;
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  // Transform database projects to app format
  // Note: uploadedImages, savedImages, and suggestedPrompts are not stored in projects table
  // They will be populated from other sources or left empty
  const projects = (data as DbProject[]).map(dbProject => ({
    id: dbProject.id,
    name: dbProject.name,
    uploadedImages: [],
    prompt: dbProject.prompt || '',
    aspectRatio: dbProject.aspect_ratio,
    savedImages: [],
    suggestedPrompts: [],
  }));

  // Cache the results
  cacheService.cacheProjects(userId, projects);

  return projects;
}

export interface PaginatedProjects {
  projects: Project[];
  hasMore: boolean;
  nextCursor: string | null;
}

export async function getProjectsPaginated(
  userId: string,
  limit: number = 20,
  cursor?: string
): Promise<PaginatedProjects> {
  let query = supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check if there are more

  if (cursor) {
    query = query.lt('updated_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch paginated projects: ${error.message}`);
  }

  const dbProjects = data as DbProject[];
  const hasMore = dbProjects.length > limit;
  const results = hasMore ? dbProjects.slice(0, limit) : dbProjects;
  const nextCursor = hasMore && results.length > 0 
    ? results[results.length - 1].updated_at 
    : null;

  const projects = results.map(dbProject => ({
    id: dbProject.id,
    name: dbProject.name,
    uploadedImages: [],
    prompt: dbProject.prompt || '',
    aspectRatio: dbProject.aspect_ratio,
    savedImages: [],
    suggestedPrompts: [],
  }));

  return {
    projects,
    hasMore,
    nextCursor,
  };
}

export async function createProject(
  userId: string,
  project: Omit<Project, 'id'>
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: project.name,
      prompt: project.prompt || null,
      aspect_ratio: project.aspectRatio,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  // Invalidate projects cache since we added a new project
  cacheService.invalidateProjects(userId);

  const dbProject = data as DbProject;
  return {
    id: dbProject.id,
    name: dbProject.name,
    uploadedImages: project.uploadedImages,
    prompt: dbProject.prompt || '',
    aspectRatio: dbProject.aspect_ratio,
    savedImages: project.savedImages,
    suggestedPrompts: project.suggestedPrompts,
  };
}

export async function updateProject(
  projectId: string,
  updates: Partial<Project>,
  userId?: string
): Promise<Project> {
  // Build the update object with only the fields that can be updated in the database
  const dbUpdates: Partial<{
    name: string;
    prompt: string | null;
    aspect_ratio: '1:1' | '16:9' | '9:16';
    updated_at: string;
  }> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) {
    dbUpdates.name = updates.name;
  }
  if (updates.prompt !== undefined) {
    dbUpdates.prompt = updates.prompt || null;
  }
  if (updates.aspectRatio !== undefined) {
    dbUpdates.aspect_ratio = updates.aspectRatio;
  }

  const { data, error } = await supabase
    .from('projects')
    .update(dbUpdates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }

  // Invalidate projects cache if userId is provided
  if (userId) {
    cacheService.invalidateProjects(userId);
  }

  const dbProject = data as DbProject;
  return {
    id: dbProject.id,
    name: dbProject.name,
    uploadedImages: updates.uploadedImages || [],
    prompt: dbProject.prompt || '',
    aspectRatio: dbProject.aspect_ratio,
    savedImages: updates.savedImages || [],
    suggestedPrompts: updates.suggestedPrompts || [],
  };
}

export async function deleteProject(projectId: string, userId?: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }

  // Invalidate projects cache if userId is provided
  if (userId) {
    cacheService.invalidateProjects(userId);
  }
}

// Brand Kit Operations
export async function getBrandKit(userId: string): Promise<BrandKit | null> {
  // Check cache first
  const cachedBrandKit = cacheService.getBrandKit(userId);
  if (cachedBrandKit !== undefined) {
    return cachedBrandKit;
  }

  try {
    const { data, error } = await supabase
      .from('brand_kits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 error

    if (error) {
      throw new Error(`Failed to fetch brand kit: ${error.message}`);
    }

    if (!data) {
      // Cache the null result
      cacheService.cacheBrandKit(userId, null);
      return null;
    }

    const dbBrandKit = data as DbBrandKit;
    const brandKit = {
      logo: dbBrandKit.logo_path,
      useWatermark: dbBrandKit.use_watermark,
      colors: dbBrandKit.colors,
    };

    // Cache the result
    cacheService.cacheBrandKit(userId, brandKit);

    return brandKit;
  } catch (error) {
    // Silently return null if brand kit doesn't exist
    console.debug('No brand kit found for user:', userId);
    cacheService.cacheBrandKit(userId, null);
    return null;
  }
}

export async function saveBrandKit(
  userId: string,
  brandKit: BrandKit
): Promise<BrandKit> {
  // Use upsert to insert or update
  const { data, error } = await supabase
    .from('brand_kits')
    .upsert(
      {
        user_id: userId,
        logo_path: brandKit.logo,
        use_watermark: brandKit.useWatermark,
        colors: brandKit.colors,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save brand kit: ${error.message}`);
  }

  const dbBrandKit = data as DbBrandKit;
  const savedBrandKit = {
    logo: dbBrandKit.logo_path,
    useWatermark: dbBrandKit.use_watermark,
    colors: dbBrandKit.colors,
  };

  // Update cache
  cacheService.cacheBrandKit(userId, savedBrandKit);

  return savedBrandKit;
}

export async function getBrandKitId(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('brand_kits')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch brand kit ID: ${error.message}`);
    }

    return data ? data.id : null;
  } catch (error) {
    console.error('Error fetching brand kit ID:', error);
    return null;
  }
}

// Prompt Template Operations
export async function getPromptTemplates(userId: string): Promise<PromptTemplate[]> {
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch prompt templates: ${error.message}`);
  }

  return (data as DbPromptTemplate[]).map(dbTemplate => ({
    id: dbTemplate.id,
    text: dbTemplate.text,
  }));
}

export async function savePromptTemplate(
  userId: string,
  template: PromptTemplate
): Promise<PromptTemplate> {
  const { data, error } = await supabase
    .from('prompt_templates')
    .insert({
      user_id: userId,
      text: template.text,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save prompt template: ${error.message}`);
  }

  const dbTemplate = data as DbPromptTemplate;
  return {
    id: dbTemplate.id,
    text: dbTemplate.text,
  };
}

export async function deletePromptTemplate(templateId: string): Promise<void> {
  const { error } = await supabase
    .from('prompt_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    throw new Error(`Failed to delete prompt template: ${error.message}`);
  }
}

// Mockup Operations
export async function getSavedMockups(projectId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('mockups')
    .select('image_path')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch saved mockups: ${error.message}`);
  }

  return (data as DbMockup[]).map(mockup => mockup.image_path);
}

// Paginated mockup operations
export interface PaginatedMockups {
  mockups: DbMockup[];
  hasMore: boolean;
  nextCursor: string | null;
}

export async function getSavedMockupsPaginated(
  userId: string,
  limit: number = 20,
  cursor?: string
): Promise<PaginatedMockups> {
  let query = supabase
    .from('mockups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check if there are more

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch paginated mockups: ${error.message}`);
  }

  const mockups = data as DbMockup[];
  const hasMore = mockups.length > limit;
  const results = hasMore ? mockups.slice(0, limit) : mockups;
  const nextCursor = hasMore && results.length > 0 
    ? results[results.length - 1].created_at 
    : null;

  return {
    mockups: results,
    hasMore,
    nextCursor,
  };
}

export async function saveMockup(
  projectId: string,
  userId: string,
  imagePath: string,
  thumbnailPath?: string
): Promise<string> {
  const { data, error } = await supabase
    .from('mockups')
    .insert({
      project_id: projectId,
      user_id: userId,
      image_path: imagePath,
      thumbnail_path: thumbnailPath || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save mockup: ${error.message}`);
  }

  const dbMockup = data as DbMockup;
  return dbMockup.image_path;
}

export async function deleteMockup(mockupId: string): Promise<void> {
  const { error } = await supabase
    .from('mockups')
    .delete()
    .eq('id', mockupId);

  if (error) {
    throw new Error(`Failed to delete mockup: ${error.message}`);
  }
}

export async function deleteMockupByImagePath(imagePath: string): Promise<void> {
  const { error } = await supabase
    .from('mockups')
    .delete()
    .eq('image_path', imagePath);

  if (error) {
    throw new Error(`Failed to delete mockup by image path: ${error.message}`);
  }
}

// Video Operations

/**
 * Saves a video record to the database
 * @param userId - User ID
 * @param videoData - Video metadata
 * @returns Saved video record
 */
export async function saveVideo(
  userId: string,
  videoData: {
    projectId?: string;
    storagePath: string;
    sourceImagePath?: string;
    prompt: string;
    duration?: number;
    aspectRatio?: string;
    brandKitId?: string;
  }
): Promise<DbVideo> {
  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: userId,
      project_id: videoData.projectId || null,
      storage_path: videoData.storagePath,
      source_image_path: videoData.sourceImagePath || null,
      prompt: videoData.prompt,
      duration: videoData.duration || null,
      aspect_ratio: videoData.aspectRatio || null,
      brand_kit_id: videoData.brandKitId || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save video: ${error.message}`);
  }

  return data as DbVideo;
}

/**
 * Retrieves user's videos from database with pagination support
 * @param userId - User ID
 * @param limit - Maximum number of videos to retrieve (default: 20)
 * @param cursor - Pagination cursor (created_at timestamp)
 * @returns Paginated video records
 */
export interface PaginatedVideos {
  videos: DbVideo[];
  hasMore: boolean;
  nextCursor: string | null;
}

export async function getVideos(
  userId: string,
  limit: number = 20,
  cursor?: string
): Promise<PaginatedVideos> {
  let query = supabase
    .from('videos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check if there are more

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch videos: ${error.message}`);
  }

  const videos = data as DbVideo[];
  const hasMore = videos.length > limit;
  const results = hasMore ? videos.slice(0, limit) : videos;
  const nextCursor = hasMore && results.length > 0 
    ? results[results.length - 1].created_at 
    : null;

  return {
    videos: results,
    hasMore,
    nextCursor,
  };
}

/**
 * Deletes a video record from database and triggers storage deletion
 * @param videoId - Video ID
 * @param userId - User ID (for verification)
 */
export async function deleteVideo(videoId: string, userId: string): Promise<void> {
  // First, get the video to retrieve storage path
  const { data: video, error: fetchError } = await supabase
    .from('videos')
    .select('storage_path')
    .eq('id', videoId)
    .eq('user_id', userId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch video for deletion: ${fetchError.message}`);
  }

  if (!video) {
    throw new Error('Video not found or access denied');
  }

  // Delete from database (cascading deletes will be handled by DB)
  const { error: deleteError } = await supabase
    .from('videos')
    .delete()
    .eq('id', videoId)
    .eq('user_id', userId);

  if (deleteError) {
    throw new Error(`Failed to delete video: ${deleteError.message}`);
  }

  // Delete from storage
  try {
    const { deleteVideo: deleteVideoFromStorage } = await import('./storageService');
    await deleteVideoFromStorage(video.storage_path);
  } catch (storageError) {
    // Log storage deletion error but don't fail the operation
    // since the database record is already deleted
    console.error('Failed to delete video from storage:', storageError);
  }
}
