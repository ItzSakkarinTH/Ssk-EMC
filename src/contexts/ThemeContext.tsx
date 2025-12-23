'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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

// Get initial theme from localStorage or system preference
function getInitialTheme(): Theme {
    if (typeof window === 'undefined') {
        return 'dark'; // Default for SSR
    }

    try {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            return savedTheme;
        }

        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    } catch {
        return 'dark';
    }
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    // Initialize theme on mount
    useEffect(() => {
        const initialTheme = getInitialTheme();
        setThemeState(initialTheme);
        document.documentElement.setAttribute('data-theme', initialTheme);
        setMounted(true);
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

    // Prevent flash of wrong theme on initial render
    if (!mounted) {
        return (
            <ThemeContext.Provider value={value}>
                <div style={{ visibility: 'hidden' }}>{children}</div>
            </ThemeContext.Provider>
        );
    }

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
