'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import FileUploadModal, { UploadedData, ImportProgress } from '@/components/FileUploadModal/FileUploadModal';
import {
    Package,
    Edit,
    Trash2,
    Plus,
    Search,
    X,
    Upload,
    Filter,
    ChevronLeft,
    ChevronRight,
    Layers
} from 'lucide-react';
import styles from './page.module.css';

interface StockItem {
    _id: string;
    name: string;
    category: string;
    unit: string;
    description?: string;
    minStock: number;
    maxStock: number | null;
}

interface ItemFormData {
    name: string;
    category: string;
    unit: string;
    description: string;
    minStock: number | string;
    maxStock: number | string;
}

const CATEGORIES = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'อาหาร', label: 'อาหาร' },
    { value: 'เครื่องดื่ม', label: 'เครื่องดื่ม' },
    { value: 'ยา', label: 'ยา' },
    { value: 'เวชภัณฑ์', label: 'เวชภัณฑ์' },
    { value: 'เสื้อผ้า', label: 'เสื้อผ้า' },
    { value: 'ผ้าห่ม', label: 'ผ้าห่ม' },
    { value: 'อุปกรณ์อาบน้ำ', label: 'อุปกรณ์อาบน้ำ' },
    { value: 'อุปกรณ์ทำความสะอาด', label: 'อุปกรณ์ทำความสะอาด' },
    { value: 'อื่นๆ', label: 'อื่นๆ' }
];

export default function ItemsPage() {
    const toast = useToast();
    const [items, setItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const [formData, setFormData] = useState<ItemFormData>({
        name: '',
        category: '',
        unit: '',
        description: '',
        minStock: 0,
        maxStock: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, categoryFilter, itemsPerPage]);

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
                minStock: item.minStock ?? 0,
                maxStock: item.maxStock ?? ''
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                category: '',
                unit: '',
                description: '',
                minStock: 0,
                maxStock: ''
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
                body: JSON.stringify({
                    ...formData,
                    minStock: formData.minStock === '' ? 0 : Number(formData.minStock),
                    maxStock: formData.maxStock === '' ? null : Number(formData.maxStock)
                })
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

    // Progressive import function with progress tracking
    const handleProgressiveImportItems = async (
        uploadedData: UploadedData,
        onProgress: (progress: ImportProgress) => void
    ): Promise<{ successCount: number; errorCount: number }> => {
        const token = localStorage.getItem('accessToken');
        let successCount = 0;
        let errorCount = 0;
        const total = uploadedData.data.length;
        const startTime = Date.now();

        for (let i = 0; i < uploadedData.data.length; i++) {
            const row = uploadedData.data[i];

            // Report progress before each item
            onProgress({
                current: i,
                total,
                successCount,
                errorCount,
                startTime,
                currentItem: row.name as string || `รายการ ${i + 1}`
            });

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

            // Report progress after each item
            onProgress({
                current: i + 1,
                total,
                successCount,
                errorCount,
                startTime,
                currentItem: row.name as string || `รายการ ${i + 1}`
            });
        }

        // Final toast notification
        if (successCount > 0) {
            toast.success(`นำเข้าสำเร็จ ${successCount} รายการ${errorCount > 0 ? `, ล้มเหลว ${errorCount} รายการ` : ''}`);
            fetchItems();
        } else {
            toast.error('ไม่สามารถนำเข้าข้อมูลได้');
        }

        return { successCount, errorCount };
    };

    // Legacy import without progress (for small datasets)
    const handleImportItems = async (uploadedData: UploadedData) => {
        await handleProgressiveImportItems(uploadedData, () => { });
    };

    // Filter items
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            // Search filter
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            // Category filter
            if (categoryFilter && item.category !== categoryFilter) return false;

            return true;
        });
    }, [items, searchTerm, categoryFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

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
            {/* Summary Stats */}
            <div className={styles.summary}>
                <div className={styles.summaryCard}>
                    <Package size={32} />
                    <div>
                        <div className={styles.summaryLabel}>สินค้าทั้งหมด</div>
                        <div className={styles.summaryValue}>{items.length}</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <Layers size={32} />
                    <div>
                        <div className={styles.summaryLabel}>หมวดหมู่</div>
                        <div className={styles.summaryValue}>{categories.length}</div>
                    </div>
                </div>
            </div>

            {/* Header with Action Buttons */}
            <div className={styles.headerSection}>
                <div></div>
                <div className={styles.actionButtons}>
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

            {/* Filter Section */}
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
                        placeholder="ค้นหาสินค้า..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '3rem' }}
                    />
                </div>

                {/* Category Filter */}
                <div className={styles.filterGroup}>
                    <Filter size={18} />
                    <span>หมวดหมู่:</span>
                    <div className={styles.buttonGroup}>
                        {CATEGORIES.slice(0, 5).map(cat => (
                            <button
                                key={cat.value}
                                className={`${styles.filterBtn} ${categoryFilter === cat.value ? styles.active : ''}`}
                                onClick={() => setCategoryFilter(cat.value)}
                            >
                                {cat.label}
                            </button>
                        ))}
                        {categoryFilter && !CATEGORIES.slice(0, 5).some(c => c.value === categoryFilter) && (
                            <button
                                className={`${styles.filterBtn} ${styles.active}`}
                                onClick={() => setCategoryFilter('')}
                            >
                                {categoryFilter}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Info & Per Page Selector */}
            <div className={styles.tableHeader}>
                <div className={styles.resultsInfo}>
                    แสดง {filteredItems.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredItems.length)} จาก {filteredItems.length} รายการ
                </div>
                <div className={styles.perPageSelector}>
                    <span>แสดง:</span>
                    {[5, 10, 25, 50].map(num => (
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
            {paginatedItems.length > 0 ? (
                <>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
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
                                {paginatedItems.map((item) => (
                                    <tr key={item._id}>
                                        <td>
                                            <div className={styles.itemName}>{item.name}</div>
                                            {item.description && (
                                                <div className={styles.itemDescription}>
                                                    {item.description}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={styles.categoryBadge}>
                                                {item.category}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles.unitBadge}>
                                                {item.unit}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles.stockValue}>
                                                {item.minStock?.toLocaleString() ?? 0}
                                            </span>
                                        </td>
                                        <td>
                                            {item.maxStock ? (
                                                <span className={styles.stockValue}>
                                                    {item.maxStock.toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className={styles.noLimit}>ไม่จำกัด</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className={styles.actionBtns}>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                                                    onClick={() => handleOpenModal(item)}
                                                    title="แก้ไข"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                                    onClick={() => handleDelete(item._id, item.name)}
                                                    title="ลบ"
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
                                        return page === 1 ||
                                            page === totalPages ||
                                            Math.abs(page - currentPage) <= 1;
                                    })
                                    .map((page, index, array) => {
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
                    <h3>{searchTerm || categoryFilter ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้าในระบบ'}</h3>
                    <p>{searchTerm || categoryFilter ? 'ลองปรับเปลี่ยนตัวกรองหรือคำค้นหา' : 'คลิกปุ่ม "เพิ่มสินค้า" เพื่อเริ่มต้น'}</p>
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
                                        <label className="dash-label">สต๊อกต่ำสุด</label>
                                        <input
                                            type="number"
                                            className="dash-input"
                                            value={formData.minStock}
                                            onChange={(e) => setFormData({ ...formData, minStock: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                            min="0"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">สต๊อกสูงสุด</label>
                                        <input
                                            type="number"
                                            className="dash-input"
                                            value={formData.maxStock}
                                            onChange={(e) => setFormData({ ...formData, maxStock: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                            min="1"
                                            placeholder="ไม่จำกัด (เว้นว่าง)"
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
                onProgressiveImport={handleProgressiveImportItems}
                type="items"
                title="นำเข้าข้อมูลสินค้า"
            />
        </DashboardLayout>
    );
}
