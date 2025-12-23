'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { useToast } from '@/contexts/ToastContext';
import {
    Package, MapPin, Users, Edit2, ArrowLeft, AlertTriangle,
    TrendingUp, TrendingDown, Save, X, Search, Filter
} from 'lucide-react';
import styles from './shelter-detail.module.css';

interface StockItem {
    stockId: string;
    itemName: string;
    category: string;
    quantity: number;
    unit: string;
    minStockLevel: number;
    status: 'sufficient' | 'low' | 'critical' | 'outOfStock';
    lastUpdated?: string;
}

interface Movement {
    _id: string;
    itemName: string;
    movementType: string;
    quantity: number;
    unit: string;
    from: string;
    to: string;
    performedBy: string;
    performedAt: string;
    notes?: string;
}

interface CategoryBreakdown {
    count: number;
    quantity: number;
    lowCount: number;
    criticalCount: number;
}

interface ShelterData {
    shelter: {
        _id: string;
        name: string;
        code: string;
        location?: { district?: string; subdistrict?: string; address?: string };
        capacity?: number;
        currentOccupancy?: number;
        contactPerson?: { name: string; phone: string };
        status?: string;
    };
    stock: StockItem[];
    summary: {
        totalItems: number;
        totalQuantity: number;
        lowStockCount: number;
        criticalCount: number;
        categoryBreakdown: Record<string, CategoryBreakdown>;
    };
    recentMovements: Movement[];
}

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
    food: { label: 'อาหาร', emoji: '🍚', color: '#10b981' },
    medicine: { label: 'ยาและเวชภัณฑ์', emoji: '💊', color: '#3b82f6' },
    clothing: { label: 'เครื่องนุ่งห่ม', emoji: '👕', color: '#f59e0b' },
    water: { label: 'น้ำดื่ม', emoji: '💧', color: '#06b6d4' },
    bedding: { label: 'ที่นอน', emoji: '🛏️', color: '#8b5cf6' },
    hygiene: { label: 'ของใช้ส่วนตัว', emoji: '🧴', color: '#ec4899' },
    equipment: { label: 'อุปกรณ์', emoji: '🔧', color: '#6366f1' },
    other: { label: 'อื่นๆ', emoji: '📦', color: '#94a3b8' }
};

export default function ShelterDetailPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const shelterId = params.id as string;

    const [data, setData] = useState<ShelterData | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editQuantity, setEditQuantity] = useState<number>(0);
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/stock/admin/shelter/${shelterId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                toast.error('ไม่สามารถโหลดข้อมูลได้');
                router.push('/admin/stock/all-shelters');
            }
        } catch (error) {
            console.error('Failed to fetch:', error);
            toast.error('เกิดข้อผิดพลาด');
        } finally {
            setLoading(false);
        }
    }, [shelterId, router, toast]);

    useEffect(() => {
        if (shelterId) {
            fetchData();
        }
    }, [shelterId, fetchData]);

    const handleEditStart = (item: StockItem) => {
        setEditingItem(item.stockId);
        setEditQuantity(item.quantity);
    };

    const handleEditCancel = () => {
        setEditingItem(null);
        setEditQuantity(0);
    };

    const handleSaveQuantity = async (stockId: string) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/stock/admin/shelter/${shelterId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    stockId,
                    newQuantity: editQuantity,
                    notes: 'ปรับแก้ไขจากหน้าจัดการศูนย์พักพิง'
                })
            });

            if (res.ok) {
                toast.success('อัพเดทสต๊อกสำเร็จ');
                setEditingItem(null);
                fetchData();
            } else {
                toast.error('ไม่สามารถอัพเดทได้');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('เกิดข้อผิดพลาด');
        } finally {
            setSaving(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'sufficient': return 'เพียงพอ';
            case 'low': return 'ใกล้ต่ำ';
            case 'critical': return 'วิกฤต';
            case 'outOfStock': return 'หมด';
            default: return status;
        }
    };

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'receive': return '📥';
            case 'transfer': return '🔄';
            case 'dispense': return '📤';
            case 'adjust': return '⚙️';
            default: return '📋';
        }
    };

    const getMovementLabel = (type: string) => {
        switch (type) {
            case 'receive': return 'รับเข้า';
            case 'transfer': return 'โอนย้าย';
            case 'dispense': return 'เบิกจ่าย';
            case 'adjust': return 'ปรับแก้';
            default: return type;
        }
    };

    // Filter stock items
    const filteredStock = data?.stock.filter(item => {
        const matchSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
        const matchStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchSearch && matchCategory && matchStatus;
    }) || [];

    if (loading) {
        return (
            <DashboardLayout title="กำลังโหลด..." subtitle="">
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>กำลังโหลดข้อมูลศูนย์พักพิง...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!data) {
        return (
            <DashboardLayout title="ไม่พบข้อมูล" subtitle="">
                <div className={styles.errorContainer}>
                    <p>ไม่พบข้อมูลศูนย์พักพิง</p>
                    <Link href="/admin/stock/all-shelters" className={styles.backButton}>
                        กลับ
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title={data.shelter.name}
            subtitle={`รหัส: ${data.shelter.code} | จัดการสต๊อกและดูรายละเอียด`}
        >
            <div className={styles.container}>
                {/* Back Button & Actions */}
                <div className={styles.topActions}>
                    <Link href="/admin/stock/all-shelters" className={styles.backLink}>
                        <ArrowLeft size={18} />
                        <span>กลับไปหน้ารวมศูนย์</span>
                    </Link>
                    <div className={styles.actionButtons}>
                        <Link href={`/admin/stock/shelter/${shelterId}/report`} className={styles.reportBtn}>
                            📊 ดูรายงาน
                        </Link>
                        <Link href={`/admin/stock/transfers?shelterId=${shelterId}`} className={styles.transferBtn}>
                            🔄 โอนสินค้า
                        </Link>
                    </div>
                </div>

                {/* Shelter Info Card */}
                <div className={styles.shelterInfoCard}>
                    <div className={styles.shelterHeader}>
                        <div className={styles.shelterIcon}>📍</div>
                        <div className={styles.shelterDetails}>
                            <h2>{data.shelter.name}</h2>
                            <p className={styles.shelterLocation}>
                                <MapPin size={14} />
                                {data.shelter.location?.district || 'ไม่ระบุ'}, {data.shelter.location?.subdistrict || ''}
                            </p>
                        </div>
                        <div className={`${styles.statusBadge} ${styles[`status${data.shelter.status?.charAt(0).toUpperCase()}${data.shelter.status?.slice(1)}`]}`}>
                            {data.shelter.status === 'active' ? '🟢 เปิดใช้งาน' : data.shelter.status === 'full' ? '🟡 เต็ม' : '⚪ ปิด'}
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className={styles.statsRow}>
                        <div className={styles.statItem}>
                            <Package size={20} />
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{data.summary.totalItems}</span>
                                <span className={styles.statLabel}>รายการสินค้า</span>
                            </div>
                        </div>
                        <div className={styles.statItem}>
                            <TrendingUp size={20} />
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{data.summary.totalQuantity.toLocaleString()}</span>
                                <span className={styles.statLabel}>จำนวนรวม</span>
                            </div>
                        </div>
                        <div className={`${styles.statItem} ${data.summary.lowStockCount > 0 ? styles.warning : ''}`}>
                            <AlertTriangle size={20} />
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{data.summary.lowStockCount}</span>
                                <span className={styles.statLabel}>สินค้าใกล้หมด</span>
                            </div>
                        </div>
                        <div className={`${styles.statItem} ${data.summary.criticalCount > 0 ? styles.critical : ''}`}>
                            <TrendingDown size={20} />
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{data.summary.criticalCount}</span>
                                <span className={styles.statLabel}>วิกฤต/หมด</span>
                            </div>
                        </div>
                        {data.shelter.contactPerson && (
                            <div className={styles.statItem}>
                                <Users size={20} />
                                <div className={styles.statContent}>
                                    <span className={styles.statValue}>{data.shelter.contactPerson.name}</span>
                                    <span className={styles.statLabel}>{data.shelter.contactPerson.phone}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stock Management Section */}
                <div className={styles.stockSection}>
                    <div className={styles.sectionHeader}>
                        <h3>📦 รายการสินค้าในศูนย์</h3>
                        <div className={styles.filterRow}>
                            <div className={styles.searchBox}>
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="ค้นหาสินค้า..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className={styles.filterGroup}>
                                <Filter size={16} />
                                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                    <option value="all">ทุกหมวด</option>
                                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                                        <option key={key} value={key}>{config.emoji} {config.label}</option>
                                    ))}
                                </select>
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="all">ทุกสถานะ</option>
                                    <option value="sufficient">เพียงพอ</option>
                                    <option value="low">ใกล้ต่ำ</option>
                                    <option value="critical">วิกฤต</option>
                                    <option value="outOfStock">หมด</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Stock Table */}
                    <div className={styles.tableContainer}>
                        <table className={styles.stockTable}>
                            <thead>
                                <tr>
                                    <th>สินค้า</th>
                                    <th>หมวดหมู่</th>
                                    <th>จำนวน</th>
                                    <th>สถานะ</th>
                                    <th>แก้ไข</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStock.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className={styles.emptyRow}>
                                            ไม่พบรายการสินค้า
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStock.map(item => (
                                        <tr key={item.stockId} className={styles[`row${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`]}>
                                            <td className={styles.itemName}>
                                                <span className={styles.itemEmoji}>
                                                    {CATEGORY_CONFIG[item.category]?.emoji || '📦'}
                                                </span>
                                                {item.itemName}
                                            </td>
                                            <td>
                                                <span className={styles.categoryTag} style={{ backgroundColor: CATEGORY_CONFIG[item.category]?.color + '20', color: CATEGORY_CONFIG[item.category]?.color }}>
                                                    {CATEGORY_CONFIG[item.category]?.label || item.category}
                                                </span>
                                            </td>
                                            <td>
                                                {editingItem === item.stockId ? (
                                                    <input
                                                        type="number"
                                                        className={styles.editInput}
                                                        value={editQuantity}
                                                        onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                                        min={0}
                                                    />
                                                ) : (
                                                    <span className={styles.quantity}>
                                                        {item.quantity.toLocaleString()} {item.unit}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`${styles.statusTag} ${styles[`status${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`]}`}>
                                                    {getStatusLabel(item.status)}
                                                </span>
                                            </td>
                                            <td>
                                                {editingItem === item.stockId ? (
                                                    <div className={styles.editActions}>
                                                        <button
                                                            className={styles.saveBtn}
                                                            onClick={() => handleSaveQuantity(item.stockId)}
                                                            disabled={saving}
                                                        >
                                                            <Save size={14} />
                                                        </button>
                                                        <button
                                                            className={styles.cancelBtn}
                                                            onClick={handleEditCancel}
                                                            disabled={saving}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className={styles.editBtn}
                                                        onClick={() => handleEditStart(item)}
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Movements Section */}
                <div className={styles.movementsSection}>
                    <div className={styles.sectionHeader}>
                        <h3>📋 ประวัติการเคลื่อนไหวล่าสุด</h3>
                    </div>

                    <div className={styles.movementsList}>
                        {data.recentMovements.length === 0 ? (
                            <div className={styles.emptyMovements}>
                                ยังไม่มีประวัติการเคลื่อนไหว
                            </div>
                        ) : (
                            data.recentMovements.map(movement => (
                                <div key={movement._id} className={styles.movementItem}>
                                    <div className={styles.movementIcon}>
                                        {getMovementIcon(movement.movementType)}
                                    </div>
                                    <div className={styles.movementContent}>
                                        <div className={styles.movementTitle}>
                                            <span className={`${styles.movementType} ${styles[`type${movement.movementType.charAt(0).toUpperCase() + movement.movementType.slice(1)}`]}`}>
                                                {getMovementLabel(movement.movementType)}
                                            </span>
                                            <span className={styles.movementItemName}>{movement.itemName}</span>
                                        </div>
                                        <div className={styles.movementDetails}>
                                            <span>{movement.quantity} {movement.unit}</span>
                                            <span>•</span>
                                            <span>{movement.from} → {movement.to}</span>
                                        </div>
                                        <div className={styles.movementMeta}>
                                            <span>โดย: {movement.performedBy}</span>
                                            <span>{new Date(movement.performedAt).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
