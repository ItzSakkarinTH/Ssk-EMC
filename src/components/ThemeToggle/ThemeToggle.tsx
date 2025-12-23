'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
    const { toggleTheme, isDark } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`${styles.toggleButton} ${className}`}
            aria-label={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
            title={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
        >
            <span className={styles.iconWrapper}>
                {isDark ? (
                    <Sun size={18} className={styles.icon} />
                ) : (
                    <Moon size={18} className={styles.icon} />
                )}
            </span>
            {showLabel && (
                <span className={styles.label}>
                    {isDark ? 'สว่าง' : 'มืด'}
                </span>
            )}
        </button>
    );
}
