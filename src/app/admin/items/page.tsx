'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import AdminLayout from '@/components/AdminLayout/AdminLayout';
import { Package, Edit, Trash2, Plus, Search } from 'lucide-react';

interface StockItem {
    _id: string;
    name: string;
    category: string;
    unit: string;
    description?: string;
    minStock: number;
    maxStock: number;
}

export default function ItemsPage() {
    const toast = useToast();
    const [items, setItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchItems();
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
                toast.error('ไม่สามารถโหลดข้อมูลสินค้าได้');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
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
            toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = [...new Set(items.map(item => item.category))];

    if (loading) {
        return (
            <AdminLayout title="จัดการรายการสินค้า" subtitle="จัดการรายการสินค้าในระบบ">
                <div className="admin-loading">
                    <div className="admin-spinner"></div>
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
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
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-stat-icon-primary">
                            <Package size={28} />
                        </div>
                        <div className="admin-stat-content">
                            <div className="admin-stat-value">{items.length}</div>
                            <div className="admin-stat-label">สินค้าทั้งหมด</div>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-stat-icon-info">
                            <Package size={28} />
                        </div>
                        <div className="admin-stat-content">
                            <div className="admin-stat-value">{categories.length}</div>
                            <div className="admin-stat-label">หมวดหมู่</div>
                        </div>
                    </div>
                </div>

                <button className="admin-btn admin-btn-primary">
                    <Plus size={20} />
                    เพิ่มสินค้า
                </button>
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
                        className="admin-input"
                        placeholder="ค้นหาสินค้า..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '3rem' }}
                    />
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
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
                                    <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.name}</div>
                                    {item.description && (
                                        <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                            {item.description}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <span className="admin-badge admin-badge-info">
                                        {item.category}
                                    </span>
                                </td>
                                <td>{item.unit}</td>
                                <td>{item.minStock.toLocaleString()}</td>
                                <td>{item.maxStock.toLocaleString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                        <button className="admin-btn admin-btn-secondary" style={{ padding: '0.5rem' }}>
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="admin-btn admin-btn-danger"
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
        </AdminLayout>
    );
}
