'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { useToast } from '@/contexts/ToastContext';
import { ArrowLeft, Download, Calendar, TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react';
import styles from './shelter-report.module.css';

interface StockItem {
    stockId: string;
    itemName: string;
    category: string;
    quantity: number;
    unit: string;
    status: string;
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
        location?: { district?: string; subdistrict?: string };
        capacity?: number;
        currentOccupancy?: number;
        contactPerson?: { name: string; phone: string };
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

export default function ShelterReportPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const shelterId = params.id as string;

    const [data, setData] = useState<ShelterData | null>(null);
    const [loading, setLoading] = useState(true);

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

    const handleExportPDF = () => {
        toast.info('กำลังสร้างไฟล์ PDF...');
        // TODO: Implement PDF export
        setTimeout(() => {
            toast.success('ฟีเจอร์นี้กำลังพัฒนา');
        }, 1000);
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

    // Calculate stats
    const getTotalReceived = () => {
        if (!data) return 0;
        return data.recentMovements
            .filter(m => m.movementType === 'receive' || (m.movementType === 'transfer' && m.to.includes(data.shelter.name)))
            .reduce((sum, m) => sum + m.quantity, 0);
    };

    const getTotalDispensed = () => {
        if (!data) return 0;
        return data.recentMovements
            .filter(m => m.movementType === 'dispense')
            .reduce((sum, m) => sum + m.quantity, 0);
    };

    const getCategoryData = () => {
        if (!data || !data.summary.categoryBreakdown) return [];
        return Object.entries(data.summary.categoryBreakdown)
            .map(([key, value]) => ({
                key,
                ...value,
                config: CATEGORY_CONFIG[key] || { label: key, emoji: '📦', color: '#94a3b8' }
            }))
            .sort((a, b) => b.quantity - a.quantity);
    };

    const getHealthScore = () => {
        if (!data || data.summary.totalItems === 0) return 100;
        const goodItems = data.summary.totalItems - data.summary.lowStockCount - data.summary.criticalCount;
        return Math.round((goodItems / data.summary.totalItems) * 100);
    };

    const getHealthStatus = (score: number) => {
        if (score >= 80) return { label: 'ดีมาก', color: '#10b981', emoji: '🟢' };
        if (score >= 60) return { label: 'ปานกลาง', color: '#f59e0b', emoji: '🟡' };
        if (score >= 40) return { label: 'ต้องดูแล', color: '#f97316', emoji: '🟠' };
        return { label: 'วิกฤต', color: '#ef4444', emoji: '🔴' };
    };

    if (loading) {
        return (
            <DashboardLayout title="กำลังโหลด..." subtitle="">
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>กำลังสร้างรายงาน...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!data) {
        return (
            <DashboardLayout title="ไม่พบข้อมูล" subtitle="">
                <div className={styles.errorContainer}>
                    <p>ไม่พบข้อมูลศูนย์พักพิง</p>
                </div>
            </DashboardLayout>
        );
    }

    const healthScore = getHealthScore();
    const healthStatus = getHealthStatus(healthScore);
    const categoryData = getCategoryData();

    return (
        <DashboardLayout
            title={`รายงาน: ${data.shelter.name}`}
            subtitle={`รหัส ${data.shelter.code} | สร้างเมื่อ ${new Date().toLocaleDateString('th-TH')}`}
        >
            <div className={styles.container}>
                {/* Top Actions */}
                <div className={styles.topActions}>
                    <Link href={`/admin/stock/shelter/${shelterId}`} className={styles.backLink}>
                        <ArrowLeft size={18} />
                        <span>กลับไปหน้าจัดการ</span>
                    </Link>
                    <button className={styles.exportBtn} onClick={handleExportPDF}>
                        <Download size={16} />
                        <span>ส่งออก PDF</span>
                    </button>
                </div>

                {/* Report Header */}
                <div className={styles.reportHeader}>
                    <div className={styles.reportTitle}>
                        <h2>📊 รายงานสรุปสต๊อกศูนย์พักพิง</h2>
                        <p>{data.shelter.name} | {data.shelter.location?.district || ''} {data.shelter.location?.subdistrict || ''}</p>
                    </div>
                    <div className={styles.reportDate}>
                        <Calendar size={16} />
                        <span>ข้อมูล ณ วันที่ {new Date().toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                </div>

                {/* Overall Health Score */}
                <div className={styles.healthCard}>
                    <div className={styles.healthScore} style={{ '--score-color': healthStatus.color } as React.CSSProperties}>
                        <div className={styles.scoreValue}>{healthScore}%</div>
                        <div className={styles.scoreLabel}>คะแนนภาพรวมสต๊อก</div>
                    </div>
                    <div className={styles.healthInfo}>
                        <div className={styles.healthStatus} style={{ color: healthStatus.color }}>
                            <span>{healthStatus.emoji}</span>
                            <span>สถานะ: {healthStatus.label}</span>
                        </div>
                        <p className={styles.healthDesc}>
                            {healthScore >= 80
                                ? 'สต๊อกส่วนใหญ่อยู่ในระดับเพียงพอ ไม่จำเป็นต้องดำเนินการเร่งด่วน'
                                : healthScore >= 60
                                    ? 'มีบางรายการที่ต้องติดตาม ควรพิจารณาเติมสต๊อกในเร็วๆ นี้'
                                    : 'มีหลายรายการที่ต้องเติมสต๊อกเร่งด่วน กรุณาดำเนินการโดยเร็ว'}
                        </p>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                            <Package size={24} />
                        </div>
                        <div className={styles.statContent}>
                            <div className={styles.statValue}>{data.summary.totalItems}</div>
                            <div className={styles.statLabel}>รายการสินค้า</div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                            <TrendingUp size={24} />
                        </div>
                        <div className={styles.statContent}>
                            <div className={styles.statValue}>{data.summary.totalQuantity.toLocaleString()}</div>
                            <div className={styles.statLabel}>จำนวนรวม</div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div className={styles.statContent}>
                            <div className={styles.statValue}>{data.summary.lowStockCount}</div>
                            <div className={styles.statLabel}>รายการใกล้หมด</div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                            <TrendingDown size={24} />
                        </div>
                        <div className={styles.statContent}>
                            <div className={styles.statValue}>{data.summary.criticalCount}</div>
                            <div className={styles.statLabel}>รายการวิกฤต</div>
                        </div>
                    </div>
                </div>

                {/* Movement Summary */}
                <div className={styles.movementSummary}>
                    <h3>📈 สรุปการเคลื่อนไหวล่าสุด</h3>
                    <div className={styles.movementCards}>
                        <div className={`${styles.movementCard} ${styles.received}`}>
                            <span className={styles.movementEmoji}>📥</span>
                            <div className={styles.movementValue}>{getTotalReceived().toLocaleString()}</div>
                            <div className={styles.movementLabel}>รับเข้า</div>
                        </div>
                        <div className={`${styles.movementCard} ${styles.dispensed}`}>
                            <span className={styles.movementEmoji}>📤</span>
                            <div className={styles.movementValue}>{getTotalDispensed().toLocaleString()}</div>
                            <div className={styles.movementLabel}>เบิกจ่าย</div>
                        </div>
                        <div className={styles.movementCard}>
                            <span className={styles.movementEmoji}>📋</span>
                            <div className={styles.movementValue}>{data.recentMovements.length}</div>
                            <div className={styles.movementLabel}>กิจกรรมทั้งหมด</div>
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className={styles.categorySection}>
                    <h3>📦 สต๊อกแยกตามหมวดหมู่</h3>
                    <div className={styles.categoryList}>
                        {categoryData.map(cat => {
                            const maxQty = Math.max(...categoryData.map(c => c.quantity), 1);
                            const percentage = (cat.quantity / maxQty) * 100;

                            return (
                                <div key={cat.key} className={styles.categoryItem}>
                                    <div className={styles.categoryHeader}>
                                        <div className={styles.categoryIcon} style={{ backgroundColor: cat.config.color + '20' }}>
                                            {cat.config.emoji}
                                        </div>
                                        <div className={styles.categoryInfo}>
                                            <div className={styles.categoryName}>{cat.config.label}</div>
                                            <div className={styles.categoryStats}>
                                                {cat.count} รายการ • {cat.quantity.toLocaleString()} หน่วย
                                                {cat.lowCount > 0 && <span className={styles.warningTag}>⚠️ {cat.lowCount} ใกล้หมด</span>}
                                                {cat.criticalCount > 0 && <span className={styles.criticalTag}>🔴 {cat.criticalCount} วิกฤต</span>}
                                            </div>
                                        </div>
                                        <div className={styles.categoryValue} style={{ color: cat.config.color }}>
                                            {cat.quantity.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className={styles.categoryProgress}>
                                        <div
                                            className={styles.categoryBar}
                                            style={{
                                                width: `${Math.max(percentage, 5)}%`,
                                                backgroundColor: cat.config.color
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Stock Items Table */}
                <div className={styles.stockSection}>
                    <h3>📝 รายการสินค้าทั้งหมด ({data.stock.length} รายการ)</h3>
                    <div className={styles.tableContainer}>
                        <table className={styles.stockTable}>
                            <thead>
                                <tr>
                                    <th>ลำดับ</th>
                                    <th>ชื่อสินค้า</th>
                                    <th>หมวดหมู่</th>
                                    <th>จำนวน</th>
                                    <th>สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.stock.map((item, idx) => (
                                    <tr key={item.stockId}>
                                        <td>{idx + 1}</td>
                                        <td className={styles.itemName}>
                                            {CATEGORY_CONFIG[item.category]?.emoji || '📦'} {item.itemName}
                                        </td>
                                        <td>
                                            <span className={styles.categoryTag} style={{
                                                backgroundColor: (CATEGORY_CONFIG[item.category]?.color || '#94a3b8') + '20',
                                                color: CATEGORY_CONFIG[item.category]?.color || '#94a3b8'
                                            }}>
                                                {CATEGORY_CONFIG[item.category]?.label || item.category}
                                            </span>
                                        </td>
                                        <td className={styles.quantity}>
                                            {item.quantity.toLocaleString()} {item.unit}
                                        </td>
                                        <td>
                                            <span className={`${styles.statusTag} ${styles[item.status]}`}>
                                                {getStatusLabel(item.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.reportFooter}>
                    <p>รายงานนี้สร้างโดยอัตโนมัติจากระบบ ศรีสะเกษพร้อม</p>
                    <p>วันที่สร้าง: {new Date().toLocaleString('th-TH')}</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
