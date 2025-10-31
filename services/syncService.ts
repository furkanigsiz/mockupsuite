import { supabase } from './supabaseClient';
import * as databaseService from './databaseService';
import * as storageService from './storageService';
import { Project, BrandKit, PromptTemplate } from '../types';

// IndexedDB configuration
const DB_NAME = 'mockupsuite_sync';
const DB_VERSION = 1;
const STORE_NAME = 'pending_changes';

// Types for pending changes
export type EntityType = 'project' | 'mockup' | 'brandKit' | 'template';
export type ChangeType = 'create' | 'update' | 'delete';

export interface PendingChange {
  id: string;
  type: ChangeType;
  entity: EntityType;
  data: any;
  timestamp: number;
  userId: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

// IndexedDB instance
let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB for storing pending changes
 */
async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('entity', 'entity', { unique: false });
      }
    };
  });
}

/**
 * Queue a change for offline synchronization
 */
export async function queueChange(change: Omit<PendingChange, 'id' | 'timestamp'>): Promise<void> {
  const database = await initDB();
  
  const pendingChange: PendingChange = {
    ...change,
    id: `${change.entity}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(pendingChange);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to queue change'));
  });
}

/**
 * Get all pending changes from IndexedDB
 */
async function getPendingChanges(): Promise<PendingChange[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const changes = request.result as PendingChange[];
      // Sort by timestamp to process in order
      changes.sort((a, b) => a.timestamp - b.timestamp);
      resolve(changes);
    };
    request.onerror = () => reject(new Error('Failed to get pending changes'));
  });
}

/**
 * Remove a pending change from IndexedDB
 */
async function removePendingChange(changeId: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(changeId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to remove pending change'));
  });
}

/**
 * Clear all pending changes from IndexedDB
 */
export async function clearPendingChanges(): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to clear pending changes'));
  });
}

/**
 * Process a single pending change
 */
async function processPendingChange(change: PendingChange): Promise<void> {
  try {
    switch (change.entity) {
      case 'project':
        await processProjectChange(change);
        break;
      case 'mockup':
        await processMockupChange(change);
        break;
      case 'brandKit':
        await processBrandKitChange(change);
        break;
      case 'template':
        await processTemplateChange(change);
        break;
      default:
        throw new Error(`Unknown entity type: ${change.entity}`);
    }
  } catch (error) {
    throw new Error(`Failed to process ${change.entity} ${change.type}: ${error}`);
  }
}

/**
 * Process project changes
 */
async function processProjectChange(change: PendingChange): Promise<void> {
  switch (change.type) {
    case 'create':
      await databaseService.createProject(change.userId, change.data);
      break;
    case 'update':
      await databaseService.updateProject(change.data.id, change.data.updates);
      break;
    case 'delete':
      await databaseService.deleteProject(change.data.id);
      break;
  }
}

/**
 * Process mockup changes
 */
async function processMockupChange(change: PendingChange): Promise<void> {
  switch (change.type) {
    case 'create':
      // For mockups, we need to upload the image first if it's base64
      if (change.data.base64Image) {
        const { imagePath, thumbnailPath } = await storageService.uploadBase64ImageWithThumbnail(
          change.userId,
          change.data.base64Image,
          change.data.fileName,
          'mockups'
        );
        await databaseService.saveMockup(
          change.data.projectId,
          change.userId,
          imagePath,
          thumbnailPath
        );
      } else {
        await databaseService.saveMockup(
          change.data.projectId,
          change.userId,
          change.data.imagePath,
          change.data.thumbnailPath
        );
      }
      break;
    case 'delete':
      if (change.data.imagePath) {
        await databaseService.deleteMockupByImagePath(change.data.imagePath);
        await storageService.deleteImage(change.data.imagePath);
      } else {
        await databaseService.deleteMockup(change.data.id);
      }
      break;
  }
}

/**
 * Process brand kit changes
 */
async function processBrandKitChange(change: PendingChange): Promise<void> {
  if (change.type === 'create' || change.type === 'update') {
    await databaseService.saveBrandKit(change.userId, change.data);
  }
}

/**
 * Process template changes
 */
async function processTemplateChange(change: PendingChange): Promise<void> {
  switch (change.type) {
    case 'create':
      await databaseService.savePromptTemplate(change.userId, change.data);
      break;
    case 'delete':
      await databaseService.deletePromptTemplate(change.data.id);
      break;
  }
}

/**
 * Synchronize all pending changes to Supabase
 */
export async function syncPendingChanges(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [],
  };

  // Check if online
  if (!isOnline()) {
    result.success = false;
    result.errors.push('Device is offline');
    return result;
  }

  try {
    const pendingChanges = await getPendingChanges();

    if (pendingChanges.length === 0) {
      return result;
    }

    // Process each change
    for (const change of pendingChanges) {
      try {
        await processPendingChange(change);
        await removePendingChange(change.id);
        result.synced++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to sync ${change.entity} ${change.type}: ${error}`);
        // Continue processing other changes even if one fails
      }
    }

    result.success = result.failed === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(`Sync failed: ${error}`);
  }

  return result;
}

/**
 * Check if the device is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Subscribe to connection status changes
 */
export function onConnectionChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Get count of pending changes
 */
export async function getPendingChangesCount(): Promise<number> {
  try {
    const changes = await getPendingChanges();
    return changes.length;
  } catch (error) {
    console.error('Failed to get pending changes count:', error);
    return 0;
  }
}

/**
 * Check if there are any pending changes
 */
export async function hasPendingChanges(): Promise<boolean> {
  const count = await getPendingChangesCount();
  return count > 0;
}
