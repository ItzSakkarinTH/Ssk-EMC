'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import AdminLayout from '@/components/AdminLayout/AdminLayout';
import { Megaphone, Plus, Edit, Trash2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

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

export default function AnnouncementsPage() {
    const toast = useToast();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
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
                toast.error('ไม่สามารถโหลดข้อมูลประกาศได้');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
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
                toast.error('ไม่สามารถลบประกาศได้');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
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
                return 'admin-badge-danger';
            case 'warning':
                return 'admin-badge-warning';
            default:
                return 'admin-badge-info';
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
            <AdminLayout title="จัดการประกาศ" subtitle="จัดการประกาศและข้อมูลข่าวสาร">
                <div className="admin-loading">
                    <div className="admin-spinner"></div>
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
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
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-stat-icon-primary">
                            <Megaphone size={28} />
                        </div>
                        <div className="admin-stat-content">
                            <div className="admin-stat-value">{announcements.length}</div>
                            <div className="admin-stat-label">ประกาศทั้งหมด</div>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-stat-icon-success">
                            <Megaphone size={28} />
                        </div>
                        <div className="admin-stat-content">
                            <div className="admin-stat-value">{activeCount}</div>
                            <div className="admin-stat-label">กำลังแสดง</div>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-stat-icon-danger">
                            <AlertCircle size={28} />
                        </div>
                        <div className="admin-stat-content">
                            <div className="admin-stat-value">{urgentCount}</div>
                            <div className="admin-stat-label">ด่วนมาก</div>
                        </div>
                    </div>
                </div>

                <button className="admin-btn admin-btn-primary">
                    <Plus size={20} />
                    สร้างประกาศ
                </button>
            </div>

            <div className="admin-grid admin-grid-auto">
                {announcements.map((announcement) => (
                    <div key={announcement._id} className="admin-card">
                        <div className="admin-card-header">
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
                                    <h3 className="admin-card-title" style={{ marginBottom: '0.25rem' }}>
                                        {announcement.title}
                                    </h3>
                                    <span className={`admin-badge ${getTypeBadge(announcement.type)}`}>
                                        {getTypeLabel(announcement.type)}
                                    </span>
                                </div>
                            </div>
                            <span className={`admin-badge ${announcement.isActive ? 'admin-badge-success' : 'admin-badge-secondary'}`}>
                                {announcement.isActive ? 'แสดง' : 'ซ่อน'}
                            </span>
                        </div>

                        <div className="admin-card-body">
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
                                    <button className="admin-btn admin-btn-secondary" style={{ padding: '0.5rem' }}>
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        className="admin-btn admin-btn-danger"
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
                        className="admin-btn admin-btn-primary"
                        style={{ marginTop: '1rem' }}
                    >
                        <Plus size={20} />
                        สร้างประกาศแรก
                    </button>
                </div>
            )}
        </AdminLayout>
    );
}
