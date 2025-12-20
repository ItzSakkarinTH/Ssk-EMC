'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { Package, Plus, X, TrendingUp, Search } from 'lucide-react';
import styles from './receive.module.css';

interface StockItem {
    _id: string;
    itemName: string;
    category: string;
    unit: string;
    provincialStock: number;
    totalQuantity: number;
    minStockLevel: number;
}

interface ReceiveFormData {
    stockId: string;
    itemName: string;
    unit: string;
    quantity: number;
    supplier: string;
    documentNo: string;
    notes: string;
}

export default function ReceiveStockPage() {
    const toast = useToast();
    const [stocks, setStocks] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<ReceiveFormData>({
        stockId: '',
        itemName: '',
        unit: '',
        quantity: 0,
        supplier: '',
        documentNo: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchStocks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchStocks = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/stock/admin/province-stock', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setStocks(data.stocks || []);
            } else {
                console.error(res);
                toast.error('ไม่สามารถโหลดข้อมูลสต็อกได้');
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (stock: StockItem) => {
        setFormData({
            stockId: stock._id,
            itemName: stock.itemName,
            unit: stock.unit,
            quantity: 0,
            supplier: '',
            documentNo: '',
            notes: ''
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({
            stockId: '',
            itemName: '',
            unit: '',
            quantity: 0,
            supplier: '',
            documentNo: '',
            notes: ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.quantity <= 0) {
            toast.error('กรุณาระบุจำนวนที่ถูกต้อง');
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/stock/admin/receive', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    stockId: formData.stockId,
                    quantity: formData.quantity,
                    supplier: formData.supplier,
                    documentNo: formData.documentNo,
                    notes: formData.notes
                })
            });

            if (res.ok) {
                toast.success('รับสินค้าเข้ากองกลางสำเร็จ');
                handleCloseModal();
                fetchStocks();
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Error receiving stock:', error);
            toast.error('เกิดข้อผิดพลาดในการรับสินค้า');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredStocks = stocks.filter(stock =>
        stock.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (stock: StockItem) => {
        const percent = (stock.provincialStock / stock.minStockLevel) * 100;
        if (percent >= 100) return '#10b981'; // green
        if (percent >= 50) return '#f59e0b'; // yellow
        return '#ef4444'; // red
    };

    if (loading) {
        return (
            <DashboardLayout title="รับสินค้าเข้ากองกลาง" subtitle="บันทึกการรับสินค้าเข้าสต็อกจังหวัด">
                <div className="dash-loading">
                    <div className="dash-spinner"></div>
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="รับสินค้าเข้ากองกลาง"
            subtitle="บันทึกการรับสินค้าเข้าสต็อกจังหวัด"
        >
            {/* Search */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <Search
                        size={20}
                        style={{
                            position: 'absolute',
                            left: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94a3b8'
                        }}
                    />
                    <input
                        type="text"
                        className="dash-input"
                        placeholder="ค้นหาสินค้า..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '3rem' }}
                    />
                </div>
            </div>

            {/* Stock Grid */}
            {filteredStocks.length > 0 ? (
                <div className={styles.stockGrid}>
                    {filteredStocks.map((stock) => (
                        <div key={stock._id} className={styles.stockCard}>
                            <div className={styles.stockHeader}>
                                <div>
                                    <div className={styles.stockName}>{stock.itemName}</div>
                                    <div className={styles.stockCategory}>
                                        <span className="dash-badge dash-badge-info">
                                            {stock.category}
                                        </span>
                                    </div>
                                </div>
                                <Package size={32} style={{ color: getStatusColor(stock), opacity: 0.8 }} />
                            </div>

                            <div className={styles.stockInfo}>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>สต็อกกองกลาง:</span>
                                    <span
                                        className={styles.infoValue}
                                        style={{ color: getStatusColor(stock), fontWeight: 700 }}
                                    >
                                        {stock.provincialStock.toLocaleString()} {stock.unit}
                                    </span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>สต็อกรวมทั้งหมด:</span>
                                    <span className={styles.infoValue}>
                                        {stock.totalQuantity.toLocaleString()} {stock.unit}
                                    </span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>สต็อกต่ำสุด:</span>
                                    <span className={styles.infoValue}>
                                        {stock.minStockLevel.toLocaleString()} {stock.unit}
                                    </span>
                                </div>
                            </div>

                            <button
                                className="dash-btn dash-btn-primary"
                                onClick={() => handleOpenModal(stock)}
                                style={{ width: '100%', marginTop: '1rem' }}
                            >
                                <Plus size={20} />
                                รับสินค้าเข้า
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <Package size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>{searchTerm ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสต็อกในระบบ'}</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="dash-modal-overlay" onClick={handleCloseModal}>
                    <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dash-modal-header">
                            <h2>รับ {formData.itemName} เข้ากองกลาง</h2>
                            <button className="dash-modal-close" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="dash-modal-body">
                                <div className="dash-form-grid">
                                    <div className="dash-form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="dash-label">จำนวนที่รับเข้า *</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="number"
                                                className="dash-input"
                                                value={formData.quantity || ''}
                                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                                required
                                                min="1"
                                                style={{ flex: 1 }}
                                            />
                                            <span style={{
                                                color: 'var(--dash-text-secondary)',
                                                fontWeight: 600,
                                                minWidth: '60px'
                                            }}>
                                                {formData.unit}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">ผู้ส่ง/แหล่งที่มา *</label>
                                        <input
                                            type="text"
                                            className="dash-input"
                                            value={formData.supplier}
                                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                            required
                                            placeholder="เช่น กรมป้องกันฯ"
                                        />
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">เลขที่เอกสาร</label>
                                        <input
                                            type="text"
                                            className="dash-input"
                                            value={formData.documentNo}
                                            onChange={(e) => setFormData({ ...formData, documentNo: e.target.value })}
                                            placeholder="เช่น DOC-2024-001"
                                        />
                                    </div>

                                    <div className="dash-form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="dash-label">หมายเหตุ</label>
                                        <textarea
                                            className="dash-input"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows={3}
                                            placeholder="ข้อมูลเพิ่มเติม (ถ้ามี)"
                                        />
                                    </div>

                                    {/* Summary */}
                                    <div className={styles.summary} style={{ gridColumn: '1 / -1' }}>
                                        <TrendingUp size={20} />
                                        <span>
                                            รับเข้า <strong>{formData.quantity.toLocaleString()} {formData.unit}</strong> จาก <strong>{formData.supplier || '(ระบุผู้ส่ง)'}</strong>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="dash-modal-footer">
                                <button
                                    type="button"
                                    className="dash-btn dash-btn-secondary"
                                    onClick={handleCloseModal}
                                    disabled={submitting}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="dash-btn dash-btn-success"
                                    disabled={submitting}
                                >
                                    {submitting ? 'กำลังบันทึก...' : 'บันทึกการรับสินค้า'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
