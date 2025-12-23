'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar/Sidebar';
import MobileNav from '@/components/Layout/MobileNav';
import StockNotificationListener from '@/components/Notifications/StockNotificationListener';
import styles from './RootLayoutContent.module.css';

export default function RootLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // ตรวจสอบว่าเป็นหน้า Login หรือไม่
    const isLoginPage = pathname === '/login';

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className={styles.container}>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className={styles.contentWrapper}>
                <MobileNav onOpenSidebar={() => setIsSidebarOpen(true)} />
                <StockNotificationListener />
                <main className={styles.mainContent}>
                    {children}
                </main>
            </div>
        </div>
    );
}
