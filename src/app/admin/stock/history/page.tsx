'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
    Package,
    TrendingUp,
    ArrowRight,
    Calendar,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import styles from './history.module.css';

interface Movement {
    _id: string;
    itemName?: string;
    stockId?: {
        itemName: string;
    };
    movementType: 'receive' | 'transfer' | 'adjust';
    quantity: number;
    unit: string;
    from: {
        type: string;
        name: string;
    };
    to?: {
        type: string;
        name: string;
    };
    performedBy: {
        username: string;
    };
    performedAt: string;
    referenceId: string;
    notes?: string;
}

export default function HistoryPage() {
    const toast = useToast();
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'receive' | 'transfer'>('all');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchMovements();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchMovements = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/stock/admin/movements', {
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
            month: 'short',
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

    // Filter logic
    const filteredMovements = useMemo(() => {
        return movements.filter(m => {
            const itemName = m.itemName || m.stockId?.itemName || '';

            // Search filter
            const matchesSearch =
                itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.from?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.to?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.referenceId?.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            // Type filter
            if (typeFilter !== 'all' && m.movementType !== typeFilter) return false;

            // Date filter
            if (dateFilter !== 'all') {
                const date = new Date(m.performedAt);
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffDays = diffMs / (1000 * 60 * 60 * 24);

                switch (dateFilter) {
                    case 'today':
                        if (diffDays >= 1) return false;
                        break;
                    case 'week':
                        if (diffDays >= 7) return false;
                        break;
                    case 'month':
                        if (diffDays >= 30) return false;
                        break;
                }
            }

            return true;
        });
    }, [movements, searchTerm, typeFilter, dateFilter]);

    // Pagination logic
    const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedMovements = filteredMovements.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, typeFilter, dateFilter, itemsPerPage]);

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'receive':
                return <TrendingUp size={20} />;
            case 'transfer':
                return <ArrowRight size={20} />;
            default:
                return <Package size={20} />;
        }
    };

    const getMovementColor = (type: string) => {
        switch (type) {
            case 'receive':
                return 'var(--dash-success)';
            case 'transfer':
                return 'var(--dash-primary)';
            default:
                return 'var(--dash-warning)';
        }
    };

    const getMovementLabel = (type: string) => {
        switch (type) {
            case 'receive':
                return 'รับเข้า';
            case 'transfer':
                return 'โอน';
            default:
                return 'ปรับปรุง';
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="ประวัติการเคลื่อนไหวสต็อก" subtitle="รายการรับเข้าและโอนสต็อก">
                <div className="dash-loading">
                    <div className="dash-spinner"></div>
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="ประวัติการเคลื่อนไหวสต็อก"
            subtitle="รายการรับเข้าและโอนสต็อกทั้งหมด"
        >
            {/* Summary Stats */}
            <div className={styles.summary}>
                <div className={styles.summaryCard}>
                    <Package size={32} />
                    <div>
                        <div className={styles.summaryLabel}>ทั้งหมด</div>
                        <div className={styles.summaryValue}>{filteredMovements.length}</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <TrendingUp size={32} />
                    <div>
                        <div className={styles.summaryLabel}>รับเข้า</div>
                        <div className={styles.summaryValue}>
                            {filteredMovements.filter(m => m.movementType === 'receive').length}
                        </div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <ArrowRight size={32} />
                    <div>
                        <div className={styles.summaryLabel}>โอนสต็อก</div>
                        <div className={styles.summaryValue}>
                            {filteredMovements.filter(m => m.movementType === 'transfer').length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filterSection}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={20} style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8'
                    }} />
                    <input
                        type="text"
                        className="dash-input"
                        placeholder="ค้นหาสินค้า, ผู้ส่ง, เอกสาร..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '3rem' }}
                    />
                </div>

                {/* Type Filter */}
                <div className={styles.filterGroup}>
                    <Filter size={18} />
                    <span>ประเภท:</span>
                    <div className={styles.buttonGroup}>
                        {[
                            { value: 'all', label: 'ทั้งหมด' },
                            { value: 'receive', label: 'รับเข้า' },
                            { value: 'transfer', label: 'โอน' }
                        ].map(option => (
                            <button
                                key={option.value}
                                className={`${styles.filterBtn} ${typeFilter === option.value ? styles.active : ''}`}
                                onClick={() => setTypeFilter(option.value as typeof typeFilter)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Filter */}
                <div className={styles.filterGroup}>
                    <Calendar size={18} />
                    <span>ช่วงเวลา:</span>
                    <div className={styles.buttonGroup}>
                        {[
                            { value: 'all', label: 'ทั้งหมด' },
                            { value: 'today', label: 'วันนี้' },
                            { value: 'week', label: '7 วัน' },
                            { value: 'month', label: '30 วัน' }
                        ].map(option => (
                            <button
                                key={option.value}
                                className={`${styles.filterBtn} ${dateFilter === option.value ? styles.active : ''}`}
                                onClick={() => setDateFilter(option.value as typeof dateFilter)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results Info & Per Page Selector */}
            <div className={styles.tableHeader}>
                <div className={styles.resultsInfo}>
                    แสดง {startIndex + 1}-{Math.min(endIndex, filteredMovements.length)} จาก {filteredMovements.length} รายการ
                </div>
                <div className={styles.perPageSelector}>
                    <span>แสดง:</span>
                    {[5, 10, 50, 100].map(num => (
                        <button
                            key={num}
                            className={`${styles.perPageBtn} ${itemsPerPage === num ? styles.active : ''}`}
                            onClick={() => setItemsPerPage(num)}
                        >
                            {num}
                        </button>
                    ))}
                    <span>รายการ</span>
                </div>
            </div>

            {/* Table */}
            {paginatedMovements.length > 0 ? (
                <>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ประเภท</th>
                                    <th>สินค้า</th>
                                    <th>จำนวน</th>
                                    <th>จาก</th>
                                    <th>ไปยัง</th>
                                    <th>เอกสาร</th>
                                    <th>ผู้บันทึก</th>
                                    <th>วันเวลา</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedMovements.map((movement) => {
                                    const itemName = movement.itemName || movement.stockId?.itemName || 'N/A';
                                    return (
                                        <tr key={movement._id}>
                                            <td>
                                                <span
                                                    className={styles.typeBadge}
                                                    style={{
                                                        background: `${getMovementColor(movement.movementType)}20`,
                                                        color: getMovementColor(movement.movementType)
                                                    }}
                                                >
                                                    {getMovementIcon(movement.movementType)}
                                                    {getMovementLabel(movement.movementType)}
                                                </span>
                                            </td>
                                            <td>
                                                <strong>{itemName}</strong>
                                            </td>
                                            <td>
                                                <span
                                                    className={styles.quantity}
                                                    style={{ color: getMovementColor(movement.movementType) }}
                                                >
                                                    {movement.movementType === 'receive' ? '+' : ''}{movement.quantity.toLocaleString()} {movement.unit}
                                                </span>
                                            </td>
                                            <td>{movement.from?.name || '-'}</td>
                                            <td>{movement.to?.name || '-'}</td>
                                            <td>
                                                <code className={styles.refCode}>{movement.referenceId || '-'}</code>
                                            </td>
                                            <td>{movement.performedBy?.username || 'N/A'}</td>
                                            <td>
                                                <div className={styles.dateCell}>
                                                    <div className={styles.relativeTime}>
                                                        {getRelativeTime(movement.performedAt)}
                                                    </div>
                                                    <div className={styles.fullDate}>
                                                        {formatDate(movement.performedAt)}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                className={styles.pageBtn}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft size={18} />
                                ก่อนหน้า
                            </button>

                            <div className={styles.pageNumbers}>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => {
                                        // Show first, last, current, and adjacent pages
                                        return page === 1 ||
                                            page === totalPages ||
                                            Math.abs(page - currentPage) <= 1;
                                    })
                                    .map((page, index, array) => {
                                        // Add ellipsis
                                        const prevPage = array[index - 1];
                                        const showEllipsis = prevPage && page - prevPage > 1;

                                        return (
                                            <div key={page} style={{ display: 'flex', gap: '0.5rem' }}>
                                                {showEllipsis && <span className={styles.ellipsis}>...</span>}
                                                <button
                                                    className={`${styles.pageNumBtn} ${currentPage === page ? styles.active : ''}`}
                                                    onClick={() => setCurrentPage(page)}
                                                >
                                                    {page}
                                                </button>
                                            </div>
                                        );
                                    })}
                            </div>

                            <button
                                className={styles.pageBtn}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                ถัดไป
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.emptyState}>
                    <Package size={64} style={{ opacity: 0.3 }} />
                    <h3>ไม่พบข้อมูล</h3>
                    <p>ลองปรับเปลี่ยนตัวกรองหรือคำค้นหา</p>
                </div>
            )}
        </DashboardLayout>
    );
}
