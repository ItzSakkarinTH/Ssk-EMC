
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { Bell, Plus, Edit, Trash2, AlertCircle, Info, AlertTriangle, X, Radio, Siren, Sparkles } from 'lucide-react';

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

    const fetchAnnouncements = useCallback(async () => {
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
    }, [toast]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

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
                    'Authorization': `Bearer ${token} `,
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
        if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบประกาศ "${title}" ? `)) {
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
                return 'dash-badge-urgent';
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', flex: 1 }}>
                    <div className="dash-stat-card" style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                        <div className="dash-stat-icon" style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
                        }}>
                            <Bell size={28} />
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value" style={{
                                background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>{announcements.length}</div>
                            <div className="dash-stat-label">ประกาศทั้งหมด</div>
                        </div>
                    </div>
                    <div className="dash-stat-card" style={{
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                        border: '1px solid rgba(34, 197, 94, 0.2)'
                    }}>
                        <div className="dash-stat-icon" style={{
                            background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                            boxShadow: '0 8px 16px rgba(34, 197, 94, 0.3)'
                        }}>
                            <Radio size={28} />
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value" style={{
                                background: 'linear-gradient(135deg, #4ade80 0%, #34d399 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>{activeCount}</div>
                            <div className="dash-stat-label">กำลังแสดง</div>
                        </div>
                    </div>
                    <div className="dash-stat-card" style={{
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <div className="dash-stat-icon" style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            boxShadow: '0 8px 16px rgba(239, 68, 68, 0.3)',
                            animation: urgentCount > 0 ? 'pulse 2s ease-in-out infinite' : 'none'
                        }}>
                            <Siren size={28} />
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value" style={{
                                background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>{urgentCount}</div>
                            <div className="dash-stat-label">ด่วนมาก</div>
                        </div>
                    </div>
                </div>

                <button
                    className="dash-btn dash-btn-primary"
                    onClick={() => handleOpenModal()}
                    style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
                    }}
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
                                    <h3 className="dash-card-title" style={{ marginBottom: '0.25rem', color: 'var(--dash-text-primary)' }}>
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
                            <p style={{ color: 'var(--dash-text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
                                {announcement.content}
                            </p>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingTop: '1rem',
                                borderTop: '1px solid rgba(148, 163, 184, 0.15)',
                                fontSize: '0.875rem',
                                color: 'var(--dash-text-muted)'
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
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.5rem',
                        border: '2px solid rgba(99, 102, 241, 0.2)'
                    }}>
                        <Bell size={64} style={{ opacity: 0.6, color: '#818cf8' }} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#cbd5e1' }}>
                        ยังไม่มีประกาศในระบบ
                    </h3>
                    <p style={{ marginBottom: '2rem', color: '#94a3b8' }}>
                        เริ่มสร้างประกาศแรกของคุณเพื่อแจ้งข่าวสารสำคัญ
                    </p>
                    <button
                        className="dash-btn dash-btn-primary"
                        onClick={() => handleOpenModal()}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                            padding: '0.75rem 2rem'
                        }}
                    >
                        <Plus size={20} />
                        สร้างประกาศแรก
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="dash-modal-overlay" onClick={handleCloseModal}>
                    <div className="dash-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '600px'
                    }}>
                        <div className="dash-modal-header" style={{
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                            borderBottom: '1px solid rgba(99, 102, 241, 0.2)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Sparkles size={20} />
                                </div>
                                <h2 style={{ margin: 0 }}>{editingAnnouncement ? 'แก้ไขประกาศ' : 'สร้างประกาศใหม่'}</h2>
                            </div>
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
                                        placeholder="เช่น: ประกาศสำคัญ, การอัพเดตระบบ"
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
                                        placeholder="กรุณากรอกรายละเอียดประกาศ..."
                                        style={{ resize: 'vertical', minHeight: '120px' }}
                                    />
                                </div>

                                <div className="dash-form-grid">
                                    <div className="dash-form-group">
                                        <label className="dash-label">ประเภทประกาศ *</label>
                                        <select
                                            className="dash-input"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'info' | 'warning' | 'urgent' })}
                                            style={{
                                                borderColor: formData.type === 'urgent' ? '#ef4444' :
                                                    formData.type === 'warning' ? '#f59e0b' : '#6366f1'
                                            }}
                                        >
                                            <option value="info">💙 ข้อมูลทั่วไป - สำหรับข่าวสารทั่วไป</option>
                                            <option value="warning">⚠️ คำเตือน - ควรให้ความสนใจ</option>
                                            <option value="urgent">🚨 ด่วนมาก - ต้องดำเนินการทันที!</option>
                                        </select>
                                        <small style={{ color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>
                                            {formData.type === 'urgent' && '⚡ ประกาศนี้จะแสดงด้วยสีแดงและมี animation'}
                                            {formData.type === 'warning' && '⚡ ประกาศนี้จะแสดงด้วยสีส้ม'}
                                            {formData.type === 'info' && '⚡ ประกาศนี้จะแสดงด้วยสีน้ำเงิน'}
                                        </small>
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">สถานะ *</label>
                                        <select
                                            className="dash-input"
                                            value={formData.isActive ? 'active' : 'inactive'}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                                            style={{
                                                borderColor: formData.isActive ? '#22c55e' : '#94a3b8'
                                            }}
                                        >
                                            <option value="active">👁️ แสดงประกาศ - Visible</option>
                                            <option value="inactive">🚫 ซ่อนประกาศ - Hidden</option>
                                        </select>
                                        <small style={{ color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>
                                            {formData.isActive ? '✅ ประกาศนี้จะแสดงบนหน้า Dashboard' : '⚠️ ประกาศนี้จะไม่แสดงบนหน้า Dashboard'}
                                        </small>
                                    </div>
                                </div>
                            </div>

                            <div className="dash-modal-footer" style={{
                                background: 'var(--dash-bg-tertiary)',
                                borderTop: '1px solid var(--dash-border-color)'
                            }}>
                                <button
                                    type="button"
                                    className="dash-btn dash-btn-secondary"
                                    onClick={handleCloseModal}
                                    disabled={submitting}
                                    style={{
                                        background: 'rgba(148, 163, 184, 0.1)',
                                        border: '1px solid rgba(148, 163, 184, 0.2)'
                                    }}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="dash-btn dash-btn-primary"
                                    disabled={submitting}
                                    style={{
                                        background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        border: 'none',
                                        boxShadow: submitting ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {submitting && <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>}
                                    {submitting ? 'กำลังบันทึก...' : (editingAnnouncement ? '💾 บันทึกการแก้ไข' : '✨ สร้างประกาศ')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
