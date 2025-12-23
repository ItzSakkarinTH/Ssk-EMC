'use client';

import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './MobileNav.module.css';
import Image from 'next/image';

interface MobileNavProps {
    onOpenSidebar: () => void;
}

export default function MobileNav({ onOpenSidebar }: MobileNavProps) {
    const { toggleTheme, isDark } = useTheme();

    return (
        <header className={styles.mobileHeader}>
            <button className={styles.menuBtn} onClick={onOpenSidebar}>
                <Menu size={24} />
            </button>

            <div className={styles.logoAndTitle}>
                <Image
                    src="/images/sskems2.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    className={styles.logo}
                />
                <span className={styles.title}>Sisaket EMS</span>
            </div>

            <button className={styles.themeBtn} onClick={toggleTheme}>
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </header>
    );
}
