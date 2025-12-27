'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import FileUploadModal, { UploadedData } from '@/components/FileUploadModal/FileUploadModal';
import { Package, Edit, Trash2, Plus, Search, X, Upload } from 'lucide-react';

interface StockItem {
    _id: string;
    name: string;
    category: string;
    unit: string;
    description?: string;
    minStock: number;
    maxStock: number;
}

interface ItemFormData {
    name: string;
    category: string;
    unit: string;
    description: string;
    minStock: number;
    maxStock: number;
}

export default function ItemsPage() {
    const toast = useToast();
    const [items, setItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const [formData, setFormData] = useState<ItemFormData>({
        name: '',
        category: '',
        unit: '',
        description: '',
        minStock: 0,
        maxStock: 100
    });
    const [submitting, setSubmitting] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

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

    const handleOpenModal = (item?: StockItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                category: item.category,
                unit: item.unit,
                description: item.description || '',
                minStock: item.minStock,
                maxStock: item.maxStock
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                category: '',
                unit: '',
                description: '',
                minStock: 0,
                maxStock: 100
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const url = editingItem
                ? `/api/admin/items/${editingItem._id}`
                : '/api/admin/items';
            const method = editingItem ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(editingItem ? 'แก้ไขสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ');
                handleCloseModal();
                fetchItems();
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Error submitting item:', error);
            toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบสินค้า "${name}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/admin/items/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('ลบสินค้าสำเร็จ');
                fetchItems();
            } else {
                toast.error('ไม่สามารถลบสินค้าได้');
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาดในการลบสินค้า');
        }
    };

    const handleImportItems = async (uploadedData: UploadedData) => {
        const token = localStorage.getItem('accessToken');
        let successCount = 0;
        let errorCount = 0;

        for (const row of uploadedData.data) {
            try {
                const itemData = {
                    name: row.name as string,
                    category: row.category as string,
                    unit: row.unit as string,
                    minStock: Number(row.minStock) || 0,
                    maxStock: Number(row.maxStock) || 100,
                    description: (row.description as string) || ''
                };

                const res = await fetch('/api/admin/items', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(itemData)
                });

                if (res.ok) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                console.error('Error importing item:', error);
                errorCount++;
            }
        }

        if (successCount > 0) {
            toast.success(`นำเข้าสำเร็จ ${successCount} รายการ${errorCount > 0 ? `, ล้มเหลว ${errorCount} รายการ` : ''}`);
            fetchItems();
        } else {
            toast.error('ไม่สามารถนำเข้าข้อมูลได้');
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = [...new Set(items.map(item => item.category))];

    if (loading) {
        return (
            <DashboardLayout title="จัดการรายการสินค้า" subtitle="จัดการรายการสินค้าในระบบ">
                <div className="dash-loading">
                    <div className="dash-spinner"></div>
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="จัดการรายการสินค้า"
            subtitle="จัดการรายการสินค้าในระบบ"
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                gap: '1rem',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', flex: 1 }}>
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon dash-stat-icon-primary">
                            <Package size={28} />
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value">{items.length}</div>
                            <div className="dash-stat-label">สินค้าทั้งหมด</div>
                        </div>
                    </div>
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon dash-stat-icon-info">
                            <Package size={28} />
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value">{categories.length}</div>
                            <div className="dash-stat-label">หมวดหมู่</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="dash-btn dash-btn-secondary"
                        onClick={() => setShowUploadModal(true)}
                    >
                        <Upload size={20} />
                        นำเข้าข้อมูล
                    </button>
                    <button
                        className="dash-btn dash-btn-primary"
                        onClick={() => handleOpenModal()}
                    >
                        <Plus size={20} />
                        เพิ่มสินค้า
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
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

            <div className="dash-table-container">
                <table className="dash-table">
                    <thead>
                        <tr>
                            <th>ชื่อสินค้า</th>
                            <th>หมวดหมู่</th>
                            <th>หน่วย</th>
                            <th>สต๊อกต่ำสุด</th>
                            <th>สต๊อกสูงสุด</th>
                            <th style={{ textAlign: 'center' }}>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((item) => (
                            <tr key={item._id}>
                                <td>
                                    <div style={{ fontWeight: 600, color: 'var(--dash-text-primary)' }}>{item.name}</div>
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
                                <td>{item.maxStock.toLocaleString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                        <button
                                            className="dash-btn dash-btn-secondary"
                                            style={{ padding: '0.5rem' }}
                                            onClick={() => handleOpenModal(item)}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="dash-btn dash-btn-danger"
                                            style={{ padding: '0.5rem' }}
                                            onClick={() => handleDelete(item._id, item.name)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <Package size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>{searchTerm ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้าในระบบ'}</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="dash-modal-overlay" onClick={handleCloseModal}>
                    <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dash-modal-header">
                            <h2>{editingItem ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
                            <button className="dash-modal-close" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="dash-modal-body">
                                <div className="dash-form-grid">
                                    <div className="dash-form-group">
                                        <label className="dash-label">ชื่อสินค้า *</label>
                                        <input
                                            type="text"
                                            className="dash-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">หมวดหมู่ *</label>
                                        <select
                                            className="dash-input"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            required
                                        >
                                            <option value="">-- เลือกหมวดหมู่ --</option>
                                            <option value="อาหาร">อาหาร</option>
                                            <option value="เครื่องดื่ม">เครื่องดื่ม</option>
                                            <option value="ยา">ยา</option>
                                            <option value="เวชภัณฑ์">เวชภัณฑ์</option>
                                            <option value="เสื้อผ้า">เสื้อผ้า</option>
                                            <option value="ผ้าห่ม">ผ้าห่ม</option>
                                            <option value="อุปกรณ์อาบน้ำ">อุปกรณ์อาบน้ำ</option>
                                            <option value="อุปกรณ์ทำความสะอาด">อุปกรณ์ทำความสะอาด</option>
                                            <option value="อื่นๆ">อื่นๆ</option>
                                        </select>
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">หน่วย *</label>
                                        <select
                                            className="dash-input"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            required
                                        >
                                            <option value="">-- เลือกหน่วย --</option>
                                            <option value="ชิ้น">ชิ้น</option>
                                            <option value="กล่อง">กล่อง</option>
                                            <option value="แผ่น">แผ่น</option>
                                            <option value="ผืน">ผืน</option>
                                            <option value="ใบ">ใบ</option>
                                            <option value="ขวด">ขวด</option>
                                            <option value="ถุง">ถุง</option>
                                            <option value="ห่อ">ห่อ</option>
                                            <option value="แพ็ค">แพ็ค</option>
                                            <option value="ลัง">ลัง</option>
                                            <option value="ตัว">ตัว</option>
                                            <option value="คู่">คู่</option>
                                            <option value="ม้วน">ม้วน</option>
                                            <option value="เม็ด">เม็ด</option>
                                            <option value="หลอด">หลอด</option>
                                            <option value="ซอง">ซอง</option>
                                            <option value="โหล">โหล</option>
                                            <option value="กระป๋อง">กระป๋อง</option>
                                            <option value="ถัง">ถัง</option>
                                            <option value="เส้น">เส้น</option>
                                            <option value="กิโลกรัม">กิโลกรัม</option>
                                            <option value="ลิตร">ลิตร</option>
                                        </select>
                                    </div>

                                    <div className="dash-form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="dash-label">คำอธิบาย</label>
                                        <textarea
                                            className="dash-input"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={2}
                                            placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)"
                                        />
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">สต๊อกต่ำสุด *</label>
                                        <input
                                            type="number"
                                            className="dash-input"
                                            value={formData.minStock}
                                            onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                                            required
                                            min="0"
                                        />
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">สต๊อกสูงสุด *</label>
                                        <input
                                            type="number"
                                            className="dash-input"
                                            value={formData.maxStock}
                                            onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) })}
                                            required
                                            min="1"
                                        />
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
                                    className="dash-btn dash-btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'กำลังบันทึก...' : (editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* File Upload Modal */}
            <FileUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onImport={handleImportItems}
                type="items"
                title="นำเข้าข้อมูลสินค้า"
            />
        </DashboardLayout>
    );
}
