'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { Users, UserPlus, Edit, Trash2, Shield, User, Search } from 'lucide-react';

interface SystemUser {
    _id: string;
    username: string;
    email: string;
    role: 'admin' | 'staff';
    shelter?: {
        _id: string;
        name: string;
    };
    createdAt: string;
    lastLogin?: string;
}

export default function UsersPage() {
    const toast = useToast();
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            } else {
                toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, username: string) => {
        if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ "${username}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('ลบผู้ใช้สำเร็จ');
                fetchUsers();
            } else {
                toast.error('ไม่สามารถลบผู้ใช้ได้');
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const adminCount = users.filter(u => u.role === 'admin').length;
    const staffCount = users.filter(u => u.role === 'staff').length;

    if (loading) {
        return (
            <DashboardLayout title="จัดการผู้ใช้งาน" subtitle="จัดการบัญชีผู้ใช้ในระบบ">
                <div className="dash-loading">
                    <div className="dash-spinner"></div>
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="จัดการผู้ใช้งาน"
            subtitle="จัดการบัญชีผู้ใช้ในระบบ"
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
                            <Users size={28} />
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value">{users.length}</div>
                            <div className="dash-stat-label">ผู้ใช้ทั้งหมด</div>
                        </div>
                    </div>
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon dash-stat-icon-warning">
                            <Shield size={28} />
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value">{adminCount}</div>
                            <div className="dash-stat-label">Admin</div>
                        </div>
                    </div>
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon dash-stat-icon-info">
                            <User size={28} />
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value">{staffCount}</div>
                            <div className="dash-stat-label">Staff</div>
                        </div>
                    </div>
                </div>

                <button className="dash-btn dash-btn-primary">
                    <UserPlus size={20} />
                    เพิ่มผู้ใช้
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
                        className="dash-input"
                        placeholder="ค้นหาผู้ใช้..."
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
                            <th>ชื่อผู้ใช้</th>
                            <th>อีเมล</th>
                            <th>บทบาท</th>
                            <th>ศูนย์พักพิง</th>
                            <th>เข้าสู่ระบบล่าสุด</th>
                            <th style={{ textAlign: 'center' }}>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user._id}>
                                <td>
                                    <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{user.username}</div>
                                </td>
                                <td style={{ color: '#cbd5e1' }}>{user.email}</td>
                                <td>
                                    <span className={`dash-badge ${user.role === 'admin' ? 'dash-badge-warning' : 'dash-badge-info'
                                        }`}>
                                        {user.role === 'admin' ? '👑 Admin' : '👤 Staff'}
                                    </span>
                                </td>
                                <td style={{ color: '#cbd5e1' }}>
                                    {user.shelter ? user.shelter.name : '-'}
                                </td>
                                <td style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                    {user.lastLogin
                                        ? new Date(user.lastLogin).toLocaleDateString('th-TH')
                                        : 'ยังไม่เคยเข้าสู่ระบบ'}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                        <button className="dash-btn dash-btn-secondary" style={{ padding: '0.5rem' }}>
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="dash-btn dash-btn-danger"
                                            style={{ padding: '0.5rem' }}
                                            onClick={() => handleDelete(user._id, user.username)}
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

            {filteredUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <Users size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>{searchTerm ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีผู้ใช้ในระบบ'}</p>
                </div>
            )}
        </DashboardLayout>
    );
}
