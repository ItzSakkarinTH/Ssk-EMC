'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Building2,
    User,
    LogOut,
    LayoutDashboard
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Sidebar.module.css';

const navItems = [
    {
        title: 'หน้าหลัก',
        icon: Home,
        path: '/'
    },
    {
        title: 'ศูนย์อำนวยการ',
        icon: LayoutDashboard,
        category: true,
        subItems: [
            { title: 'รายชื่อศูนย์', path: '/admin/centers' },
            { title: 'รายการสิ่งของ', path: '/admin/items' },
            { title: 'คำร้องขอสิ่งของ', path: '/admin/requests' }
        ]
    },
    {
        title: 'ศูนย์พักพิง',
        icon: Building2,
        category: true,
        subItems: [
            { title: 'รายชื่อศูนย์', path: '/shelter/centers' },
            { title: 'รายการสิ่งของ', path: '/shelter/items' },
            { title: 'รายการเบิกจ่าย', path: '/shelter/payouts' }
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
                <div className={styles.logoContainer}>
                    {/* Placeholder logo as per image */}
                    <div style={{ background: '#4f46e5', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>S</span>
                    </div>
                </div>
                <div className={styles.logoText}>Sisaket EMS</div>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item, idx) => (
                    <div key={idx} className={item.category ? styles.category : ''}>
                        {item.category ? (
                            <>
                                <div className={styles.categoryTitle}>
                                    <item.icon size={16} />
                                    <span>{item.title}</span>
                                </div>
                                {item.subItems?.map((sub, sIdx) => (
                                    <Link
                                        key={sIdx}
                                        href={sub.path}
                                        className={`${styles.navLink} ${styles.subLink} ${pathname === sub.path ? styles.active : ''}`}
                                    >
                                        <span>= {sub.title}</span>
                                    </Link>
                                ))}
                            </>
                        ) : (
                            <Link
                                href={item.path || '#'}
                                className={`${styles.navLink} ${pathname === item.path ? styles.active : ''}`}
                            >
                                <item.icon size={20} />
                                <span>{item.title}</span>
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

            <div className={styles.footer}>
                <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                        <User size={20} />
                    </div>
                    <div className={styles.userDetails}>
                        <span className={styles.userName}>
                            {isAuthenticated ? user?.username : 'ไม่ระบุผู้ใช้'}
                        </span>
                        <span className={styles.userRole}>
                            {isAuthenticated ? user?.role.toUpperCase() : 'Guest'}
                        </span>
                    </div>
                </div>
                {isAuthenticated && (
                    <button onClick={() => logout()} className={styles.logoutBtn} title="ออกจากระบบ">
                        <LogOut size={20} />
                    </button>
                )}
            </div>
        </aside>
    );
}
