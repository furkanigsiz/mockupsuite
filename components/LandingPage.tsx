import React, { useState, useRef } from 'react';
import AuthPage from './AuthPage';
import { useTranslations } from '../hooks/useTranslations';
import { HelpCenterPage } from './HelpCenterPage';
import ExamplesPage from './ExamplesPage';

interface LandingPageProps {
    onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    const [showAuth, setShowAuth] = useState(false);
    const [showHelpCenter, setShowHelpCenter] = useState(false);
    const [showExamples, setShowExamples] = useState(false);
    const { t } = useTranslations();
    
    // Refs for smooth scrolling
    const featuresRef = useRef<HTMLDivElement>(null);
    const pricingRef = useRef<HTMLDivElement>(null);
    const faqRef = useRef<HTMLDivElement>(null);
    
    // Smooth scroll function
    const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (showAuth) {
        return <AuthPage />;
    }
    
    if (showExamples) {
        return <ExamplesPage onBack={() => setShowExamples(false)} onSignIn={() => setShowAuth(true)} />;
    }
    
    if (showHelpCenter) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark">
                {/* Simple Header for Help Center */}
                <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                        <button 
                            onClick={() => setShowHelpCenter(false)}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="font-medium">{t('landing_back_to_home')}</span>
                        </button>
                        <button 
                            onClick={() => setShowAuth(true)}
                            className="px-4 py-2 rounded-lg bg-primary text-gray-900 dark:text-[#111718] font-medium hover:opacity-90 transition-opacity"
                        >
                            {t('landing_sign_in')}
                        </button>
                    </div>
                </header>
                <HelpCenterPage />
            </div>
        );
    }
    return (
        <div className="relative flex w-full flex-col">
            <div className="layout-container flex h-full grow flex-col">
                <div className="px-4 sm:px-10 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
                    <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
                        {/* TopNavBar */}
                        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 dark:border-b-[#283639] px-4 sm:px-10 py-3">
                            <div className="flex items-center gap-4 text-gray-800 dark:text-white">
                                <div className="size-6">
                                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="20" y="10" width="40" height="40" fill="#6366F1" rx="4"/>
                                        <rect x="40" y="30" width="40" height="60" fill="#6366F1" rx="4"/>
                                    </svg>
                                </div>
                                <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">MockupSuite</h2>
                            </div>
                            <div className="hidden md:flex flex-1 justify-end gap-8">
                                <div className="flex items-center gap-9">
                                    <button 
                                        onClick={() => scrollToSection(featuresRef)} 
                                        className="text-gray-600 dark:text-white text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer"
                                    >
                                        {t('landing_nav_features')}
                                    </button>
                                    <button 
                                        onClick={() => scrollToSection(pricingRef)} 
                                        className="text-gray-600 dark:text-white text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer"
                                    >
                                        {t('landing_nav_pricing')}
                                    </button>
                                    <button 
                                        onClick={() => setShowExamples(true)} 
                                        className="text-gray-600 dark:text-white text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer"
                                    >
                                        Örnekler
                                    </button>
                                    <button 
                                        onClick={() => scrollToSection(faqRef)} 
                                        className="text-gray-600 dark:text-white text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer"
                                    >
                                        {t('landing_nav_faq')}
                                    </button>
                                    <a 
                                        href="mailto:support@mockupsuite.com" 
                                        className="text-gray-600 dark:text-white text-sm font-medium leading-normal hover:text-primary transition-colors"
                                    >
                                        {t('landing_nav_contact')}
                                    </a>
                                </div>
                                <button onClick={() => setShowAuth(true)} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-gray-900 dark:text-[#111718] text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity">
                                    <span className="truncate">{t('landing_get_started_free')}</span>
                                </button>
                            </div>
                        </header>
                        <main className="flex-1">
                            {/* HeroSection */}
                            <div className="py-16 sm:py-24">
                                <div className="@container">
                                    <div className="flex flex-col gap-8 px-4 py-10 @[480px]:gap-10 @[864px]:flex-row-reverse">
                                        <div className="w-full bg-center bg-no-repeat aspect-square sm:aspect-video bg-cover rounded-xl @[480px]:h-auto @[480px]:min-w-[300px] @[864px]:w-full" data-alt="An AI-generated mockup of a product on a clean background, showing a before-and-after effect." style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBVXGcJzgLeQzfxHwt5gzzDrpt1Y3t0s7bh1euERG22VQFaUygaboJajcspvYFZIIeYzCOMHCF9D90hDe3vEgik7JCpKmpTvjmZmCzF3vB145voTnMfs8XecktJnX2Yy6uagonS5daKOtZyenH3bcYtu-_uTkSDp5yTjU7uKdVYvX2Z2hFjJpb2z-XhkaCQvQY1MYn7UKrKKjrqSjnas2E35IqvvM0JogbVryibQM0UBye3E_KE8qr0W3dkyc-O501pNwL5o9gipxg")' }}></div>
                                        <div className="flex flex-col gap-6 @[480px]:min-w-[400px] @[480px]:gap-8 @[864px]:justify-center">
                                            <div className="flex flex-col gap-4 text-left">
                                                <h1 className="text-gray-900 dark:text-white text-4xl font-bold leading-tight tracking-tighter @[480px]:text-5xl">
                                                    {t('landing_hero_title')}
                                                </h1>
                                                <h2 className="text-gray-600 dark:text-gray-300 text-base font-normal leading-normal @[480px]:text-lg">
                                                    {t('landing_hero_subtitle')}
                                                </h2>
                                            </div>
                                            <div className="flex-wrap gap-3 flex">
                                                <button onClick={() => setShowAuth(true)} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 @[480px]:h-12 @[480px]:px-5 bg-primary text-gray-900 dark:text-[#111718] text-sm font-bold leading-normal tracking-[0.015em] @[480px]:text-base">
                                                    <span className="truncate">{t('landing_hero_generate_button')}</span>
                                                </button>
                                                <button onClick={() => setShowExamples(true)} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 @[480px]:h-12 @[480px]:px-5 bg-gray-200 dark:bg-[#283639] text-gray-800 dark:text-white text-sm font-bold leading-normal tracking-[0.015em] @[480px]:text-base">
                                                    <span className="truncate">{t('landing_hero_examples_button')}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* How It Works Section */}
                            <div ref={featuresRef} className="py-16 sm:py-24">
                                <h2 className="text-gray-900 dark:text-white text-2xl font-bold leading-tight tracking-tight px-4 pb-8 pt-5 text-center">{t('landing_how_it_works_title')}</h2>
                                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 p-4">
                                    <div className="flex flex-1 gap-4 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col text-center items-center">
                                        <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">{t('landing_step_1_title')}</h3>
                                            <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">{t('landing_step_1_description')}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-1 gap-4 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col text-center items-center">
                                        <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">{t('landing_step_2_title')}</h3>
                                            <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">{t('landing_step_2_description')}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-1 gap-4 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col text-center items-center">
                                        <span className="material-symbols-outlined text-primary text-3xl">download</span>
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">{t('landing_step_3_title')}</h3>
                                            <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">{t('landing_step_3_description')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Feature Showcase Section */}
                            <div className="py-16 sm:py-24">
                                <div className="flex flex-col gap-10 px-4 py-10 @container">
                                    <div className="flex flex-col gap-4 max-w-[720px] mx-auto text-center">
                                        <h1 className="text-gray-900 dark:text-white text-[32px] font-bold leading-tight @[480px]:text-4xl">
                                            {t('landing_features_title')}
                                        </h1>
                                        <p className="text-gray-600 dark:text-gray-300 text-base font-normal leading-normal">{t('landing_features_subtitle')}</p>
                                    </div>
                                    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 p-0">
                                        <div className="flex flex-1 gap-3 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col">
                                            <span className="material-symbols-outlined text-primary text-2xl">photo_camera</span>
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">{t('landing_feature_1_title')}</h3>
                                                <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">{t('landing_feature_1_description')}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 gap-3 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col">
                                            <span className="material-symbols-outlined text-primary text-2xl">inventory_2</span>
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">{t('landing_feature_2_title')}</h3>
                                                <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">{t('landing_feature_2_description')}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 gap-3 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col">
                                            <span className="material-symbols-outlined text-primary text-2xl">light_mode</span>
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">{t('landing_feature_3_title')}</h3>
                                                <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">{t('landing_feature_3_description')}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 gap-3 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col">
                                            <span className="material-symbols-outlined text-primary text-2xl">image</span>
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">{t('landing_feature_4_title')}</h3>
                                                <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">{t('landing_feature_4_description')}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 gap-3 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col">
                                            <span className="material-symbols-outlined text-primary text-2xl">video_library</span>
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">Video Üretimi</h3>
                                                <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">Ürünlerinizi dinamik videolara dönüştürün ve sosyal medyada öne çıkın</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 gap-3 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col">
                                            <span className="material-symbols-outlined text-primary text-2xl">layers</span>
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">Tasarım Yerleştirme</h3>
                                                <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">Tasarımlarınızı tişört, kupa, telefon kılıfı gibi ürünlere otomatik yerleştirin</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 gap-3 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 flex-col">
                                            <span className="material-symbols-outlined text-primary text-2xl">auto_fix_high</span>
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">Arka Plan Silme</h3>
                                                <p className="text-gray-500 dark:text-[#9db4b9] text-sm font-normal leading-normal">AI ile ürün fotoğraflarınızın arka planını tek tıkla kaldırın</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Pricing Section */}
                            <div ref={pricingRef} className="py-16 sm:py-24">
                                <div className="flex flex-col gap-10 px-4 py-10">
                                    <div className="flex flex-col gap-4 max-w-[720px] mx-auto text-center">
                                        <h2 className="text-gray-900 dark:text-white text-[32px] font-bold leading-tight @[480px]:text-4xl">
                                            {t('pricing_title')}
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-300 text-base font-normal leading-normal">
                                            {t('pricing_subtitle')}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
                                        {/* Free Plan */}
                                        <div className="flex flex-col justify-between gap-6 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 transition-all duration-200 hover:shadow-lg">
                                            <div className="flex flex-col gap-6">
                                                <div className="flex flex-col gap-2">
                                                    <h3 className="text-gray-900 dark:text-white text-xl font-bold">{t('pricing_plan_free_name')}</h3>
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('pricing_plan_free_description')}</p>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">0</span>
                                                    <span className="text-gray-500 dark:text-gray-400 text-sm">TRY{t('pricing_per_month')}</span>
                                                </div>
                                                <ul className="flex flex-col gap-3 flex-grow">
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_quota', { quota: '5' })}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_watermark')}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_community_support')}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                            <button onClick={() => setShowAuth(true)} className="w-full py-3 px-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mt-auto">
                                                {t('pricing_start_free')}
                                            </button>
                                        </div>

                                        {/* Starter Plan */}
                                        <div className="flex flex-col justify-between gap-6 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 transition-all duration-200 hover:shadow-lg">
                                            <div className="flex flex-col gap-6">
                                                <div className="flex flex-col gap-2">
                                                    <h3 className="text-gray-900 dark:text-white text-xl font-bold">{t('pricing_plan_starter_name')}</h3>
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('pricing_plan_starter_description')}</p>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">299</span>
                                                    <span className="text-gray-500 dark:text-gray-400 text-sm">TRY{t('pricing_per_month')}</span>
                                                </div>
                                                <ul className="flex flex-col gap-3 flex-grow">
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_quota', { quota: '50' })}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_no_watermark')}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_high_resolution')}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_email_support')}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                            <button onClick={() => setShowAuth(true)} className="w-full py-3 px-4 rounded-lg bg-primary text-gray-900 dark:text-[#111718] font-bold hover:opacity-90 transition-opacity mt-auto">
                                                {t('pricing_choose_plan')}
                                            </button>
                                        </div>

                                        {/* Pro Plan - Most Popular */}
                                        <div className="flex flex-col justify-between gap-6 rounded-xl border-2 border-primary bg-white dark:bg-[#1c2527] p-6 relative transition-all duration-200 hover:shadow-xl">
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-gray-900 dark:text-[#111718] px-4 py-1 rounded-full text-xs font-bold">
                                                {t('pricing_most_popular')}
                                            </div>
                                            <div className="flex flex-col gap-6">
                                                <div className="flex flex-col gap-2">
                                                    <h3 className="text-gray-900 dark:text-white text-xl font-bold">{t('pricing_plan_pro_name')}</h3>
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('pricing_plan_pro_description')}</p>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">649</span>
                                                    <span className="text-gray-500 dark:text-gray-400 text-sm">TRY{t('pricing_per_month')}</span>
                                                </div>
                                                <ul className="flex flex-col gap-3 flex-grow">
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_quota', { quota: '200' })}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_no_watermark')}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_high_resolution')}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_priority_queue')}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_priority_support')}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                            <button onClick={() => setShowAuth(true)} className="w-full py-3 px-4 rounded-lg bg-primary text-gray-900 dark:text-[#111718] font-bold hover:opacity-90 transition-opacity mt-auto">
                                                {t('pricing_choose_plan')}
                                            </button>
                                        </div>

                                        {/* Business Plan */}
                                        <div className="flex flex-col justify-between gap-6 rounded-xl border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] p-6 transition-all duration-200 hover:shadow-lg">
                                            <div className="flex flex-col gap-6">
                                                <div className="flex flex-col gap-2">
                                                    <h3 className="text-gray-900 dark:text-white text-xl font-bold">{t('pricing_plan_business_name')}</h3>
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('pricing_plan_business_description')}</p>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">1,199</span>
                                                    <span className="text-gray-500 dark:text-gray-400 text-sm">TRY{t('pricing_per_month')}</span>
                                                </div>
                                                <ul className="flex flex-col gap-3 flex-grow">
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_quota', { quota: '700' })}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_no_watermark')}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_high_resolution')}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_priority_queue')}</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('pricing_feature_priority_support')}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                            <button onClick={() => setShowAuth(true)} className="w-full py-3 px-4 rounded-lg bg-primary text-gray-900 dark:text-[#111718] font-bold hover:opacity-90 transition-opacity mt-auto">
                                                {t('pricing_choose_plan')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* FAQ Section */}
                            <div ref={faqRef} className="py-16 sm:py-24">
                                <div className="flex flex-col gap-10 px-4 py-10">
                                    <div className="flex flex-col gap-4 max-w-[720px] mx-auto text-center">
                                        <h2 className="text-gray-900 dark:text-white text-[32px] font-bold leading-tight @[480px]:text-4xl">
                                            {t('help_center_title')}
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-300 text-base font-normal leading-normal">
                                            {t('help_center_subtitle')}
                                        </p>
                                    </div>
                                    <div className="max-w-3xl mx-auto w-full">
                                        <div className="space-y-4">
                                            {/* FAQ Item 1 */}
                                            <details className="group border border-gray-200 dark:border-[#3b4f54] rounded-lg bg-white dark:bg-[#1c2527] transition-all duration-200 hover:shadow-md">
                                                <summary className="flex items-center justify-between cursor-pointer p-6 text-left transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">
                                                    <span className="text-base font-medium text-gray-900 dark:text-white">{t('faq_gs_1_question')}</span>
                                                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ease-in-out group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </summary>
                                                <div className="px-6 pb-6 pt-2">
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                        {t('faq_gs_1_answer')}
                                                    </p>
                                                </div>
                                            </details>

                                            {/* FAQ Item 2 */}
                                            <details className="group border border-gray-200 dark:border-[#3b4f54] rounded-lg bg-white dark:bg-[#1c2527] transition-all duration-200 hover:shadow-md">
                                                <summary className="flex items-center justify-between cursor-pointer p-6 text-left transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">
                                                    <span className="text-base font-medium text-gray-900 dark:text-white">{t('faq_gs_2_question')}</span>
                                                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ease-in-out group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </summary>
                                                <div className="px-6 pb-6 pt-2">
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                        {t('faq_gs_2_answer')}
                                                    </p>
                                                </div>
                                            </details>

                                            {/* FAQ Item 3 */}
                                            <details className="group border border-gray-200 dark:border-[#3b4f54] rounded-lg bg-white dark:bg-[#1c2527] transition-all duration-200 hover:shadow-md">
                                                <summary className="flex items-center justify-between cursor-pointer p-6 text-left transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">
                                                    <span className="text-base font-medium text-gray-900 dark:text-white">{t('faq_billing_1_question')}</span>
                                                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ease-in-out group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </summary>
                                                <div className="px-6 pb-6 pt-2">
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                        {t('faq_billing_1_answer')}
                                                    </p>
                                                </div>
                                            </details>

                                            {/* FAQ Item 4 */}
                                            <details className="group border border-gray-200 dark:border-[#3b4f54] rounded-lg bg-white dark:bg-[#1c2527] transition-all duration-200 hover:shadow-md">
                                                <summary className="flex items-center justify-between cursor-pointer p-6 text-left transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">
                                                    <span className="text-base font-medium text-gray-900 dark:text-white">{t('faq_ai_1_question')}</span>
                                                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ease-in-out group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </summary>
                                                <div className="px-6 pb-6 pt-2">
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                        {t('faq_ai_1_answer')}
                                                    </p>
                                                </div>
                                            </details>

                                            {/* FAQ Item 5 */}
                                            <details className="group border border-gray-200 dark:border-[#3b4f54] rounded-lg bg-white dark:bg-[#1c2527] transition-all duration-200 hover:shadow-md">
                                                <summary className="flex items-center justify-between cursor-pointer p-6 text-left transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">
                                                    <span className="text-base font-medium text-gray-900 dark:text-white">{t('faq_billing_2_question')}</span>
                                                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ease-in-out group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </summary>
                                                <div className="px-6 pb-6 pt-2">
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                        {t('faq_billing_2_answer')}
                                                    </p>
                                                </div>
                                            </details>
                                        </div>
                                        
                                        {/* View All FAQs Button */}
                                        <div className="mt-8 text-center">
                                            <div className="inline-flex flex-col items-center gap-3">
                                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                    {t('landing_faq_more_questions')}
                                                </p>
                                                <button 
                                                    onClick={() => setShowHelpCenter(true)}
                                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-primary text-primary font-medium hover:bg-primary hover:text-white dark:hover:text-gray-900 transition-all duration-200 ease-in-out"
                                                >
                                                    <span>{t('landing_faq_view_all')}</span>
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Final CTA Section */}
                            <div className="py-16 sm:py-24">
                                <div className="bg-gray-100 dark:bg-[#1c2527] rounded-xl p-10 sm:p-16 flex flex-col items-center text-center gap-6">
                                    <h2 className="text-gray-900 dark:text-white text-3xl sm:text-4xl font-bold tracking-tight">{t('landing_cta_title')}</h2>
                                    <p className="text-gray-600 dark:text-gray-300 max-w-xl">{t('landing_cta_subtitle')}</p>
                                    <button onClick={() => setShowAuth(true)} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-gray-900 dark:text-[#111718] text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity">
                                        <span className="truncate">{t('landing_cta_button')}</span>
                                    </button>
                                </div>
                            </div>
                        </main>
                        {/* Footer */}
                        <footer className="border-t border-gray-200 dark:border-gray-800 py-10 mt-16">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-8 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-5">
                                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="20" y="10" width="40" height="40" fill="#6366F1" rx="4"/>
                                            <rect x="40" y="30" width="40" height="60" fill="#6366F1" rx="4"/>
                                        </svg>
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('landing_footer_copyright')}</span>
                                </div>
                                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                                    <button 
                                        onClick={() => window.open('/contact', '_blank')}
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                                    >
                                        {t('landing_footer_contact')}
                                    </button>
                                    <button 
                                        onClick={() => window.open('/terms-of-service', '_blank')}
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                                    >
                                        {t('landing_footer_terms')}
                                    </button>
                                    <button 
                                        onClick={() => window.open('/privacy-policy', '_blank')}
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                                    >
                                        {t('landing_footer_privacy')}
                                    </button>
                                </div>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
