'use client';

import React, { createContext, useContext, useState, useLayoutEffect, useCallback, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

// Get theme from DOM (set by inline script before React mounts)
function getThemeFromDOM(): Theme {
    if (typeof document === 'undefined') return 'dark';
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    // Use lazy initialization to get theme from DOM
    const [theme, setThemeState] = useState<Theme>(() => getThemeFromDOM());

    // Sync with DOM on first render (in case SSR doesn't match)
    useLayoutEffect(() => {
        const domTheme = getThemeFromDOM();
        if (domTheme !== theme) {
            setThemeState(domTheme);
        }
        // Only run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update document and localStorage when theme changes
    const updateTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        try {
            localStorage.setItem('theme', newTheme);
        } catch (e) {
            console.warn('Could not save theme preference:', e);
        }
    }, []);

    const setTheme = useCallback((newTheme: Theme) => {
        updateTheme(newTheme);
    }, [updateTheme]);

    const toggleTheme = useCallback(() => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        updateTheme(newTheme);
    }, [theme, updateTheme]);

    const value: ThemeContextType = {
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

