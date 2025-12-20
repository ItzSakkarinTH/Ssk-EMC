'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import AdminLayout from '@/components/AdminLayout/AdminLayout';
import { Building2, MapPin, Users, Edit, Trash2, Plus } from 'lucide-react';
import styles from './shelters.module.css';

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
}

export default function SheltersPage() {
    const toast = useToast();
    const [shelters, setShelters] = useState<Shelter[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchShelters();
    }, []);

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
                toast.error('ไม่สามารถโหลดข้อมูลศูนย์พักพิงได้');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบศูนย์พักพิง "${name}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/admin/shelters/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('ลบศูนย์พักพิงสำเร็จ');
                fetchShelters();
            } else {
                toast.error('ไม่สามารถลบศูนย์พักพิงได้');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
        }
    };

    if (loading) {
        return (
            <AdminLayout title="จัดการศูนย์พักพิง" subtitle="จัดการข้อมูลศูนย์พักพิงในระบบ">
                <div className="admin-loading">
                    <div className="admin-spinner"></div>
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title="จัดการศูนย์พักพิง"
            subtitle="จัดการข้อมูลศูนย์พักพิงในระบบ"
        >
            <div className={styles.header}>
                <div className={styles.stats}>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-stat-icon-primary">
                            <Building2 size={28} />
                        </div>
                        <div className="admin-stat-content">
                            <div className="admin-stat-value">{shelters.length}</div>
                            <div className="admin-stat-label">ศูนย์ทั้งหมด</div>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-stat-icon-success">
                            <Building2 size={28} />
                        </div>
                        <div className="admin-stat-content">
                            <div className="admin-stat-value">
                                {shelters.filter(s => s.status === 'active').length}
                            </div>
                            <div className="admin-stat-label">เปิดใช้งาน</div>
                        </div>
                    </div>
                </div>

                <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => setShowModal(true)}
                >
                    <Plus size={20} />
                    เพิ่มศูนย์พักพิง
                </button>
            </div>

            <div className="admin-grid admin-grid-auto">
                {shelters.map((shelter) => (
                    <div key={shelter._id} className="admin-card">
                        <div className="admin-card-header">
                            <div>
                                <h3 className="admin-card-title">{shelter.name}</h3>
                                <p className="admin-text-muted">รหัส: {shelter.code}</p>
                            </div>
                            <span className={`admin-badge ${shelter.status === 'active' ? 'admin-badge-success' :
                                    shelter.status === 'full' ? 'admin-badge-warning' :
                                        'admin-badge-danger'
                                }`}>
                                {shelter.status === 'active' ? 'เปิดใช้งาน' :
                                    shelter.status === 'full' ? 'เต็ม' : 'ปิดใช้งาน'}
                            </span>
                        </div>

                        <div className="admin-card-body">
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <MapPin size={16} style={{ color: '#94a3b8' }} />
                                    <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                                        {shelter.location.district}, {shelter.location.province}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Users size={16} style={{ color: '#94a3b8' }} />
                                    <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                                        {shelter.currentOccupancy} / {shelter.capacity} คน
                                    </span>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid rgba(148, 163, 184, 0.15)'
                            }}>
                                <button className="admin-btn admin-btn-secondary" style={{ flex: 1 }}>
                                    <Edit size={16} />
                                    แก้ไข
                                </button>
                                <button
                                    className="admin-btn admin-btn-danger"
                                    onClick={() => handleDelete(shelter._id, shelter.name)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {shelters.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#94a3b8'
                }}>
                    <Building2 size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>ยังไม่มีศูนย์พักพิงในระบบ</p>
                    <button
                        className="admin-btn admin-btn-primary"
                        onClick={() => setShowModal(true)}
                        style={{ marginTop: '1rem' }}
                    >
                        <Plus size={20} />
                        เพิ่มศูนย์พักพิงแรก
                    </button>
                </div>
            )}
        </AdminLayout>
    );
}
