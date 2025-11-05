import React, { useState, useMemo, useCallback, createContext, useContext, ReactNode } from 'react';

import { en, tr, es, Translations } from '../locales';

// Define available languages
const translations: Record<string, Translations> = { en, tr, es };
export const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'es', name: 'Español' },
];

interface LanguageContextType {
    language: string;
    setLanguage: (lang: string) => void;
    t: (key: keyof Translations, replacements?: Record<string, string | number>) => any;
    translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getInitialLanguage = (): string => {
    if (typeof window === 'undefined') return 'en';
    const browserLang = navigator.language.split('-')[0];
    return translations[browserLang] ? browserLang : 'en';
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<string>(getInitialLanguage());

    const currentTranslations = useMemo(() => translations[language] || en, [language]);

    const t = useCallback((key: keyof Translations, replacements?: Record<string, string | number>) => {
        const langFile = translations[language] || en;
        let translation = langFile[key] || en[key];

        if (typeof translation === 'string' && replacements) {
            Object.keys(replacements).forEach(rKey => {
                translation = translation.replace(`{${rKey}}`, String(replacements[rKey]));
            });
        }

        return translation;
    }, [language]);
    
    const value = useMemo(() => ({
        language,
        setLanguage,
        t,
        translations: currentTranslations,
    }), [language, t, currentTranslations]);

    return React.createElement(LanguageContext.Provider, { value }, children);
};

export const useTranslations = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslations must be used within a LanguageProvider');
    }
    return context;
};
