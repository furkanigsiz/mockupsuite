/**
 * Offline-aware data service that wraps database operations with sync queue support
 * This service automatically queues changes when offline and syncs when back online
 */

import * as databaseService from './databaseService';
import * as storageService from './storageService';
import * as syncService from './syncService';
import { Project, BrandKit, PromptTemplate } from '../types';

/**
 * Create a new project with offline support
 */
export async function createProject(
  userId: string,
  project: Omit<Project, 'id'>
): Promise<Project> {
  if (!syncService.isOnline()) {
    // Queue for later sync
    await syncService.queueChange({
      type: 'create',
      entity: 'project',
      data: project,
      userId,
    });
    
    // Return optimistic result with temporary ID
    return {
      ...project,
      id: `temp_${Date.now()}`,
    };
  }

  return databaseService.createProject(userId, project);
}

/**
 * Update a project with offline support
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Project>,
  userId: string
): Promise<Project> {
  if (!syncService.isOnline()) {
    // Queue for later sync
    await syncService.queueChange({
      type: 'update',
      entity: 'project',
      data: { id: projectId, updates },
      userId,
    });
    
    // Return optimistic result
    return {
      id: projectId,
      ...updates,
    } as Project;
  }

  return databaseService.updateProject(projectId, updates);
}

/**
 * Delete a project with offline support
 */
export async function deleteProject(projectId: string, userId: string): Promise<void> {
  if (!syncService.isOnline()) {
    // Queue for later sync
    await syncService.queueChange({
      type: 'delete',
      entity: 'project',
      data: { id: projectId },
      userId,
    });
    return;
  }

  return databaseService.deleteProject(projectId);
}

/**
 * Save brand kit with offline support
 */
export async function saveBrandKit(userId: string, brandKit: BrandKit): Promise<BrandKit> {
  if (!syncService.isOnline()) {
    // Queue for later sync
    await syncService.queueChange({
      type: 'update',
      entity: 'brandKit',
      data: brandKit,
      userId,
    });
    
    // Return optimistic result
    return brandKit;
  }

  return databaseService.saveBrandKit(userId, brandKit);
}

/**
 * Save prompt template with offline support
 */
export async function savePromptTemplate(
  userId: string,
  template: PromptTemplate
): Promise<PromptTemplate> {
  if (!syncService.isOnline()) {
    // Queue for later sync
    await syncService.queueChange({
      type: 'create',
      entity: 'template',
      data: template,
      userId,
    });
    
    // Return optimistic result with temporary ID
    return {
      ...template,
      id: template.id || `temp_${Date.now()}`,
    };
  }

  return databaseService.savePromptTemplate(userId, template);
}

/**
 * Delete prompt template with offline support
 */
export async function deletePromptTemplate(
  templateId: string,
  userId: string
): Promise<void> {
  if (!syncService.isOnline()) {
    // Queue for later sync
    await syncService.queueChange({
      type: 'delete',
      entity: 'template',
      data: { id: templateId },
      userId,
    });
    return;
  }

  return databaseService.deletePromptTemplate(templateId);
}

/**
 * Save mockup with offline support
 */
export async function saveMockup(
  projectId: string,
  userId: string,
  base64Image: string,
  fileName: string
): Promise<string> {
  if (!syncService.isOnline()) {
    // Queue for later sync with base64 data
    await syncService.queueChange({
      type: 'create',
      entity: 'mockup',
      data: {
        projectId,
        base64Image,
        fileName,
      },
      userId,
    });
    
    // Return temporary path
    return `temp/${userId}/mockups/${Date.now()}_${fileName}`;
  }

  // Upload image and save to database
  const { imagePath, thumbnailPath } = await storageService.uploadBase64ImageWithThumbnail(
    userId,
    base64Image,
    fileName,
    'mockups'
  );
  
  await databaseService.saveMockup(projectId, userId, imagePath, thumbnailPath);
  return imagePath;
}

/**
 * Delete mockup with offline support
 */
export async function deleteMockup(
  imagePath: string,
  userId: string
): Promise<void> {
  if (!syncService.isOnline()) {
    // Queue for later sync
    await syncService.queueChange({
      type: 'delete',
      entity: 'mockup',
      data: { imagePath },
      userId,
    });
    return;
  }

  // Delete from database and storage
  await databaseService.deleteMockupByImagePath(imagePath);
  await storageService.deleteImage(imagePath);
}

// Re-export read operations directly from databaseService
// These don't need offline support as they only read data
export const getProjects = databaseService.getProjects;
export const getBrandKit = databaseService.getBrandKit;
export const getPromptTemplates = databaseService.getPromptTemplates;
export const getSavedMockups = databaseService.getSavedMockups;
