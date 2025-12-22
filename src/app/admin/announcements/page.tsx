'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { Megaphone, Plus, Edit, Trash2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface Announcement {
    _id: string;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'urgent';
    createdBy: {
        username: string;
    };
    createdAt: string;
    isActive: boolean;
}

interface AnnouncementFormData {
    title: string;
    content: string;
    type: 'info' | 'warning' | 'urgent';
    isActive: boolean;
}

export default function AnnouncementsPage() {
    const toast = useToast();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<AnnouncementFormData>({
        title: '',
        content: '',
        type: 'info',
        isActive: true
    });

    useEffect(() => {
        fetchAnnouncements();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/admin/announcements', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data.announcements || []);
            } else {
                console.error('Failed to load announcements:', res.status, res.statusText);
                toast.error('ไม่สามารถโหลดข้อมูลประกาศได้');
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (announcement?: Announcement) => {
        if (announcement) {
            setEditingAnnouncement(announcement);
            setFormData({
                title: announcement.title,
                content: announcement.content,
                type: announcement.type,
                isActive: announcement.isActive
            });
        } else {
            setEditingAnnouncement(null);
            setFormData({
                title: '',
                content: '',
                type: 'info',
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingAnnouncement(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const url = editingAnnouncement
                ? `/api/admin/announcements/${editingAnnouncement._id}`
                : '/api/admin/announcements';
            const method = editingAnnouncement ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(editingAnnouncement ? 'แก้ไขประกาศสำเร็จ' : 'สร้างประกาศสำเร็จ');
                handleCloseModal();
                fetchAnnouncements();
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Error submitting announcement:', error);
            toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบประกาศ "${title}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/admin/announcements/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('ลบประกาศสำเร็จ');
                fetchAnnouncements();
            } else {
                console.error('Failed to delete announcement:', res.status, res.statusText);
                toast.error('ไม่สามารถลบประกาศได้');
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาดในการลบประกาศ');
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'urgent':
                return <AlertCircle size={20} />;
            case 'warning':
                return <AlertTriangle size={20} />;
            default:
                return <Info size={20} />;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'urgent':
                return 'dash-badge-danger';
            case 'warning':
                return 'dash-badge-warning';
            default:
                return 'dash-badge-info';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'urgent':
                return 'ด่วนมาก';
            case 'warning':
                return 'คำเตือน';
            default:
                return 'ข้อมูลทั่วไป';
        }
    };

    const activeCount = announcements.filter(a => a.isActive).length;
    const urgentCount = announcements.filter(a => a.type === 'urgent').length;

    if (loading) {
        return (
            <DashboardLayout title="จัดการประกาศ" subtitle="จัดการประกาศและข้อมูลข่าวสาร">
                <div className="dash-loading">
                    <div className="dash-spinner"></div>
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="จัดการประกาศ"
            subtitle="จัดการประกาศและข้อมูลข่าวสาร"
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                gap: '1rem',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', flex: 1 }}>
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon dash-stat-icon-primary">
                            <Megaphone size={28} />
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value">{announcements.length}</div>
                            <div className="dash-stat-label">ประกาศทั้งหมด</div>
                        </div>
                    </div>
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon dash-stat-icon-success">
                            <Megaphone size={28} />
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value">{activeCount}</div>
                            <div className="dash-stat-label">กำลังแสดง</div>
                        </div>
                    </div>
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon dash-stat-icon-danger">
                            <AlertCircle size={28} />
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value">{urgentCount}</div>
                            <div className="dash-stat-label">ด่วนมาก</div>
                        </div>
                    </div>
                </div>

                <button
                    className="dash-btn dash-btn-primary"
                    onClick={() => handleOpenModal()}
                >
                    <Plus size={20} />
                    สร้างประกาศ
                </button>
            </div>

            <div className="dash-grid dash-grid-auto">
                {announcements.map((announcement) => (
                    <div key={announcement._id} className="dash-card">
                        <div className="dash-card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: announcement.type === 'urgent' ? 'rgba(239, 68, 68, 0.15)' :
                                        announcement.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' :
                                            'rgba(59, 130, 246, 0.15)',
                                    color: announcement.type === 'urgent' ? '#fca5a5' :
                                        announcement.type === 'warning' ? '#fcd34d' :
                                            '#60a5fa'
                                }}>
                                    {getTypeIcon(announcement.type)}
                                </div>
                                <div>
                                    <h3 className="dash-card-title" style={{ marginBottom: '0.25rem' }}>
                                        {announcement.title}
                                    </h3>
                                    <span className={`dash-badge ${getTypeBadge(announcement.type)}`}>
                                        {getTypeLabel(announcement.type)}
                                    </span>
                                </div>
                            </div>
                            <span className={`dash-badge ${announcement.isActive ? 'dash-badge-success' : 'dash-badge-secondary'}`}>
                                {announcement.isActive ? 'แสดง' : 'ซ่อน'}
                            </span>
                        </div>

                        <div className="dash-card-body">
                            <p style={{ color: '#cbd5e1', marginBottom: '1rem', lineHeight: 1.6 }}>
                                {announcement.content}
                            </p>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingTop: '1rem',
                                borderTop: '1px solid rgba(148, 163, 184, 0.15)',
                                fontSize: '0.875rem',
                                color: '#94a3b8'
                            }}>
                                <div>
                                    โดย: {announcement.createdBy.username}
                                    <br />
                                    {new Date(announcement.createdAt).toLocaleDateString('th-TH')}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="dash-btn dash-btn-secondary"
                                        style={{ padding: '0.5rem' }}
                                        onClick={() => handleOpenModal(announcement)}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        className="dash-btn dash-btn-danger"
                                        style={{ padding: '0.5rem' }}
                                        onClick={() => handleDelete(announcement._id, announcement.title)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {announcements.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <Megaphone size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>ยังไม่มีประกาศในระบบ</p>
                    <button
                        className="dash-btn dash-btn-primary"
                        style={{ marginTop: '1rem' }}
                        onClick={() => handleOpenModal()}
                    >
                        <Plus size={20} />
                        สร้างประกาศแรก
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="dash-modal-overlay" onClick={handleCloseModal}>
                    <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dash-modal-header">
                            <h2>{editingAnnouncement ? 'แก้ไขประกาศ' : 'สร้างประกาศใหม่'}</h2>
                            <button className="dash-modal-close" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="dash-modal-body">
                                <div className="dash-form-group">
                                    <label className="dash-label">หัวข้อประกาศ *</label>
                                    <input
                                        type="text"
                                        className="dash-input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        placeholder="กรุณากรอกหัวข้อประกาศ"
                                    />
                                </div>

                                <div className="dash-form-group">
                                    <label className="dash-label">เนื้อหาประกาศ *</label>
                                    <textarea
                                        className="dash-input"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        required
                                        rows={4}
                                        placeholder="กรุณากรอกเนื้อหาประกาศ"
                                        style={{ resize: 'vertical', minHeight: '100px' }}
                                    />
                                </div>

                                <div className="dash-form-grid">
                                    <div className="dash-form-group">
                                        <label className="dash-label">ประเภทประกาศ *</label>
                                        <select
                                            className="dash-input"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'info' | 'warning' | 'urgent' })}
                                        >
                                            <option value="info">ℹ️ ข้อมูลทั่วไป</option>
                                            <option value="warning">⚠️ คำเตือน</option>
                                            <option value="urgent">🚨 ด่วนมาก</option>
                                        </select>
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">สถานะ *</label>
                                        <select
                                            className="dash-input"
                                            value={formData.isActive ? 'active' : 'inactive'}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                                        >
                                            <option value="active">✅ แสดงประกาศ</option>
                                            <option value="inactive">❌ ซ่อนประกาศ</option>
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
                                    {submitting ? 'กำลังบันทึก...' : (editingAnnouncement ? 'บันทึกการแก้ไข' : 'สร้างประกาศ')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
