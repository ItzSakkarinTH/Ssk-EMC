'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import SearchableSelect from '@/components/SearchableSelect';
import FileUploadModal, { UploadedData, ImportProgress } from '@/components/FileUploadModal/FileUploadModal';
import {
    Building2, MapPin, Users, Edit, Plus, X, User, Upload,
    ChevronDown, ChevronLeft, ChevronRight, Package, Search
} from 'lucide-react';
import styles from './shelters.module.css';
import { getDistricts, getSubDistricts } from '@/lib/sisaket-data';

interface Shelter {
    _id: string;
    name: string;
    code: string;
    location: {
        province: string;
        district: string;
        subdistrict: string;
        address: string;
    };
    capacity: number;
    currentOccupancy: number;
    status: 'active' | 'inactive' | 'full';
    contactPerson: {
        name: string;
        phone: string;
    };
    assignedStaff?: {
        _id: string;
        username: string;
        name: string;
        email: string;
    }[];
}

interface ShelterFormData {
    name: string;
    province: string;
    district: string;
    subdistrict: string;
    address: string;
    capacity: number;
    status: 'active' | 'inactive';
    assignedStaffId: string;
}

interface StaffUser {
    _id: string;
    username: string;
    name: string;
    email: string;
}

export default function SheltersPage() {
    const toast = useToast();
    const [shelters, setShelters] = useState<Shelter[]>([]);
    const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);
    const [formData, setFormData] = useState<ShelterFormData>({
        name: '',
        province: 'ศรีสะเกษ',
        district: '',
        subdistrict: '',
        address: '',
        capacity: 100,
        status: 'active',
        assignedStaffId: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Filter states
    const [selectedDistrict, setSelectedDistrict] = useState<string>('ทั้งหมด');
    const [searchTerm, setSearchTerm] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        fetchShelters();
        fetchStaffUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchStaffUsers = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/admin/users?role=staff', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setStaffUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching staff users:', error);
        }
    };

    const fetchShelters = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/admin/shelters', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setShelters(data.shelters || []);
            } else {
                const errorData = await res.json();
                console.error('Failed to fetch shelters:', errorData);
                toast.error('ไม่สามารถโหลดข้อมูลศูนย์พักพิงได้');
            }
        } catch (error) {
            console.error('Error fetching shelters:', error);
            toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (shelter?: Shelter) => {
        if (shelter) {
            setEditingShelter(shelter);
            const assignedStaff = shelter.assignedStaff?.[0];
            setFormData({
                name: shelter.name,
                province: shelter.location.province,
                district: shelter.location.district,
                subdistrict: shelter.location.subdistrict,
                address: shelter.location.address,
                capacity: shelter.capacity,
                status: shelter.status === 'full' ? 'active' : shelter.status,
                assignedStaffId: assignedStaff?._id || ''
            });
        } else {
            setEditingShelter(null);
            setFormData({
                name: '',
                province: 'ศรีสะเกษ',
                district: '',
                subdistrict: '',
                address: '',
                capacity: 100,
                status: 'active',
                assignedStaffId: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingShelter(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const url = editingShelter
                ? `/api/admin/shelters/${editingShelter._id}`
                : '/api/admin/shelters';
            const method = editingShelter ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    // รหัสศูนย์จะถูกสร้างอัตโนมัติสำหรับศูนย์ใหม่ หรือส่งรหัสเดิมเมื่อแก้ไข
                    ...(editingShelter ? { code: editingShelter.code } : {}),
                    location: {
                        province: formData.province,
                        district: formData.district,
                        subdistrict: formData.subdistrict,
                        address: formData.address
                    },
                    capacity: formData.capacity,
                    status: formData.status,
                    assignedStaffId: formData.assignedStaffId || null
                })
            });

            if (res.ok) {
                toast.success(editingShelter ? 'แก้ไขศูนย์พักพิงสำเร็จ' : 'เพิ่มศูนย์พักพิงสำเร็จ');
                handleCloseModal();
                fetchShelters();
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Error submitting shelter:', error);
            toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setSubmitting(false);
        }
    };

    const getOccupancyPercentage = (shelter: Shelter) => {
        return Math.round((shelter.currentOccupancy / shelter.capacity) * 100);
    };

    // Progressive import function with progress tracking
    const handleProgressiveImportShelters = async (
        uploadedData: UploadedData,
        onProgress: (progress: ImportProgress) => void
    ): Promise<{ successCount: number; errorCount: number }> => {
        const token = localStorage.getItem('accessToken');
        const total = uploadedData.data.length;
        const startTime = Date.now();

        // Report initial progress
        onProgress({
            current: 0,
            total,
            successCount: 0,
            errorCount: 0,
            startTime,
            currentItem: 'กำลังเตรียมข้อมูล...'
        });

        // Transform data for bulk API
        const shelters = uploadedData.data.map(row => ({
            name: row.name as string,
            location: {
                province: 'ศรีสะเกษ',
                district: row.district as string,
                subdistrict: (row.subdistrict as string) || '',
                address: (row.address as string) || ''
            },
            capacity: Number(row.capacity) || 100,
            status: (row.status as string) || 'active'
        }));

        // Report preparing progress
        onProgress({
            current: Math.floor(total * 0.1),
            total,
            successCount: 0,
            errorCount: 0,
            startTime,
            currentItem: 'กำลังส่งข้อมูลไปยังเซิร์ฟเวอร์...'
        });

        try {
            const res = await fetch('/api/admin/shelters/bulk', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ shelters })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
            }

            const result = await res.json();
            const { successCount, errorCount } = result;

            // Report final progress
            onProgress({
                current: total,
                total,
                successCount,
                errorCount,
                startTime,
                currentItem: 'เสร็จสิ้น'
            });

            // Final toast notification
            if (successCount > 0) {
                toast.success(`นำเข้าสำเร็จ ${successCount} รายการ${errorCount > 0 ? `, ล้มเหลว ${errorCount} รายการ` : ''}`);
                fetchShelters();
            } else {
                toast.error('ไม่สามารถนำเข้าข้อมูลได้');
            }

            return { successCount, errorCount };
        } catch (error) {
            console.error('Error importing shelters:', error);
            toast.error(error instanceof Error ? error.message : 'ไม่สามารถนำเข้าข้อมูลได้');
            return { successCount: 0, errorCount: total };
        }
    };

    // Legacy import without progress (for small datasets)
    const handleImportShelters = async (uploadedData: UploadedData) => {
        await handleProgressiveImportShelters(uploadedData, () => { });
    };

    // Get unique districts
    const districts = ['ทั้งหมด', ...new Set(shelters.map(s => s.location.district))];

    // Filter shelters
    const filteredShelters = useMemo(() => {
        return shelters.filter(shelter => {
            const matchDistrict = selectedDistrict === 'ทั้งหมด' || shelter.location.district === selectedDistrict;
            const matchSearch = shelter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shelter.location.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shelter.code?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchDistrict && matchSearch;
        });
    }, [shelters, selectedDistrict, searchTerm]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const totalPages = Math.ceil(filteredShelters.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedShelters = filteredShelters.slice(startIndex, endIndex);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedDistrict, itemsPerPage]);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'เปิดใช้งาน';
            case 'full': return 'เต็ม';
            case 'inactive': return 'ปิดใช้งาน';
            default: return status;
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="จัดการศูนย์พักพิง" subtitle="จัดการข้อมูลศูนย์พักพิงในระบบ">
                <div className="dash-loading">
                    <div className="dash-spinner"></div>
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="รายงานศูนย์พักพิง"
            subtitle="จัดการข้อมูลศูนย์พักพิงในระบบ"
        >
            {/* Summary Stats */}
            <div className={styles.summary}>
                <div className={styles.summaryCard}>
                    <Building2 size={28} />
                    <div>
                        <div className={styles.summaryLabel}>ศูนย์พักพิงทั้งหมด</div>
                        <div className={styles.summaryValue}>{shelters.length}</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <Users size={28} style={{ color: '#10b981' }} />
                    <div>
                        <div className={styles.summaryLabel}>เปิดใช้งาน</div>
                        <div className={styles.summaryValue} style={{ color: '#10b981' }}>
                            {shelters.filter(s => s.status === 'active').length}
                        </div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <Package size={28} style={{ color: '#f59e0b' }} />
                    <div>
                        <div className={styles.summaryLabel}>เต็ม</div>
                        <div className={styles.summaryValue} style={{ color: '#f59e0b' }}>
                            {shelters.filter(s => s.status === 'full').length}
                        </div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <MapPin size={28} style={{ color: '#3b82f6' }} />
                    <div>
                        <div className={styles.summaryLabel}>อำเภอ</div>
                        <div className={styles.summaryValue}>{districts.length - 1}</div>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <Building2 size={22} />
                    <h3>ค้นหาศูนย์พักพิง</h3>
                </div>

                <div className={styles.filterControls}>
                    {/* Search */}
                    <div className={styles.filterGroup}>
                        <label><Search size={16} /> ค้นหา</label>
                        <input
                            type="text"
                            className="dash-input"
                            placeholder="ชื่อศูนย์พักพิง, รหัส..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* District Dropdown */}
                    <div className={styles.filterGroup}>
                        <label><MapPin size={16} /> อำเภอ</label>
                        <select
                            className="dash-input"
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                        >
                            {districts.map(district => (
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Results Header */}
            <div className={styles.tableHeader}>
                <div className={styles.resultsInfo}>
                    แสดง {filteredShelters.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredShelters.length)} จาก {filteredShelters.length} รายการ
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
                    </div>

                    <button
                        className="dash-btn dash-btn-secondary"
                        onClick={() => setShowUploadModal(true)}
                    >
                        <Upload size={18} />
                        นำเข้า
                    </button>
                    <button
                        className="dash-btn dash-btn-primary"
                        onClick={() => handleOpenModal()}
                    >
                        <Plus size={18} />
                        เพิ่มใหม่
                    </button>
                </div>
            </div>

            {/* List View */}
            {paginatedShelters.length > 0 ? (
                <>
                    <div className={styles.listContainer}>
                        {paginatedShelters.map((shelter) => {
                            const isExpanded = expandedId === shelter._id;
                            const occupancyPercent = getOccupancyPercentage(shelter);

                            return (
                                <div
                                    key={shelter._id}
                                    className={`${styles.listItem} ${isExpanded ? styles.expanded : ''}`}
                                >
                                    {/* List Item Header */}
                                    <div
                                        className={styles.listItemHeader}
                                        onClick={() => toggleExpand(shelter._id)}
                                    >
                                        <div className={`${styles.statusIndicator} ${styles[shelter.status]}`} />

                                        <div className={styles.shelterInfo}>
                                            <div className={styles.shelterName}>
                                                {shelter.name}
                                                <span style={{
                                                    marginLeft: '0.5rem',
                                                    fontSize: '0.75rem',
                                                    color: 'var(--dash-text-muted)',
                                                    fontWeight: 400
                                                }}>
                                                    {shelter.code}
                                                </span>
                                            </div>
                                            <div className={styles.shelterLocation}>
                                                <MapPin size={12} />
                                                {shelter.location.district}, {shelter.location.province}
                                            </div>
                                        </div>

                                        <div className={styles.shelterMeta}>
                                            <div className={styles.metaItem}>
                                                <Package size={16} />
                                                <span>สินค้า: <strong>{shelter.currentOccupancy}</strong></span>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <Users size={16} />
                                                <span>ความจุ: <strong>{shelter.capacity}</strong></span>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <User size={16} />
                                                <span>
                                                    {shelter.assignedStaff?.[0]?.name ||
                                                        <span style={{ color: '#f59e0b' }}>ไม่มีผู้ดูแล</span>
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.listItemActions}>
                                            <button
                                                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenModal(shelter);
                                                }}
                                            >
                                                <Edit size={14} />
                                                แก้ไข
                                            </button>
                                        </div>

                                        <button
                                            className={`${styles.expandBtn} ${isExpanded ? styles.expanded : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleExpand(shelter._id);
                                            }}
                                        >
                                            <ChevronDown size={18} />
                                        </button>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className={styles.expandedContent}>
                                            <div className={styles.expandedGrid}>
                                                <div className={styles.expandedItem}>
                                                    <div className={styles.expandedLabel}>รหัสศูนย์</div>
                                                    <div className={styles.expandedValue}>{shelter.code}</div>
                                                </div>
                                                <div className={styles.expandedItem}>
                                                    <div className={styles.expandedLabel}>สถานะ</div>
                                                    <div className={styles.expandedValue}>
                                                        <span className={`dash-badge ${shelter.status === 'active' ? 'dash-badge-success' :
                                                                shelter.status === 'full' ? 'dash-badge-warning' :
                                                                    'dash-badge-danger'
                                                            }`}>
                                                            {getStatusLabel(shelter.status)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={styles.expandedItem}>
                                                    <div className={styles.expandedLabel}>ตำบล</div>
                                                    <div className={styles.expandedValue}>{shelter.location.subdistrict || '-'}</div>
                                                </div>
                                                <div className={styles.expandedItem}>
                                                    <div className={styles.expandedLabel}>ที่อยู่</div>
                                                    <div className={styles.expandedValue}>{shelter.location.address || '-'}</div>
                                                </div>
                                                <div className={styles.expandedItem}>
                                                    <div className={styles.expandedLabel}>ผู้ดูแล</div>
                                                    <div className={styles.expandedValue}>
                                                        {shelter.assignedStaff?.[0] ? (
                                                            <span style={{ color: '#10b981' }}>
                                                                👤 {shelter.assignedStaff[0].name}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: '#f59e0b' }}>ยังไม่มีผู้ดูแล</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className={styles.progressSection}>
                                                <div className={styles.progressHeader}>
                                                    <span className={styles.progressLabel}>สินค้าในคลัง</span>
                                                    <span className={styles.progressValue}>
                                                        {shelter.currentOccupancy} / {shelter.capacity} ({occupancyPercent}%)
                                                    </span>
                                                </div>
                                                <div className={styles.progressBar}>
                                                    <div
                                                        className={styles.progressFill}
                                                        style={{
                                                            width: `${occupancyPercent}%`,
                                                            backgroundColor: occupancyPercent >= 90 ? '#ef4444' :
                                                                occupancyPercent >= 70 ? '#f59e0b' : '#10b981'
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Mobile Actions */}
                                            <div style={{
                                                display: 'flex',
                                                gap: '0.75rem',
                                                marginTop: '1rem',
                                                justifyContent: 'flex-end'
                                            }}>
                                                <button
                                                    className="dash-btn dash-btn-primary"
                                                    onClick={() => handleOpenModal(shelter)}
                                                >
                                                    <Edit size={16} />
                                                    แก้ไขข้อมูล
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
                    <Building2 size={64} />
                    <h3>{searchTerm || selectedDistrict !== 'ทั้งหมด' ? 'ไม่พบศูนย์พักพิง' : 'ยังไม่มีศูนย์พักพิงในระบบ'}</h3>
                    <p>{searchTerm || selectedDistrict !== 'ทั้งหมด' ? 'ลองปรับเปลี่ยนตัวกรองหรือคำค้นหา' : 'คลิกปุ่ม "เพิ่มใหม่" เพื่อเริ่มต้น'}</p>
                    {!searchTerm && selectedDistrict === 'ทั้งหมด' && (
                        <button
                            className="dash-btn dash-btn-primary"
                            onClick={() => handleOpenModal()}
                            style={{ marginTop: '1rem' }}
                        >
                            <Plus size={20} />
                            เพิ่มศูนย์พักพิงแรก
                        </button>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="dash-modal-overlay" onClick={handleCloseModal}>
                    <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dash-modal-header">
                            <h2>{editingShelter ? 'แก้ไขศูนย์พักพิง' : 'เพิ่มศูนย์พักพิงใหม่'}</h2>
                            <button className="dash-modal-close" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="dash-modal-body">
                                <div className="dash-form-grid">
                                    <div className="dash-form-group">
                                        <label className="dash-label">ชื่อศูนย์พักพิง *</label>
                                        <input
                                            type="text"
                                            className="dash-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {/* รหัสศูนย์จะถูกสร้างอัตโนมัติ - แสดงเฉพาะเมื่อแก้ไข */}
                                    {editingShelter && (
                                        <div className="dash-form-group">
                                            <label className="dash-label">รหัสศูนย์</label>
                                            <input
                                                type="text"
                                                className="dash-input"
                                                value={editingShelter.code}
                                                disabled
                                                style={{ backgroundColor: 'var(--dash-bg-tertiary)', color: 'var(--dash-text-muted)' }}
                                            />
                                            <small style={{ color: '#94a3b8' }}>รหัสศูนย์ไม่สามารถแก้ไขได้</small>
                                        </div>
                                    )}

                                    <div className="dash-form-group">
                                        <label className="dash-label">จังหวัด *</label>
                                        <input
                                            type="text"
                                            className="dash-input"
                                            value={formData.province}
                                            disabled
                                            style={{ backgroundColor: 'var(--dash-bg-tertiary)', color: 'var(--dash-text-muted)' }}
                                        />
                                        <small style={{ color: '#94a3b8' }}>จังหวัดคงที่: ศรีสะเกษ</small>
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">อำเภอ *</label>
                                        <SearchableSelect
                                            options={getDistricts()}
                                            value={formData.district}
                                            onChange={(value) => {
                                                setFormData({
                                                    ...formData,
                                                    district: value,
                                                    subdistrict: '' // รีเซ็ตตำบลเมื่อเปลี่ยนอำเภอ
                                                });
                                            }}
                                            placeholder="-- เลือกอำเภอ --"
                                            required
                                            emptyMessage="ไม่พบอำเภอที่ค้นหา"
                                        />
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">ตำบล *</label>
                                        <SearchableSelect
                                            options={formData.district ? getSubDistricts(formData.district) : []}
                                            value={formData.subdistrict}
                                            onChange={(value) => setFormData({ ...formData, subdistrict: value })}
                                            placeholder={formData.district ? '-- เลือกตำบล --' : '-- เลือกอำเภอก่อน --'}
                                            disabled={!formData.district}
                                            required
                                            emptyMessage="ไม่พบตำบลที่ค้นหา"
                                        />
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">ความจุ (รายการ) *</label>
                                        <input
                                            type="number"
                                            className="dash-input"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                            required
                                            min="1"
                                        />
                                    </div>

                                    <div className="dash-form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="dash-label">ที่อยู่</label>
                                        <textarea
                                            className="dash-input"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            rows={2}
                                        />
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">
                                            👤 เจ้าหน้าที่ผู้ดูแล
                                            <span style={{ fontSize: '0.875rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                                                (เลือกเจ้าหน้าที่ที่จะรับผิดชอบศูนย์นี้)
                                            </span>
                                        </label>
                                        <select
                                            className="dash-input"
                                            value={formData.assignedStaffId}
                                            onChange={(e) => setFormData({ ...formData, assignedStaffId: e.target.value })}
                                        >
                                            <option value="">-- ไม่มีผู้ดูแล --</option>
                                            {staffUsers.map(staff => (
                                                <option key={staff._id} value={staff._id}>
                                                    {staff.name} ({staff.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">สถานะ *</label>
                                        <select
                                            className="dash-input"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                                        >
                                            <option value="active">เปิดใช้งาน</option>
                                            <option value="inactive">ปิดใช้งาน</option>
                                        </select>
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
                                    {submitting ? 'กำลังบันทึก...' : (editingShelter ? 'บันทึกการแก้ไข' : 'เพิ่มศูนย์พักพิง')}
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
                onImport={handleImportShelters}
                onProgressiveImport={handleProgressiveImportShelters}
                type="shelters"
                title="นำเข้าข้อมูลศูนย์พักพิง"
            />
        </DashboardLayout>
    );
}
