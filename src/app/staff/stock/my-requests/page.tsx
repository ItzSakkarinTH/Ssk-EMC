'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import styles from './page.module.css';

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
        pending: 'รอพิจารณา',
        approved: 'อนุมัติ',
        rejected: 'ปฏิเสธ',
        partial: 'อนุมัติบางส่วน'
    };

    const statusColors: Record<string, string> = {
        pending: styles.statusPending,
        approved: styles.statusApproved,
        rejected: styles.statusRejected,
        partial: styles.statusPartial
    };

    const deliveryLabels: Record<string, string> = {
        pending: '📦 รอจัดส่ง',
        delivered: '✅ จัดส่งแล้ว',
        cancelled: '❌ ยกเลิก'
    };

    return (
        <DashboardLayout
            title="คำร้องขอสินค้าของฉัน"
            subtitle="ตรวจสอบสถานะคำร้องที่ยื่นไปยังกองกลางจังหวัด"
        >
            <div className={styles.header}>
                <div className={styles.filters}>
                    <label>สถานะ:</label>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="dash-select"
                    >
                        <option value="all">ทั้งหมด</option>
                        <option value="pending">รอพิจารณา</option>
                        <option value="approved">อนุมัติ</option>
                        <option value="rejected">ปฏิเสธ</option>
                        <option value="partial">อนุมัติบางส่วน</option>
                    </select>
                </div>

                <Link href="/staff/stock/request" className="dash-btn dash-btn-primary">
                    + ยื่นคำร้องใหม่
                </Link>
            </div>

            {loading ? (
                <div className="dash-loading">
                    <div className="dash-spinner"></div>
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            ) : requests.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>📋</div>
                    <h3>ไม่มีคำร้อง</h3>
                    <p>คุณยังไม่มีคำร้องขอสินค้า</p>
                    <Link href="/staff/stock/request" className="dash-btn dash-btn-primary">
                        ยื่นคำร้องใหม่
                    </Link>
                </div>
            ) : (
                <div className={styles.requestsList}>
                    {requests.map(request => (
                        <div key={request._id} className={styles.requestCard}>
                            <div className={styles.requestHeader}>
                                <div className={styles.requestInfo}>
                                    <h3>คำร้องเลขที่ {request.requestNumber}</h3>
                                    <span className={styles.requestDate}>
                                        ยื่นเมื่อ: {new Date(request.requestedAt).toLocaleString('th-TH')}
                                    </span>
                                </div>
                                <span className={`${styles.statusBadge} ${statusColors[request.status]}`}>
                                    {statusLabels[request.status]}
                                </span>
                            </div>

                            <div className={styles.requestBody}>
                                <h4>รายการสินค้า ({request.items.length} รายการ)</h4>
                                <div className={styles.itemsList}>
                                    {request.items.map((item, idx) => (
                                        <div key={idx} className={styles.item}>
                                            <div className={styles.itemName}>{item.itemName}</div>
                                            <div className={styles.itemDetails}>
                                                <span>ขอ: {item.requestedQuantity} {item.unit}</span>
                                                {item.approvedQuantity !== undefined && (
                                                    <span className={styles.approved}>
                                                        | อนุมัติ: {item.approvedQuantity} {item.unit}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.itemReason}>เหตุผล: {item.reason}</div>
                                        </div>
                                    ))}
                                </div>

                                {request.deliveryStatus && (
                                    <div className={styles.delivery}>
                                        <strong>สถานะการจัดส่ง:</strong> {deliveryLabels[request.deliveryStatus] || request.deliveryStatus}
                                    </div>
                                )}

                                {request.reviewedAt && (
                                    <div className={styles.reviewInfo}>
                                        <strong>วันที่พิจารณา:</strong> {new Date(request.reviewedAt).toLocaleString('th-TH')}
                                        {request.reviewedBy && (
                                            <>
                                                {' | '}
                                                <strong>โดย:</strong> {request.reviewedBy.username}
                                            </>
                                        )}
                                    </div>
                                )}

                                {request.adminNotes && (
                                    <div className={styles.adminNotes}>
                                        <strong>หมายเหตุจากแอดมิน:</strong> {request.adminNotes}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
