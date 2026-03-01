import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'default' | 'light' | 'emerald' | 'custom';

export interface ThemeColors {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textMuted: string;
    border: string;
}

interface ThemeContextType {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    customColors: ThemeColors;
    updateCustomColor: (key: keyof ThemeColors, value: string) => void;
    currentColors: ThemeColors;
}

const defaultColors: ThemeColors = {
    background: '#101022',
    surface: '#191933',
    primary: '#1313ec',
    secondary: '#9292c9',
    text: '#ffffff',
    textMuted: '#9ca3af', // gray-400
    border: 'rgba(255, 255, 255, 0.1)',
};

const lightColors: ThemeColors = {
    background: '#f3f4f6',
    surface: '#ffffff',
    primary: '#2563eb',
    secondary: '#64748b',
    text: '#111827', // gray-900
    textMuted: '#4b5563', // gray-600
    border: 'rgba(0, 0, 0, 0.1)',
};

const emeraldColors: ThemeColors = {
    background: '#022c22', // slate-900 like
    surface: '#064e3b', // slate-800 like
    primary: '#10b981', // emerald-500
    secondary: '#34d399', // emerald-400
    text: '#ffffff',
    textMuted: '#9ca3af',
    border: 'rgba(255, 255, 255, 0.1)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [themeMode, setThemeModeData] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('themeMode');
        return (saved as ThemeMode) || 'default';
    });

    const [customColors, setCustomColors] = useState<ThemeColors>(() => {
        const saved = localStorage.getItem('customColors');
        return saved ? JSON.parse(saved) : { ...defaultColors };
    });

    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeData(mode);
        localStorage.setItem('themeMode', mode);
    };

    const updateCustomColor = (key: keyof ThemeColors, value: string) => {
        const newColors = { ...customColors, [key]: value };
        setCustomColors(newColors);
        localStorage.setItem('customColors', JSON.stringify(newColors));
    };

    const currentColors = (() => {
        switch (themeMode) {
            case 'light': return lightColors;
            case 'emerald': return emeraldColors;
            case 'custom': return customColors;
            default: return defaultColors;
        }
    })();

    // Apply variables to :root
    useEffect(() => {
        const root = document.documentElement;
        Object.entries(currentColors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value as string);
        });

        // Toggle 'dark' class for Tailwind dark mode if needed
        if (themeMode === 'light') {
            root.classList.remove('dark');
        } else {
            root.classList.add('dark');
        }

    }, [themeMode, currentColors]);

    return (
        <ThemeContext.Provider value={{ themeMode, setThemeMode, customColors, updateCustomColor, currentColors }}>
            {children}
        </ThemeContext.Provider>
    );
};
export default ThemeContext;
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
