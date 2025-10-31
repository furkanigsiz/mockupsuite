import React from 'react';
import { PromptTemplate } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useAuth } from './AuthProvider';
import * as offlineDataService from '../services/offlineDataService';
import TrashIcon from './icons/TrashIcon';

interface PromptTemplatesProps {
  templates: PromptTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<PromptTemplate[]>>;
  onSelectTemplate: (text: string) => void;
}

const PromptTemplates: React.FC<PromptTemplatesProps> = ({ templates, setTemplates, onSelectTemplate }) => {
  const { t } = useTranslations();
  const { user } = useAuth();

  const handleRemoveTemplate = async (id: string) => {
    if (!user) return;
    
    try {
      await offlineDataService.deletePromptTemplate(id, user.id);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (e) {
      console.error('Failed to delete prompt template:', e);
      alert('Failed to delete template. Please try again.');
    }
  };
  
  if (templates.length === 0) {
      return null;
  }

  return (
    <div className="w-full space-y-2">
      <h3 className="text-sm font-medium text-gray-300">{t('prompt_templates_title')}</h3>
      <div className="flex flex-wrap gap-2">
        {templates.map(template => (
          <div key={template.id} className="group relative bg-gray-800 rounded-md flex items-center">
            <button
              onClick={() => onSelectTemplate(template.text)}
              className="text-xs text-left py-1 px-2 hover:bg-gray-700/80 rounded-l-md transition-colors truncate max-w-[200px]"
              title={template.text}
            >
              {template.text}
            </button>
             <button
              onClick={() => handleRemoveTemplate(template.id)}
              className="p-1 text-gray-500 hover:text-red-400 rounded-r-md transition-colors opacity-50 group-hover:opacity-100"
              title="Remove Template"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromptTemplates;
