import { Project, BrandKit, PromptTemplate } from '../types';
import * as databaseService from './databaseService';
import * as storageService from './storageService';

export interface MigrationResult {
  success: boolean;
  projectsMigrated: number;
  mockupsMigrated: number;
  brandKitMigrated: boolean;
  templatesMigrated: number;
  errors: string[];
}

interface LocalStorageData {
  projects: Project[];
  brandKit: BrandKit | null;
  promptTemplates: PromptTemplate[];
}

/**
 * Checks if there is any data in localStorage that needs to be migrated
 */
export function hasLocalStorageData(): boolean {
  try {
    const projects = localStorage.getItem('projects');
    const brandKit = localStorage.getItem('brandKit');
    const promptTemplates = localStorage.getItem('promptTemplates');
    
    return !!(projects || brandKit || promptTemplates);
  } catch (error) {
    console.error('Error checking localStorage:', error);
    return false;
  }
}

/**
 * Retrieves all data from localStorage
 */
function getLocalStorageData(): LocalStorageData {
  const data: LocalStorageData = {
    projects: [],
    brandKit: null,
    promptTemplates: [],
  };

  try {
    const projectsStr = localStorage.getItem('projects');
    if (projectsStr) {
      data.projects = JSON.parse(projectsStr);
    }
  } catch (error) {
    console.error('Error parsing projects from localStorage:', error);
  }

  try {
    const brandKitStr = localStorage.getItem('brandKit');
    if (brandKitStr) {
      data.brandKit = JSON.parse(brandKitStr);
    }
  } catch (error) {
    console.error('Error parsing brandKit from localStorage:', error);
  }

  try {
    const templatesStr = localStorage.getItem('promptTemplates');
    if (templatesStr) {
      data.promptTemplates = JSON.parse(templatesStr);
    }
  } catch (error) {
    console.error('Error parsing promptTemplates from localStorage:', error);
  }

  return data;
}

/**
 * Migrates all localStorage data to Supabase
 */
export async function migrateToSupabase(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    projectsMigrated: 0,
    mockupsMigrated: 0,
    brandKitMigrated: false,
    templatesMigrated: 0,
    errors: [],
  };

  // Get all localStorage data
  const localData = getLocalStorageData();

  // Track original data for rollback
  const originalData = {
    projects: localData.projects,
    brandKit: localData.brandKit,
    promptTemplates: localData.promptTemplates,
  };

  try {
    // Migrate projects and their mockups
    if (localData.projects && localData.projects.length > 0) {
      for (const project of localData.projects) {
        try {
          // Create project in database (without transient data)
          const projectToCreate: Omit<Project, 'id'> = {
            name: project.name,
            uploadedImages: [],
            prompt: project.prompt,
            aspectRatio: project.aspectRatio,
            savedImages: [],
            suggestedPrompts: [],
          };

          const createdProject = await databaseService.createProject(userId, projectToCreate);
          result.projectsMigrated++;

          // Migrate saved mockups for this project
          if (project.savedImages && project.savedImages.length > 0) {
            for (const base64Image of project.savedImages) {
              try {
                // Upload image to storage
                const fileName = `migrated_mockup_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
                const { imagePath, thumbnailPath } = await storageService.uploadBase64ImageWithThumbnail(
                  userId,
                  base64Image,
                  fileName,
                  'mockups'
                );

                // Save mockup record to database
                await databaseService.saveMockup(createdProject.id, userId, imagePath, thumbnailPath);
                result.mockupsMigrated++;
              } catch (error) {
                console.error('Error migrating mockup:', error);
                result.errors.push(`Failed to migrate mockup: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }
        } catch (error) {
          console.error('Error migrating project:', error);
          result.errors.push(`Failed to migrate project "${project.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Migrate brand kit
    if (localData.brandKit) {
      try {
        let logoPath: string | null = null;

        // Upload logo if it exists
        if (localData.brandKit.logo) {
          try {
            const fileName = `brand_logo_${Date.now()}.png`;
            logoPath = await storageService.uploadBase64Image(
              userId,
              localData.brandKit.logo,
              fileName,
              'logos'
            );
          } catch (error) {
            console.error('Error uploading brand kit logo:', error);
            result.errors.push(`Failed to upload brand kit logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Save brand kit to database
        const brandKitToSave: BrandKit = {
          logo: logoPath,
          useWatermark: localData.brandKit.useWatermark,
          colors: localData.brandKit.colors,
        };

        await databaseService.saveBrandKit(userId, brandKitToSave);
        result.brandKitMigrated = true;
      } catch (error) {
        console.error('Error migrating brand kit:', error);
        result.errors.push(`Failed to migrate brand kit: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Migrate prompt templates
    if (localData.promptTemplates && localData.promptTemplates.length > 0) {
      for (const template of localData.promptTemplates) {
        try {
          await databaseService.savePromptTemplate(userId, template);
          result.templatesMigrated++;
        } catch (error) {
          console.error('Error migrating prompt template:', error);
          result.errors.push(`Failed to migrate prompt template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Migration successful if at least some data was migrated
    result.success = result.projectsMigrated > 0 || result.brandKitMigrated || result.templatesMigrated > 0;

    return result;
  } catch (error) {
    console.error('Critical error during migration:', error);
    result.errors.push(`Critical migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.success = false;

    // Attempt rollback - delete any data that was created
    try {
      await rollbackMigration(userId, result);
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
      result.errors.push(`Rollback failed: ${rollbackError instanceof Error ? rollbackError.message : 'Unknown error'}`);
    }

    return result;
  }
}

/**
 * Attempts to rollback a failed migration by deleting created data
 */
async function rollbackMigration(userId: string, result: MigrationResult): Promise<void> {
  console.log('Attempting to rollback migration...');

  // Fetch all projects created during migration
  try {
    const projects = await databaseService.getProjects(userId);
    
    // Delete all projects (this will cascade delete mockups)
    for (const project of projects) {
      try {
        await databaseService.deleteProject(project.id);
      } catch (error) {
        console.error('Error deleting project during rollback:', error);
      }
    }
  } catch (error) {
    console.error('Error fetching projects during rollback:', error);
  }

  // Note: We don't delete brand kit or templates during rollback
  // as they might have been partially successful and user may want to keep them
}

/**
 * Clears all migrated data from localStorage
 */
export function clearLocalStorage(): void {
  try {
    localStorage.removeItem('projects');
    localStorage.removeItem('brandKit');
    localStorage.removeItem('promptTemplates');
    console.log('localStorage cleared successfully');
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    throw new Error('Failed to clear localStorage');
  }
}

/**
 * Creates a backup of localStorage data before migration
 */
export function backupLocalStorage(): string {
  try {
    const data = getLocalStorageData();
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error creating localStorage backup:', error);
    throw new Error('Failed to create backup');
  }
}

/**
 * Restores localStorage data from a backup
 */
export function restoreLocalStorage(backup: string): void {
  try {
    const data: LocalStorageData = JSON.parse(backup);
    
    if (data.projects) {
      localStorage.setItem('projects', JSON.stringify(data.projects));
    }
    if (data.brandKit) {
      localStorage.setItem('brandKit', JSON.stringify(data.brandKit));
    }
    if (data.promptTemplates) {
      localStorage.setItem('promptTemplates', JSON.stringify(data.promptTemplates));
    }
    
    console.log('localStorage restored successfully');
  } catch (error) {
    console.error('Error restoring localStorage:', error);
    throw new Error('Failed to restore backup');
  }
}
