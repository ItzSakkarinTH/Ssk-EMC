
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Building2,
    Package,
    TrendingUp,
    FileText,
    ClipboardList,
    Users,
    LogOut,
    LayoutDashboard,
    ArrowLeftRight,
    AlertCircle,
    BarChart3,
    Megaphone,
    Wrench
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Sidebar.module.css';

export default function Sidebar() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();

    // กำหนด nav items ตาม role
    const getNavItems = () => {
        if (!isAuthenticated || !user) {
            return [
                {
                    title: 'หน้าหลัก',
                    icon: Home,
                    path: '/'
                },
                {
                    title: 'Dashboard สต๊อก',
                    icon: Package,
                    path: '/stock-dashboard'
                }
            ];
        }

        if (user.role === 'admin') {
            return [
                {
                    title: 'หน้าหลัก',
                    icon: Home,
                    path: '/'
                },
                {
                    title: 'จัดการสต๊อกจังหวัด',
                    icon: LayoutDashboard,
                    category: true,
                    subItems: [
                        { title: 'ภาพรวมสต๊อก', path: '/admin/stock', icon: Package },
                        { title: 'ทุกศูนย์พักพิง', path: '/admin/stock/all-shelters', icon: Building2 },
                        { title: 'โอนสต๊อก', path: '/admin/stock/transfers', icon: ArrowLeftRight },
                        { title: 'คำร้องขอสินค้า', path: '/admin/stock/requests', icon: ClipboardList },
                        { title: 'วิเคราะห์ข้อมูล', path: '/admin/stock/analytics', icon: BarChart3 }
                    ]
                },
                {
                    title: 'จัดการระบบ',
                    icon: Wrench,
                    category: true,
                    subItems: [
                        { title: 'ศูนย์พักพิง', path: '/admin/shelters', icon: Building2 },
                        { title: 'รายการสินค้า', path: '/admin/items', icon: Package },
                        { title: 'ผู้ใช้งาน', path: '/admin/users', icon: Users },
                        { title: 'ประกาศ', path: '/admin/announcements', icon: Megaphone }
                    ]
                }
            ];
        }

        if (user.role === 'staff') {
            return [
                {
                    title: 'หน้าหลัก',
                    icon: Home,
                    path: '/'
                },
                {
                    title: 'จัดการสต๊อกศูนย์',
                    icon: Package,
                    category: true,
                    subItems: [
                        { title: 'สต๊อกของฉัน', path: '/staff/stock', icon: Package },
                        { title: 'รับเข้า', path: '/staff/stock/receive', icon: TrendingUp },
                        { title: 'เบิกจ่าย', path: '/staff/stock/dispense', icon: FileText },
                        { title: 'ยื่นคำร้อง', path: '/staff/stock/request', icon: ClipboardList },
                        { title: 'ประวัติ', path: '/staff/stock/history', icon: AlertCircle }
                    ]
                }
            ];
        }

        return [];
    };

    const navItems = getNavItems();

    return (
        <aside className={styles.sidebar}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.logoContainer}>
                    <div className={styles.logoCircle}>
                        <span className={styles.logoLetter}>S</span>
                    </div>
                </div>
                <div className={styles.logoText}>
                    <div className={styles.logoTitle}>Sisaket EMS</div>
                    <div className={styles.logoSubtitle}>Stock Management</div>
                </div>
            </div>

            {/* Navigation */}
            <nav className={styles.nav}>
                {navItems.map((item, idx) => (
                    <div key={idx} className={item.category ? styles.category : ''}>
                        {item.category ? (
                            <>
                                <div className={styles.categoryTitle}>
                                    <item.icon size={16} strokeWidth={2.5} />
                                    <span>{item.title}</span>
                                </div>
                                {item.subItems?.map((sub, sIdx) => {
                                    const SubIcon = sub.icon;
                                    const isActive = pathname === sub.path ||
                                        pathname.startsWith(sub.path + '/');

                                    return (
                                        <Link
                                            key={sIdx}
                                            href={sub.path}
                                            className={`${styles.navLink} ${styles.subLink} ${isActive ? styles.active : ''}`}
                                        >
                                            {SubIcon && <SubIcon size={18} strokeWidth={2} />}
                                            <span>{sub.title}</span>
                                        </Link>
                                    );
                                })}
                            </>
                        ) : (
                            <Link
                                href={item.path || '#'}
                                className={`${styles.navLink} ${pathname === item.path ? styles.active : ''}`}
                            >
                                <item.icon size={20} strokeWidth={2} />
                                <span>{item.title}</span>
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className={styles.footer}>
                {isAuthenticated && user ? (
                    <>
                        <div className={styles.userInfo}>
                            <div className={styles.userAvatar}>
                                <span className={styles.userInitial}>
                                    {user.username?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className={styles.userDetails}>
                                <span className={styles.userName}>{user.username}</span>
                                <span className={styles.userRole}>
                                    {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่ศูนย์'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => logout()}
                            className={styles.logoutBtn}
                            title="ออกจากระบบ"
                        >
                            <LogOut size={20} strokeWidth={2} />
                        </button>
                    </>
                ) : (
                    <div className={styles.guestInfo}>
                        <span className={styles.guestText}>โหมดเยี่ยมชม</span>
                        <Link href="/login" className={styles.loginLink}>
                            เข้าสู่ระบบ
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    );
}
