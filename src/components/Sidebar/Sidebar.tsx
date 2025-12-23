
'use client';

import Link from 'next/link';
import Image from 'next/image';
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
    Wrench,
    History,
    Sun,
    Moon,
    X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './Sidebar.module.css';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();
    const { toggleTheme, isDark } = useTheme();

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
                    title: 'Dashboard สต๊อก',
                    icon: Package,
                    path: '/stock-dashboard'
                },
                {
                    title: 'จัดการสต๊อกจังหวัด',
                    icon: LayoutDashboard,
                    category: true,
                    subItems: [
                        { title: 'ภาพรวมสต๊อก', path: '/admin/stock', icon: LayoutDashboard },
                        { title: 'จัดการสต็อก', path: '/admin/stock/simple', icon: Package },
                        { title: 'ประวัติการเคลื่อนไหว', path: '/admin/stock/history', icon: History },
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
                    title: 'Dashboard สต๊อก',
                    icon: Package,
                    path: '/stock-dashboard'
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
        <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.logoContainer}>
                    <Image
                        src="/images/sskems2.png"
                        alt="Sisaket EMS Logo"
                        width={100}
                        height={100}
                        className={styles.logoImage}
                        priority
                    />
                </div>
                <div className={styles.logoText}>
                    <div className={styles.logoTitle}>Sisaket EMS</div>
                    <div className={styles.logoSubtitle}>Stock Management</div>
                </div>

                {/* Mobile Close Button */}
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={24} />
                </button>
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
                                            onClick={() => onClose?.()}
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
                                onClick={() => onClose?.()}
                            >
                                <item.icon size={20} strokeWidth={2} />
                                <span>{item.title}</span>
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

            {/* Theme Toggle */}
            <div className={styles.themeToggle}>
                <button
                    onClick={toggleTheme}
                    className={styles.themeBtn}
                    title={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    <span>{isDark ? 'โหมดสว่าง' : 'โหมดมืด'}</span>
                </button>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
                {isAuthenticated && user ? (
                    <>
                        <div className={styles.userInfo}>
                            <div className={styles.userAvatar}>
                                <span className={styles.userInitial}>
                                    {(user.fullName || user.username)?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className={styles.userDetails}>
                                <span className={styles.userName}>{user.fullName || user.username}</span>
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
