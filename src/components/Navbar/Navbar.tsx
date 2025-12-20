'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();

    return (
        <nav className={styles.navbar}>
            <div className={styles.navLinks}>
                <Link href="/" className={styles.link}>
                    หน้าหลัก
                </Link>

                {isAuthenticated ? (
                    <div className={styles.userProfile}>
                        <span className={styles.userName}>{user?.username || 'User'}</span>
                        <div className={styles.avatar}>
                            {user?.username?.substring(0, 2).toUpperCase()}
                        </div>
                        <button
                            onClick={() => logout()}
                            className={styles.link}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.5rem' }}
                        >
                            ออกจากระบบ
                        </button>
                    </div>
                ) : (
                    <Link href="/login" className={styles.loginBtn}>
                        เข้าสู่ระบบ
                    </Link>
                )}
            </div>
        </nav>
    );
}
