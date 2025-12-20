'use client';

import { useEffect, useState } from 'react';

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
}

export default function CheckAuthPage() {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // ตรวจสอบ token ใน localStorage
                const localToken = localStorage.getItem('accessToken');
                setToken(localToken);

                if (!localToken) {
                    setError('ไม่พบ token ใน localStorage - กรุณาล็อกอินใหม่');
                    return;
                }

                // เรียก API /api/auth/me
                const res = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${localToken}`
                    }
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    setError(`API Error: ${errorData.error || res.statusText}`);
                    return;
                }

                const data = await res.json();
                setUser(data.user);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            }
        };

        checkAuth();
    }, []);

    return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
            <h1>🔍 ตรวจสอบสถานะการล็อกอิน</h1>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                <h2>Token Status:</h2>
                {token ? (
                    <div>
                        <p style={{ color: 'green' }}>✅ พบ Token ใน localStorage</p>
                        <details>
                            <summary>ดู Token (คลิกเพื่อแสดง)</summary>
                            <pre style={{ fontSize: '10px', overflow: 'auto' }}>{token}</pre>
                        </details>
                    </div>
                ) : (
                    <p style={{ color: 'red' }}>❌ ไม่พบ Token</p>
                )}
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                <h2>User Info:</h2>
                {error ? (
                    <div style={{ color: 'red' }}>
                        <p>❌ Error: {error}</p>
                    </div>
                ) : user ? (
                    <div>
                        <p style={{ color: 'green' }}>✅ ล็อกอินสำเร็จ</p>
                        <table style={{ marginTop: '1rem', width: '100%' }}>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: 'bold', padding: '0.5rem' }}>User ID:</td>
                                    <td style={{ padding: '0.5rem' }}>{user.id}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 'bold', padding: '0.5rem' }}>Username:</td>
                                    <td style={{ padding: '0.5rem' }}>{user.username}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 'bold', padding: '0.5rem' }}>Email:</td>
                                    <td style={{ padding: '0.5rem' }}>{user.email}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 'bold', padding: '0.5rem' }}>Role:</td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <strong style={{
                                            color: user.role === 'admin' ? 'green' : 'orange',
                                            fontSize: '1.2rem'
                                        }}>
                                            {user.role}
                                        </strong>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {user.role !== 'admin' && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3cd', borderRadius: '8px' }}>
                                <p style={{ color: '#856404', margin: 0 }}>
                                    ⚠️ <strong>คุณไม่ใช่ Admin!</strong> หน้านี้ต้องการสิทธิ์ Admin เท่านั้น
                                </p>
                                <p style={{ color: '#856404', marginTop: '0.5rem' }}>
                                    กรุณาล็อกอินด้วยบัญชี Admin หรือติดต่อผู้ดูแลระบบ
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <p>⏳ กำลังตรวจสอบ...</p>
                )}
            </div>

            <div style={{ marginTop: '2rem' }}>
                <button
                    onClick={() => {
                        localStorage.removeItem('accessToken');
                        window.location.href = '/login';
                    }}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    🚪 ล็อกเอาท์และไปหน้าล็อกอิน
                </button>
            </div>
        </div>
    );
}
