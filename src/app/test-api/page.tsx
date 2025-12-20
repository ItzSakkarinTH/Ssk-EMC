'use client';

import { useState } from 'react';

interface APIResult {
    status?: number;
    statusText?: string;
    ok?: boolean;
    data?: unknown;
    error?: string;
}

export default function TestAPIPage() {
    const [result, setResult] = useState<APIResult | null>(null);
    const [loading, setLoading] = useState(false);

    const testAPI = async () => {
        setLoading(true);
        setResult(null);

        try {
            const token = localStorage.getItem('accessToken');

            console.log('🔑 Token:', token ? 'Found' : 'Not found');
            console.log('📤 Sending request to /api/stock/admin/all-shelters');

            const res = await fetch('/api/stock/admin/all-shelters', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📥 Response status:', res.status, res.statusText);

            const data = await res.json();
            console.log('📦 Response data:', data);

            setResult({
                status: res.status,
                statusText: res.statusText,
                ok: res.ok,
                data: data
            });

        } catch (err) {
            console.error('❌ Error:', err);
            setResult({
                error: err instanceof Error ? err.message : 'Unknown error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
            <h1>🧪 ทดสอบ API: /api/stock/admin/all-shelters</h1>

            <button
                onClick={testAPI}
                disabled={loading}
                style={{
                    padding: '1rem 2rem',
                    background: loading ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    marginTop: '1rem'
                }}
            >
                {loading ? '⏳ กำลังทดสอบ...' : '🚀 ทดสอบ API'}
            </button>

            {result && (
                <div style={{ marginTop: '2rem' }}>
                    <h2>ผลลัพธ์:</h2>

                    {result.error ? (
                        <div style={{ padding: '1rem', background: '#f8d7da', borderRadius: '8px', color: '#721c24' }}>
                            <strong>❌ Error:</strong> {result.error}
                        </div>
                    ) : (
                        <>
                            <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px', marginBottom: '1rem' }}>
                                <p><strong>Status:</strong> {result.status} {result.statusText}</p>
                                <p><strong>OK:</strong> {result.ok ? '✅ Yes' : '❌ No'}</p>
                            </div>

                            <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                                <h3>Response Data:</h3>
                                <pre style={{
                                    background: '#1e1e1e',
                                    color: '#d4d4d4',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    overflow: 'auto',
                                    maxHeight: '500px'
                                }}>
                                    {JSON.stringify(result.data, null, 2)}
                                </pre>
                            </div>
                        </>
                    )}
                </div>
            )}

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#e7f3ff', borderRadius: '8px' }}>
                <h3>💡 คำแนะนำ:</h3>
                <ul>
                    <li>เปิด Developer Console (F12) เพื่อดู logs</li>
                    <li>ตรวจสอบว่า Authorization header ถูกส่งไปหรือไม่</li>
                    <li>ดูว่า API ตอบกลับมาอะไร</li>
                </ul>
            </div>
        </div>
    );
}
