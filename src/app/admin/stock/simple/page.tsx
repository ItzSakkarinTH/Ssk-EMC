'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { Package, TrendingUp, X, Search, ClipboardList, Plus } from 'lucide-react';
import styles from './simple.module.css';

interface StockItem {
    _id: string;
    name: string;
    category: string;
    unit: string;
    minStock: number;
}

interface Stock {
    _id: string;
    itemName: string;
    category: string;
    unit: string;
    provincialStock: number;
    totalQuantity: number;
    minStockLevel: number;
}

export default function SimpleStockPage() {
    const toast = useToast();
    const [items, setItems] = useState<StockItem[]>([]);
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [quantity, setQuantity] = useState(0);
    const [supplier, setSupplier] = useState('');
    const [notes, setNotes] = useState('');
    const [receivedDate, setReceivedDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('accessToken');

            // Fetch both items and stocks
            const [itemsRes, stocksRes] = await Promise.all([
                fetch('/api/admin/items', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/stock/admin/province-stock', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (itemsRes.ok) {
                const data = await itemsRes.json();
                setItems(data.items || []);
            }

            if (stocksRes.ok) {
                const data = await stocksRes.json();
                setStocks(data.stocks || []);
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrReceive = (item: StockItem) => {
        // Check if stock already exists
        const existingStock = stocks.find(s => s.itemName === item.name);

        if (existingStock) {
            // Already in stock - receive mode
            setSelectedStock(existingStock);
            setSelectedItem(null);
        } else {
            // Not in stock - add mode
            setSelectedItem(item);
            setSelectedStock(null);
        }

        // Reset form และตั้งเวลาปัจจุบัน
        setQuantity(0);
        setSupplier('');
        setNotes('');

        // ตั้งวันเวลาปัจจุบันในรูปแบบ datetime-local
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setReceivedDate(`${year}-${month}-${day}T${hours}:${minutes}`);

        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (quantity <= 0) {
            toast.error('กรุณาระบุจำนวนที่ถูกต้อง');
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            let res;

            if (selectedStock) {
                // Receive to existing stock
                const payload = {
                    stockId: selectedStock._id,
                    quantity,
                    supplier,
                    notes,
                    receivedDate
                };
                console.log('Sending to /receive:', payload);

                res = await fetch('/api/stock/admin/receive', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            } else if (selectedItem) {
                // Initialize new stock
                const payload = {
                    itemName: selectedItem.name,
                    category: selectedItem.category,
                    unit: selectedItem.unit,
                    initialQuantity: quantity,
                    supplier,
                    notes,
                    receivedDate,
                    minStockLevel: selectedItem.minStock || 10,
                    criticalLevel: Math.floor((selectedItem.minStock || 10) / 2)
                };
                console.log('Sending to /initialize:', payload);

                res = await fetch('/api/stock/admin/initialize', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            }

            if (res && res.ok) {
                const now = new Date();
                const timeStr = new Intl.DateTimeFormat('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short'
                }).format(now);

                toast.success(selectedStock
                    ? `✅ รับสินค้าเข้ากองกลางสำเร็จ (${timeStr})`
                    : `✅ เพิ่มสินค้าเข้าระบบสต็อกสำเร็จ (${timeStr})`
                );

                console.log('Stock updated at:', now.toISOString());
                setShowModal(false);
                fetchData(); // Refresh data
            } else {
                const errorData = await res?.json();
                console.error('API Error:', errorData);

                // แสดง error details
                if (errorData?.details) {
                    console.error('Validation errors:', errorData.details);
                    const errors = errorData.details.map((d: { message: string }) => d.message).join(', ');
                    toast.error(`ข้อมูลไม่ถูกต้อง: ${errors}`);
                } else {
                    toast.error(errorData?.error || 'เกิดข้อผิดพลาด');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('เกิดข้อผิดพลาด');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStockForItem = (itemName: string) => {
        return stocks.find(s => s.itemName === itemName);
    };

    if (loading) {
        return (
            <DashboardLayout title="จัดการสต็อกแบบง่าย" subtitle="เพิ่มและรับสินค้าในหน้าเดียว">
                <div className="dash-loading">
                    <div className="dash-spinner"></div>
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="จัดการสต็อกแบบง่าย"
            subtitle="เพิ่มและรับสินค้าในหน้าเดียว"
        >
            <div className="dash-alert dash-alert-info" style={{ marginBottom: '1.5rem' }}>
                <strong>💡 วิธีใช้:</strong> กดปุ่มที่สินค้าที่ต้องการ - ถ้ายังไม่มีในสต็อกจะเพิ่มใหม่ / ถ้ามีแล้วจะรับเข้าเพิ่ม
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <Link href="/admin/items" className="dash-btn dash-btn-secondary" style={{ textDecoration: 'none' }}>
                    <ClipboardList size={18} />
                    จัดการรายการสินค้า
                </Link>
                <Link href="/admin/items" className="dash-btn dash-btn-primary" style={{ textDecoration: 'none' }}>
                    <Plus size={18} />
                    เพิ่มสินค้าใหม่
                </Link>
            </div>

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

            {/* Items Grid */}
            {filteredItems.length > 0 ? (
                <div className={styles.itemsGrid}>
                    {filteredItems.map((item) => {
                        const stock = getStockForItem(item.name);
                        const isInStock = !!stock;

                        return (
                            <div key={item._id} className={styles.itemCard}>
                                <div className={styles.itemHeader}>
                                    <Package size={24} style={{ color: 'var(--dash-primary)' }} />
                                    {isInStock && (
                                        <span className="dash-badge dash-badge-success" style={{ fontSize: '0.75rem' }}>
                                            ในสต็อก
                                        </span>
                                    )}
                                </div>

                                <div className={styles.itemName}>{item.name}</div>
                                <div className={styles.itemCategory}>
                                    <span className="dash-badge dash-badge-info">{item.category}</span>
                                </div>

                                <div className={styles.itemInfo}>
                                    <div>หน่วย: <strong>{item.unit}</strong></div>
                                    {isInStock && stock ? (
                                        <div style={{
                                            color: 'var(--dash-success)',
                                            fontWeight: 700,
                                            fontSize: '1rem',
                                            padding: '0.5rem',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            borderRadius: '6px',
                                            textAlign: 'center'
                                        }}>
                                            กองกลาง: {stock.provincialStock.toLocaleString()} {item.unit}
                                        </div>
                                    ) : (
                                        <div style={{
                                            color: 'var(--dash-warning)',
                                            fontWeight: 600,
                                            fontSize: '0.875rem'
                                        }}>
                                            ยังไม่มีในสต็อก
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="dash-btn dash-btn-primary"
                                    onClick={() => handleAddOrReceive(item)}
                                    style={{ width: '100%', marginTop: '1rem' }}
                                >
                                    <TrendingUp size={18} />
                                    เพิ่มเข้ากองกลาง
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <Package size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>ไม่พบสินค้า</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (selectedItem || selectedStock) && (
                <div className="dash-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dash-modal-header">
                            <h2>
                                เพิ่ม {selectedItem?.name || selectedStock?.itemName} เข้ากองกลาง
                            </h2>
                            <button className="dash-modal-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="dash-modal-body">
                                {/* แสดงสถานะปัจจุบัน */}
                                {selectedStock && (
                                    <div className="dash-alert dash-alert-info" style={{ marginBottom: '1.5rem' }}>
                                        <strong>สต็อกปัจจุบัน:</strong> {selectedStock.provincialStock.toLocaleString()} {selectedStock.unit}
                                    </div>
                                )}
                                {!selectedStock && (
                                    <div className="dash-alert dash-alert-warning" style={{ marginBottom: '1.5rem' }}>
                                        <strong>หมายเหตุ:</strong> สินค้านี้ยังไม่มีในสต็อก จะถูกเพิ่มเข้าระบบพร้อมจำนวนที่ระบุ
                                    </div>
                                )}

                                <div className="dash-form-grid">
                                    <div className="dash-form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="dash-label">จำนวนที่ต้องการเพิ่ม *</label>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input
                                                type="number"
                                                className="dash-input"
                                                value={quantity || ''}
                                                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                                required
                                                min="1"
                                                autoFocus
                                                style={{ flex: 1 }}
                                            />
                                            <span style={{ fontWeight: 600, minWidth: '60px' }}>
                                                {selectedItem?.unit || selectedStock?.unit}
                                            </span>
                                        </div>
                                        {selectedStock && quantity > 0 && (
                                            <small style={{
                                                color: 'var(--dash-success)',
                                                fontWeight: 600,
                                                marginTop: '0.5rem',
                                                display: 'block'
                                            }}>
                                                → หลังเพิ่ม: {(selectedStock.provincialStock + quantity).toLocaleString()} {selectedStock.unit}
                                            </small>
                                        )}
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">ผู้ส่ง/แหล่งที่มา</label>
                                        <input
                                            type="text"
                                            className="dash-input"
                                            value={supplier}
                                            onChange={(e) => setSupplier(e.target.value)}
                                            placeholder="เช่น กรมป้องกันฯ"
                                        />
                                    </div>



                                    <div className="dash-form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="dash-label">วันเวลาที่รับ</label>
                                        <input
                                            type="datetime-local"
                                            className="dash-input"
                                            value={receivedDate}
                                            onChange={(e) => setReceivedDate(e.target.value)}
                                            max={(() => {
                                                const now = new Date();
                                                const year = now.getFullYear();
                                                const month = String(now.getMonth() + 1).padStart(2, '0');
                                                const day = String(now.getDate()).padStart(2, '0');
                                                const hours = String(now.getHours()).padStart(2, '0');
                                                const minutes = String(now.getMinutes()).padStart(2, '0');
                                                return `${year}-${month}-${day}T${hours}:${minutes}`;
                                            })()}
                                        />
                                        <small style={{ color: 'var(--dash-text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem', display: 'block' }}>
                                            กำหนดเอง หรือใช้เวลาปัจจุบัน
                                        </small>
                                    </div>

                                    <div className="dash-form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="dash-label">หมายเหตุ</label>
                                        <textarea
                                            className="dash-input"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows={2}
                                            placeholder="ข้อมูลเพิ่มเติม (ถ้ามี)"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="dash-modal-footer">
                                <button
                                    type="button"
                                    className="dash-btn dash-btn-secondary"
                                    onClick={() => setShowModal(false)}
                                    disabled={submitting}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="dash-btn dash-btn-success"
                                    disabled={submitting}
                                >
                                    {submitting ? 'กำลังบันทึก...' : '✅ เพิ่มเข้ากองกลาง'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
