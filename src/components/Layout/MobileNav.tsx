'use client';

import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMounted } from '@/hooks/useMounted';
import styles from './MobileNav.module.css';

interface MobileNavProps {
    onOpenSidebar: () => void;
}

export default function MobileNav({ onOpenSidebar }: MobileNavProps) {
    const { toggleTheme, isDark } = useTheme();
    const mounted = useMounted();

    // Use consistent dark theme for SSR to prevent hydration mismatch
    const showDark = mounted ? isDark : true;

    return (
        <header className={styles.mobileHeader}>
            <button className={styles.menuBtn} onClick={onOpenSidebar}>
                <Menu size={24} />
            </button>

            <div className={styles.logoAndTitle}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/sskems2.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    className={styles.logo}
                    suppressHydrationWarning
                />
                <span className={styles.title}>Sisaket EMS</span>
            </div>

            <button className={styles.themeBtn} onClick={toggleTheme}>
                {showDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </header>
    );
}
