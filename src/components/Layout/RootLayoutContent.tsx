'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar/Sidebar';
import StockNotificationListener from '@/components/Notifications/StockNotificationListener';
import styles from './RootLayoutContent.module.css';

export default function RootLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // ตรวจสอบว่าเป็นหน้า Login หรือไม่
    const isLoginPage = pathname === '/login';

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className={styles.container}>
            <Sidebar />
            <StockNotificationListener />
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
