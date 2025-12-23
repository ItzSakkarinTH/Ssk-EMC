'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { Package, TrendingUp, Calendar, User, FileText, Search } from 'lucide-react';
import styles from './history.module.css';

interface Movement {
    _id: string;
    itemName: string;
    quantity: number;
    unit: string;
    from: {
        name: string;
    };
    performedBy: {
        username: string;
        fullName?: string;
    };
    performedAt: string;
    referenceId: string;
    notes: string;
}

export default function ReceiveHistoryPage() {
    const toast = useToast();
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

    useEffect(() => {
        fetchMovements();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchMovements = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/stock/admin/receive-history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setMovements(data.movements || []);
            } else {
                toast.error('ไม่สามารถโหลดประวัติได้');
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาด');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'เมื่อสักครู่';
        if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
        if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
        if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
        return formatDate(dateString);
    };

    const filterByDate = (movement: Movement) => {
        if (dateFilter === 'all') return true;

        const date = new Date(movement.performedAt);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        switch (dateFilter) {
            case 'today':
                return diffDays < 1;
            case 'week':
                return diffDays < 7;
            case 'month':
                return diffDays < 30;
            default:
                return true;
        }
    };

    const filteredMovements = movements
        .filter(m =>
            (m.itemName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (m.from?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        )
        .filter(filterByDate);

    const totalReceived = filteredMovements.reduce((sum, m) => sum + m.quantity, 0);

    if (loading) {
        return (
            <DashboardLayout title="ประวัติการรับสินค้า" subtitle="บันทึกการรับบริจาคและเพิ่มสต็อก">
                <div className="dash-loading">
                    <div className="dash-spinner"></div>
                    <p>กำลังโหลด...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="ประวัติการรับสินค้า"
            subtitle="บันทึกการรับบริจาคและเพิ่มสต็อกเข้ากองกลาง"
        >
            {/* Summary */}
            <div className={styles.summary}>
                <div className={styles.summaryCard}>
                    <TrendingUp size={32} />
                    <div>
                        <div className={styles.summaryLabel}>ทั้งหมด</div>
                        <div className={styles.summaryValue}>{filteredMovements.length} รายการ</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <Package size={32} />
                    <div>
                        <div className={styles.summaryLabel}>รับเข้ารวม</div>
                        <div className={styles.summaryValue}>{totalReceived.toLocaleString()} รายการ</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        className="dash-input"
                        placeholder="ค้นหาสินค้า หรือผู้ส่ง..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '3rem' }}
                    />
                </div>
                <div className={styles.dateFilters}>
                    {[
                        { value: 'all', label: 'ทั้งหมด' },
                        { value: 'today', label: 'วันนี้' },
                        { value: 'week', label: '7 วัน' },
                        { value: 'month', label: '30 วัน' }
                    ].map(option => (
                        <button
                            key={option.value}
                            className={`${styles.dateFilter} ${dateFilter === option.value ? styles.active : ''}`}
                            onClick={() => setDateFilter(option.value as typeof dateFilter)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* History List */}
            {filteredMovements.length > 0 ? (
                <div className={styles.historyList}>
                    {filteredMovements.map((movement) => (
                        <div key={movement._id} className={styles.historyCard}>
                            <div className={styles.historyHeader}>
                                <div className={styles.historyIcon}>
                                    <TrendingUp size={24} />
                                </div>
                                <div className={styles.historyMain}>
                                    <div className={styles.historyTitle}>{movement.itemName}</div>
                                    <div className={styles.historyQuantity}>
                                        +{movement.quantity.toLocaleString()} {movement.unit}
                                    </div>
                                </div>
                                <div className={styles.historyTime}>
                                    {getRelativeTime(movement.performedAt)}
                                </div>
                            </div>

                            <div className={styles.historyDetails}>
                                <div className={styles.historyDetail}>
                                    <User size={16} />
                                    <span>ผู้ส่ง: <strong>{movement.from.name}</strong></span>
                                </div>
                                <div className={styles.historyDetail}>
                                    <Calendar size={16} />
                                    <span>{formatDate(movement.performedAt)}</span>
                                </div>
                                {movement.referenceId && (
                                    <div className={styles.historyDetail}>
                                        <FileText size={16} />
                                        <span>เอกสาร: {movement.referenceId}</span>
                                    </div>
                                )}
                                <div className={styles.historyDetail}>
                                    <User size={16} />
                                    <span>บันทึกโดย: {movement.performedBy?.fullName || movement.performedBy?.username || 'N/A'}</span>
                                </div>
                            </div>

                            {movement.notes && (
                                <div className={styles.historyNotes}>
                                    <strong>หมายเหตุ:</strong> {movement.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <Package size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>ไม่พบประวัติการรับสินค้า</p>
                </div>
            )}
        </DashboardLayout>
    );
}
