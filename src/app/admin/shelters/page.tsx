'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import SearchableSelect from '@/components/SearchableSelect';
import { Building2, MapPin, Users, Edit, Plus, X, FileText, User } from 'lucide-react';
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

    // Get unique districts
    const districts = ['ทั้งหมด', ...new Set(shelters.map(s => s.location.district))];

    // Filter shelters
    const filteredShelters = shelters.filter(shelter => {
        const matchDistrict = selectedDistrict === 'ทั้งหมด' || shelter.location.district === selectedDistrict;
        const matchSearch = shelter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shelter.location.district.toLowerCase().includes(searchTerm.toLowerCase());
        return matchDistrict && matchSearch;
    });

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
            {/* Filter Section */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <Building2 size={24} />
                    <h3>เลือกเขตอำเภอ</h3>
                </div>

                <div className={styles.filterControls}>
                    {/* District Dropdown */}
                    <div className={styles.filterGroup}>
                        <MapPin size={18} />
                        <label>เขตอำเภอ</label>
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

                    {/* Search Box */}
                    <div className={styles.filterGroup}>
                        <Users size={18} />
                        <label>ค้นหาชื่อศูนย์พักพิง</label>
                        <input
                            type="text"
                            className="dash-input"
                            placeholder="ป้อนชื่อศูนย์พักพิง..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Statistics */}
                <div className={styles.filterStats}>
                    <div className={styles.statItem}>
                        <Building2 size={16} />
                        <span>เขตอำเภอ: <strong>{districts.length - 1}</strong> เขต</span>
                    </div>
                    <div className={styles.statItem}>
                        <Users size={16} />
                        <span>ศูนย์พักพิงทั้งหมด: <strong>{filteredShelters.length}</strong> แห่ง</span>
                    </div>
                </div>
            </div>

            {/* Results Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                marginTop: '2rem'
            }}>
                <h2 className={styles.resultsTitle}>
                    ศูนย์พักพิงใน {selectedDistrict} <span className="dash-badge dash-badge-info">
                        {filteredShelters.filter(s => s.status === 'active').length}/{filteredShelters.length} แห่ง
                    </span>
                </h2>
                <button
                    className="dash-btn dash-btn-primary"
                    onClick={() => handleOpenModal()}
                >
                    <Plus size={20} />
                    เพิ่มศูนย์พักพิง
                </button>
            </div>

            {filteredShelters.length > 0 ? (
                <div className={styles.sheltersGrid}>
                    {filteredShelters.map((shelter) => {
                        const occupancyPercent = getOccupancyPercentage(shelter);

                        return (
                            <div key={shelter._id} className={styles.shelterCard}>
                                {/* Status Badge */}
                                <div className={styles.statusBadge}>
                                    <span className={`dash-badge ${shelter.status === 'active' ? 'dash-badge-success' :
                                        shelter.status === 'full' ? 'dash-badge-warning' :
                                            'dash-badge-danger'
                                        }`}>
                                        {shelter.status === 'active' ? 'เปิดใช้งาน' :
                                            shelter.status === 'full' ? 'เต็ม' : 'ปิดใช้งาน'}
                                    </span>
                                </div>

                                {/* Location */}
                                <div className={styles.locationInfo}>
                                    <MapPin size={18} />
                                    <div>
                                        <div className={styles.shelterName}>{shelter.name}</div>
                                        <div className={styles.shelterDistrict}>
                                            {shelter.location.district}, {shelter.location.province}
                                        </div>
                                    </div>
                                </div>

                                {/* Capacity */}
                                <div className={styles.capacitySection}>
                                    <div className={styles.capacityHeader}>
                                        <Users size={16} />
                                        <span>รายการสินค้าในศูนย์</span>
                                        <span className={styles.capacityCount}>
                                            {shelter.currentOccupancy} รายการ
                                        </span>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{
                                                width: `${occupancyPercent}%`,
                                                backgroundColor: occupancyPercent >= 90 ? '#ef4444' :
                                                    occupancyPercent >= 70 ? '#f59e0b' :
                                                        '#10b981'
                                            }}
                                        ></div>
                                    </div>
                                    <div
                                        className={styles.occupancyText}
                                        style={{
                                            color: occupancyPercent <= 30 ? '#ef4444' :
                                                occupancyPercent <= 69 ? '#f59e0b' :
                                                    '#10b981',
                                            fontWeight: 600
                                        }}
                                    >
                                        {occupancyPercent}% ของความจุ ({shelter.capacity} รายการ)
                                    </div>
                                </div>

                                {/* Assigned Staff */}
                                <div className={styles.contactInfo}>
                                    <User size={16} />
                                    <span>
                                        {shelter.assignedStaff && shelter.assignedStaff.length > 0 ? (
                                            <span style={{ color: '#10b981', fontWeight: 600 }}>
                                                👤 {shelter.assignedStaff[0].name}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#f59e0b' }}>ยังไม่มีผู้ดูแล</span>
                                        )}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.actionBtnPrimary}
                                        onClick={() => handleOpenModal(shelter)}
                                    >
                                        <Edit size={16} />
                                        แก้ไข
                                    </button>
                                    <button
                                        className={styles.actionBtnSecondary}
                                    >
                                        <FileText size={16} />
                                        ดูรายงาน
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#94a3b8'
                }}>
                    <Building2 size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>ยังไม่มีศูนย์พักพิงในระบบ</p>
                    <button
                        className="dash-btn dash-btn-primary"
                        onClick={() => handleOpenModal()}
                        style={{ marginTop: '1rem' }}
                    >
                        <Plus size={20} />
                        เพิ่มศูนย์พักพิงแรก
                    </button>
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
        </DashboardLayout>
    );
}
