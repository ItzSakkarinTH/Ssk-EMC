'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';

interface RequestItem {
    itemName: string;
    requestedQuantity: number;
    approvedQuantity?: number;
    unit: string;
    reason: string;
}

interface StockRequest {
    _id: string;
    requestNumber: string;
    status: 'pending' | 'approved' | 'rejected' | 'partial';
    requestedAt: string;
    reviewedAt?: string;
    reviewedBy?: { username: string };
    items: RequestItem[];
    adminNotes?: string;
    deliveryStatus?: string;
}

export default function MyRequestsPage() {
    const [requests, setRequests] = useState<StockRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    const fetchRequests = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const url = filter === 'all'
                ? '/api/stock/staff/request'
                : `/api/stock/staff/request?status=${filter}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests || []);
            }
        } catch (err) {
            console.error('Failed to fetch requests', err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const statusLabels: Record<string, string> = {
        pending: '⏳ รอพิจารณา',
        approved: '✅ อนุมัติแล้ว',
        rejected: '❌ ปฏิเสธ',
        partial: '⚠️ อนุมัติบางส่วน'
    };

    const statusBadgeClasses: Record<string, string> = {
        pending: 'dash-badge-info',
        approved: 'dash-badge-success',
        rejected: 'dash-badge-danger',
        partial: 'dash-badge-warning'
    };

    const deliveryLabels: Record<string, string> = {
        pending: '📦 รอจัดส่ง',
        delivered: '🚚 จัดส่งแล้ว',
        cancelled: '🚫 ยกเลิก'
    };

    return (
        <DashboardLayout
            title="คำร้องขอสินค้าของฉัน"
            subtitle="ตรวจสอบสถานะคำร้องที่ยื่นไปยังกองกลางจังหวัด"
        >
            <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="dash-form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="dash-select"
                        >
                            <option value="all">สถานะทั้งหมด</option>
                            <option value="pending">⏳ รอพิจารณา</option>
                            <option value="approved">✅ อนุมัติแล้ว</option>
                            <option value="rejected">❌ ปฏิเสธ</option>
                            <option value="partial">⚠️ อนุมัติบางส่วน</option>
                        </select>
                    </div>

                    <Link href="/staff/stock/request" className="dash-btn dash-btn-primary">
                        + ยื่นคำร้องใหม่
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="dash-loading">
                    <div className="dash-spinner"></div>
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            ) : requests.length === 0 ? (
                <div className="dash-card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📋</div>
                    <h3 className="dash-card-title" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>ไม่มีคำร้อง</h3>
                    <p className="dash-text-muted" style={{ marginBottom: '1.5rem' }}>ยังไม่พบประวัติการยื่นคำร้องขอสินค้า</p>
                    <Link href="/staff/stock/request" className="dash-btn dash-btn-primary">
                        ยื่นคำร้องใหม่
                    </Link>
                </div>
            ) : (
                <div className="dash-grid dash-grid-2">
                    {requests.map(request => (
                        <div key={request._id} className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dash-text-primary)' }}>
                                        คำร้องเลขที่: {request.requestNumber}
                                    </h3>
                                    <div className="dash-text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                        📅 {new Date(request.requestedAt).toLocaleString('th-TH', {
                                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                                <div className={`dash-badge ${statusBadgeClasses[request.status]}`} style={{ fontWeight: 800 }}>
                                    {statusLabels[request.status]}
                                </div>
                            </div>

                            <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', padding: '1rem' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>รายการสินค้า</span>
                                    <span className="dash-text-muted">{request.items.length} รายการ</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {request.items.map((item, idx) => (
                                        <div key={idx} style={{ borderBottom: idx < request.items.length - 1 ? '1px solid var(--dash-border)' : 'none', paddingBottom: idx < request.items.length - 1 ? '0.75rem' : 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                                <span>{item.itemName}</span>
                                                <span style={{ color: 'var(--dash-primary)' }}>{item.requestedQuantity} {item.unit}</span>
                                            </div>
                                            {item.approvedQuantity !== undefined && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--dash-success)', fontWeight: 700, marginTop: '0.2rem' }}>
                                                    ✓ อนุมัติแล้ว: {item.approvedQuantity} {item.unit}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {(request.deliveryStatus || request.adminNotes || request.reviewedAt) && (
                                <div style={{ borderTop: '1px solid var(--dash-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                                    {request.deliveryStatus && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <span className="dash-text-muted">สถานะจัดส่ง:</span>
                                            <span style={{ fontWeight: 600 }}>{deliveryLabels[request.deliveryStatus] || request.deliveryStatus}</span>
                                        </div>
                                    )}
                                    {request.adminNotes && (
                                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid var(--dash-primary)' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--dash-primary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>หมายเหตุจากแอดมิน:</span>
                                            <span className="dash-text-secondary">{request.adminNotes}</span>
                                        </div>
                                    )}
                                    {request.reviewedAt && (
                                        <div className="dash-text-muted" style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: '0.5rem' }}>
                                            พิจารณาโดย {request.reviewedBy?.username || 'Admin'} เมื่อ {new Date(request.reviewedAt).toLocaleDateString('th-TH')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
