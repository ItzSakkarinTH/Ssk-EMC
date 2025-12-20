'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { Package, Plus, X, Search } from 'lucide-react';

interface StockItem {
    _id: string;
    name: string;
    category: string;
    unit: string;
    description?: string;
    minStock: number;
    maxStock: number;
}

interface InitializeFormData {
    itemId: string;
    itemName: string;
    category: string;
    unit: string;
    initialQuantity: number;
    supplier: string;
    documentNo: string;
    notes: string;
    minStockLevel: number;
    criticalLevel: number;
}

export default function InitializeStockPage() {
    const toast = useToast();
    const [items, setItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<InitializeFormData>({
        itemId: '',
        itemName: '',
        category: '',
        unit: '',
        initialQuantity: 0,
        supplier: '',
        documentNo: '',
        notes: '',
        minStockLevel: 10,
        criticalLevel: 5
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchItems = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/admin/items', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setItems(data.items || []);
            } else {
                console.error(res);
                toast.error('ไม่สามารถโหลดข้อมูลสินค้าได้');
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item: StockItem) => {
        setFormData({
            itemId: item._id,
            itemName: item.name,
            category: item.category,
            unit: item.unit,
            initialQuantity: 0,
            supplier: '',
            documentNo: '',
            notes: '',
            minStockLevel: item.minStock || 10,
            criticalLevel: Math.floor((item.minStock || 10) / 2)
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.initialQuantity < 0) {
            toast.error('จำนวนเริ่มต้นต้องไม่เป็นลบ');
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/stock/admin/initialize', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    itemName: formData.itemName,
                    category: formData.category,
                    unit: formData.unit,
                    initialQuantity: formData.initialQuantity,
                    supplier: formData.supplier,
                    documentNo: formData.documentNo,
                    notes: formData.notes,
                    minStockLevel: formData.minStockLevel,
                    criticalLevel: formData.criticalLevel
                })
            });

            if (res.ok) {
                toast.success('เพิ่มสินค้าเข้าระบบสต็อกสำเร็จ');
                handleCloseModal();
                // Redirect to receive page
                window.location.href = '/admin/stock/receive';
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Error initializing stock:', error);
            toast.error('เกิดข้อผิดพลาดในการเพิ่มสินค้า');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <DashboardLayout title="เพิ่มสินค้าเข้าระบบสต็อก" subtitle="สร้าง Stock Record จากรายการสินค้า">
                <div className="dash-loading">
                    <div className="dash-spinner"></div>
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="เพิ่มสินค้าเข้าระบบสต็อก"
            subtitle="สร้าง Stock Record จากรายการสินค้า"
        >
            <div className="dash-alert dash-alert-info" style={{ marginBottom: '2rem' }}>
                <strong>คำแนะนำ:</strong> เลือกสินค้าที่ต้องการเพิ่มเข้าระบบสต็อก จากนั้นระบุจำนวนเริ่มต้นและข้อมูลเพิ่มเติม
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

            {/* Items Table */}
            {filteredItems.length > 0 ? (
                <div className="dash-table-container">
                    <table className="dash-table">
                        <thead>
                            <tr>
                                <th>ชื่อสินค้า</th>
                                <th>หมวดหมู่</th>
                                <th>หน่วย</th>
                                <th>สต็อกต่ำสุด</th>
                                <th style={{ textAlign: 'center' }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => (
                                <tr key={item._id}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.name}</div>
                                        {item.description && (
                                            <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                                {item.description}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span className="dash-badge dash-badge-info">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td>{item.unit}</td>
                                    <td>{item.minStock.toLocaleString()}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="dash-btn dash-btn-success"
                                            onClick={() => handleOpenModal(item)}
                                        >
                                            <Plus size={16} />
                                            เพิ่มเข้าสต็อก
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <Package size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>{searchTerm ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีรายการสินค้าในระบบ'}</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        กรุณาเพิ่มรายการสินค้าที่ <a href="/admin/items" style={{ color: 'var(--dash-primary)' }}>หน้าจัดการรายการสินค้า</a> ก่อน
                    </p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="dash-modal-overlay" onClick={handleCloseModal}>
                    <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dash-modal-header">
                            <h2>เพิ่ม {formData.itemName} เข้าระบบสต็อก</h2>
                            <button className="dash-modal-close" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="dash-modal-body">
                                <div className="dash-form-grid">
                                    <div className="dash-form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="dash-label">จำนวนเริ่มต้น (รับเข้าครั้งแรก)</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="number"
                                                className="dash-input"
                                                value={formData.initialQuantity || ''}
                                                onChange={(e) => setFormData({ ...formData, initialQuantity: parseInt(e.target.value) || 0 })}
                                                min="0"
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
                                        <small style={{ color: 'var(--dash-text-muted)', fontSize: '0.8125rem' }}>
                                            ใส่ 0 ถ้าต้องการสร้าง Stock record โดยไม่มีของตอนนี้
                                        </small>
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">สต็อกต่ำสุด *</label>
                                        <input
                                            type="number"
                                            className="dash-input"
                                            value={formData.minStockLevel}
                                            onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
                                            required
                                            min="1"
                                        />
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">ระดับวิกฤติ *</label>
                                        <input
                                            type="number"
                                            className="dash-input"
                                            value={formData.criticalLevel}
                                            onChange={(e) => setFormData({ ...formData, criticalLevel: parseInt(e.target.value) || 0 })}
                                            required
                                            min="1"
                                        />
                                    </div>

                                    {formData.initialQuantity > 0 && (
                                        <>
                                            <div className="dash-form-group">
                                                <label className="dash-label">ผู้ส่ง/แหล่งที่มา</label>
                                                <input
                                                    type="text"
                                                    className="dash-input"
                                                    value={formData.supplier}
                                                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
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
                                                    rows={2}
                                                    placeholder="ข้อมูลเพิ่มเติม (ถ้ามี)"
                                                />
                                            </div>
                                        </>
                                    )}
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
                                    className="dash-btn dash-btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'กำลังบันทึก...' : 'เพิ่มเข้าระบบสต็อก'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
