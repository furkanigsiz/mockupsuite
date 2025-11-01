import React from 'react';
import { AppMode, Project, BrandKit as BrandKitType, PromptTemplate, ProductTemplate, UploadedImage } from '../types';
import ModeSwitcher from './ModeSwitcher';
import ProjectManager from './ProjectManager';
import ImageUploader from './ImageUploader';
import { useTranslations } from '../hooks/useTranslations';
import SaveIcon from './icons/SaveIcon';
import PromptTemplates from './PromptTemplates';
import SparklesIcon from './icons/SparklesIcon';
import ProductSelector from './ProductSelector';
import DesignUploader from './DesignUploader';
import StyleSelector, { StylePreset } from './StyleSelector';
import BrandKit from './BrandKit';
import VideoGeneratorControls from './VideoGeneratorControls';

const PRODUCT_COLORS = ['White', 'Black', 'Gray', 'Navy', 'Red', 'Green'];

interface GeneratorControlsProps {
    mode: AppMode;
    setMode: (mode: AppMode) => void;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    currentProjectId: string | null;
    setCurrentProjectId: (id: string) => void;
    currentProject: Project;
    updateCurrentProject: (updates: Partial<Project>) => void;
    promptTemplates: PromptTemplate[];
    setPromptTemplates: React.Dispatch<React.SetStateAction<PromptTemplate[]>>;
    handleSuggestPrompts: () => void;
    isSuggesting: boolean;
    handleSavePrompt: () => void;
    selectedProduct: ProductTemplate | null;
    setSelectedProduct: (product: ProductTemplate) => void;
    designImage: any; // UploadedImage | null
    setDesignImage: (image: any) => void;
    productColor: string;
    setProductColor: (color: string) => void;
    productStyle: StylePreset;
    setProductStyle: (style: StylePreset) => void;
    stylePrompt: string;
    setStylePrompt: (prompt: string) => void;
    brandKit: BrandKitType;
    setBrandKit: React.Dispatch<React.SetStateAction<BrandKitType>>;
    isLoading: boolean;
    handleSceneGenerate: () => void;
    handleProductGenerate: () => void;
    // Video mode props
    videoSourceImage?: UploadedImage | null;
    onVideoSourceImageChange?: (image: UploadedImage | null) => void;
    videoPrompt?: string;
    onVideoPromptChange?: (prompt: string) => void;
    videoDuration?: number;
    onVideoDurationChange?: (duration: number) => void;
    videoAspectRatio?: '16:9' | '9:16' | '1:1';
    onVideoAspectRatioChange?: (ratio: '16:9' | '9:16' | '1:1') => void;
    handleVideoGenerate?: () => void;
    videoSuggestedPrompts?: string[];
    handleVideoSuggestPrompts?: () => void;
    isVideoSuggesting?: boolean;
}

const GeneratorControls: React.FC<GeneratorControlsProps> = (props) => {
    const { t } = useTranslations();
    const {
        mode, setMode, projects, setProjects, currentProjectId, setCurrentProjectId,
        currentProject, updateCurrentProject, promptTemplates, setPromptTemplates,
        handleSuggestPrompts, isSuggesting, handleSavePrompt, selectedProduct,
        setSelectedProduct, designImage, setDesignImage, productColor, setProductColor,
        productStyle, setProductStyle, stylePrompt, setStylePrompt, brandKit,
        setBrandKit, isLoading, handleSceneGenerate, handleProductGenerate,
        videoSourceImage, onVideoSourceImageChange, videoPrompt, onVideoPromptChange,
        videoDuration, onVideoDurationChange, videoAspectRatio, onVideoAspectRatioChange,
        handleVideoGenerate, videoSuggestedPrompts, handleVideoSuggestPrompts, isVideoSuggesting
    } = props;

    const aspectRatios = [
        { value: '1:1', label: 'aspect_ratio_square' },
        { value: '16:9', label: 'aspect_ratio_landscape' },
        { value: '9:16', label: 'aspect_ratio_portrait' },
    ] as const;

    const handleGenerateClick = mode === 'scene' ? handleSceneGenerate : handleProductGenerate;
    const isGenerateDisabled = isLoading || (mode === 'scene'
        ? (!currentProject || currentProject.uploadedImages.length === 0 || !currentProject.prompt.trim())
        : (!selectedProduct || !designImage));

    // If video mode, render VideoGeneratorControls
    if (mode === 'video') {
        return (
            <VideoGeneratorControls
                mode={mode}
                onModeChange={setMode}
                sourceImage={videoSourceImage || null}
                onSourceImageChange={onVideoSourceImageChange || (() => {})}
                videoPrompt={videoPrompt || ''}
                onVideoPromptChange={onVideoPromptChange || (() => {})}
                videoDuration={videoDuration || 7}
                onVideoDurationChange={onVideoDurationChange || (() => {})}
                videoAspectRatio={videoAspectRatio || '16:9'}
                onVideoAspectRatioChange={onVideoAspectRatioChange || (() => {})}
                isLoading={isLoading}
                onGenerate={handleVideoGenerate || (() => {})}
                onSuggestPrompts={handleVideoSuggestPrompts}
                isSuggesting={isVideoSuggesting || false}
                suggestedPrompts={videoSuggestedPrompts || []}
            />
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <ModeSwitcher currentMode={mode} onModeChange={setMode} />
            <ProjectManager projects={projects} setProjects={setProjects} currentProjectId={currentProjectId} setCurrentProjectId={setCurrentProjectId} />

            {mode === 'scene' ? (
                <>
                    <ImageUploader onImagesChange={(images) => updateCurrentProject({ uploadedImages: images })} uploadedImages={currentProject.uploadedImages} />
                    <div className="flex flex-col gap-4">
                        <h2 className="text-neutral-dark dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4">{t('scene_prompt_title')}</h2>
                        <div className="relative px-4">
                            <textarea
                                id="prompt"
                                value={currentProject.prompt}
                                onChange={(e) => updateCurrentProject({ prompt: e.target.value })}
                                placeholder={t('prompt_placeholder') as string}
                                rows={4}
                                className="w-full bg-neutral-light dark:bg-neutral-dark/40 border-2 border-transparent rounded-lg p-3 pr-10 text-neutral-dark dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary transition"
                            />
                            <button onClick={handleSavePrompt} title={t('save_prompt_button')} className="absolute top-3 right-6 p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50" disabled={!currentProject.prompt.trim() || promptTemplates.some(p => p.text === currentProject.prompt)}>
                                <SaveIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    <div className="px-4">
                        <PromptTemplates templates={promptTemplates} setTemplates={setPromptTemplates} onSelectTemplate={(text) => updateCurrentProject({ prompt: text })} />
                    </div>
                    <div className="space-y-2 px-4">
                        <button onClick={handleSuggestPrompts} disabled={isSuggesting || currentProject.uploadedImages.length === 0} className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg bg-neutral-light dark:bg-neutral-dark/40 hover:bg-neutral-medium/20 dark:hover:bg-neutral-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <SparklesIcon className="h-4 w-4 text-custom-accent" />
                            {isSuggesting ? t('suggest_button_loading') : t('suggest_button')}
                        </button>
                        {currentProject.suggestedPrompts.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                {currentProject.suggestedPrompts.map((p, i) => (
                                    <button key={i} onClick={() => updateCurrentProject({ prompt: p })} className="text-xs text-left p-2 bg-neutral-light dark:bg-neutral-dark/40 hover:bg-neutral-medium/20 dark:hover:bg-neutral-dark rounded-md transition-colors truncate" title={p}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                     <div className="px-4">
                        <h2 className="text-neutral-dark dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">{t('aspect_ratio_label')}</h2>
                        <div className="grid grid-cols-3 gap-2">
                            {aspectRatios.map(ratio => (
                                <button key={ratio.value} onClick={() => updateCurrentProject({ aspectRatio: ratio.value })} className={`py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${currentProject.aspectRatio === ratio.value ? 'bg-primary text-background-dark' : 'bg-neutral-light dark:bg-neutral-dark/40 hover:bg-neutral-medium/20 dark:hover:bg-neutral-dark'}`}>
                                    {t(ratio.label)}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <DesignUploader design={designImage} onDesignChange={setDesignImage} />
                    <ProductSelector selectedProduct={selectedProduct} onSelectProduct={setSelectedProduct} />
                    <div className="flex flex-col gap-4 px-4">
                        <h2 className="text-neutral-dark dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">{t('step_3_title')}</h2>
                        <div>
                            <label className="block text-sm font-medium text-neutral-medium mb-2">{t('color_label')}</label>
                            <div className="flex flex-wrap gap-2">
                                {PRODUCT_COLORS.map(color => (
                                    <button key={color} onClick={() => setProductColor(color)} className={`px-3 py-1 text-sm rounded-full border-2 ${productColor === color ? 'border-primary bg-primary/20 text-primary' : 'border-neutral-medium/40 bg-transparent text-neutral-medium hover:border-neutral-medium'}`} >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-medium mb-2">{t('style_selector_title')}</label>
                            <StyleSelector selectedStyle={productStyle} onSelectStyle={setProductStyle} />
                        </div>
                         <div>
                            <label htmlFor="style-prompt" className="block text-sm font-medium text-neutral-medium">{t('style_prompt_label')}</label>
                            <input
                                id="style-prompt"
                                type="text"
                                value={stylePrompt}
                                onChange={(e) => setStylePrompt(e.target.value)}
                                placeholder={t('style_prompt_placeholder') as string}
                                className="mt-1 w-full h-12 bg-neutral-light dark:bg-neutral-dark/40 border border-transparent rounded-lg py-2 px-3 text-sm text-neutral-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-neutral-medium"
                            />
                        </div>
                    </div>
                </>
            )}

            <div className="px-4">
                <BrandKit brandKit={brandKit} setBrandKit={setBrandKit} />
            </div>

            <div className="mt-6 px-4">
                <button
                    onClick={handleGenerateClick}
                    className="w-full flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-background-dark text-base font-bold leading-normal tracking-[0.015em] disabled:bg-neutral-medium/50 disabled:cursor-not-allowed"
                    disabled={isGenerateDisabled}
                >
                    <span className="truncate">{isLoading ? t('generate_button_loading') : t('generate_button')}</span>
                </button>
            </div>
        </div>
    );
};

export default GeneratorControls;
