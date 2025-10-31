import React from 'react';
import { Project } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useAuth } from './AuthProvider';
import * as offlineDataService from '../services/offlineDataService';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface ProjectManagerProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, setProjects, currentProjectId, setCurrentProjectId }) => {
  const { t } = useTranslations();
  const { user } = useAuth();

  const handleCreateProject = async () => {
    if (!user) return;
    
    const newProjectBaseName = t('new_project_default_name') as string;
    
    // Find highest number among existing projects
    const existingNums = projects
        .map(p => {
            const match = p.name.match(new RegExp(`^${newProjectBaseName} (\\d+)$`));
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => num > 0);

    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    const newProjectName = `${newProjectBaseName} ${nextNum}`;
    
    const newProject: Project = {
      id: '',
      name: newProjectName,
      uploadedImages: [],
      prompt: '',
      aspectRatio: '1:1',
      savedImages: [],
      suggestedPrompts: [],
    };
    
    try {
      const createdProject = await offlineDataService.createProject(user.id, newProject);
      const updatedProjects = [...projects, createdProject];
      setProjects(updatedProjects);
      setCurrentProjectId(createdProject.id);
    } catch (e) {
      console.error('Failed to create project:', e);
      alert('Failed to create project. Please try again.');
    }
  };

  const handleDeleteProject = async () => {
    if (!user || !currentProjectId) return;
    
    if (projects.length <= 1) {
      alert("You cannot delete the last project.");
      return;
    }
    
    try {
      await offlineDataService.deleteProject(currentProjectId, user.id);
      const remainingProjects = projects.filter(p => p.id !== currentProjectId);
      setProjects(remainingProjects);
      setCurrentProjectId(remainingProjects[0]?.id || null);
    } catch (e) {
      console.error('Failed to delete project:', e);
      alert('Failed to delete project. Please try again.');
    }
  };

  return (
    <div className="w-full bg-gray-800/50 p-4 rounded-lg border border-gray-700">
      <h2 className="text-lg font-bold text-gray-100 mb-3">{t('project_manager_title')}</h2>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
            <select
            value={currentProjectId || ''}
            onChange={(e) => setCurrentProjectId(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-primary focus:border-primary"
            >
            {projects.map(project => (
                <option key={project.id} value={project.id}>
                {project.name}
                </option>
            ))}
            </select>
            <button onClick={handleDeleteProject} className="p-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={t('delete_project_button')} disabled={projects.length <= 1}>
                <TrashIcon className="h-5 w-5" />
            </button>
        </div>
        <button
          onClick={handleCreateProject}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2 px-4 rounded-md bg-primary hover:bg-primary/80 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          {t('create_project_button')}
        </button>
      </div>
    </div>
  );
};

export default ProjectManager;
