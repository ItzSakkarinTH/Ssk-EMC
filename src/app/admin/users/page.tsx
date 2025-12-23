'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { Users, UserPlus, Edit, Trash2, Shield, User, Search, X, Building2 } from 'lucide-react';

interface Shelter {
    _id: string;
    name: string;
    code: string;
}

interface SystemUser {
    _id: string;
    username: string;
    name: string;
    email: string;
    role: 'admin' | 'staff';
    assignedShelterId?: Shelter;
    createdAt: string;
    lastLogin?: string;
}

interface UserFormData {
    username: string;
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'staff';
    assignedShelterId: string;
}

export default function UsersPage() {
    const toast = useToast();
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [shelters, setShelters] = useState<Shelter[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<UserFormData>({
        username: '',
        name: '',
        email: '',
        password: '',
        role: 'staff',
        assignedShelterId: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchShelters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            }
        } catch (error) {
            console.error('Error fetching shelters:', error);
        }
    };

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

    const handleOpenModal = (user?: SystemUser) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
                assignedShelterId: user.assignedShelterId?._id || ''
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                name: '',
                email: '',
                password: '',
                role: 'staff',
                assignedShelterId: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const url = editingUser
                ? `/api/admin/users/${editingUser._id}`
                : '/api/admin/users';
            const method = editingUser ? 'PATCH' : 'POST';

            const payload: Partial<UserFormData> = {
                username: formData.username,
                name: formData.name,
                email: formData.email,
                role: formData.role,
                assignedShelterId: formData.role === 'staff' ? formData.assignedShelterId || undefined : undefined
            };

            // Only include password if it's set (for create or if changing password)
            if (formData.password) {
                payload.password = formData.password;
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(editingUser ? 'แก้ไขผู้ใช้สำเร็จ' : 'เพิ่มผู้ใช้สำเร็จ');
                handleCloseModal();
                fetchUsers();
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Error submitting user:', error);
            toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setSubmitting(false);
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
                const errorData = await res.json();
                toast.error(errorData.error || 'ไม่สามารถลบผู้ใช้ได้');
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const adminCount = users.filter(u => u.role === 'admin').length;
    const staffCount = users.filter(u => u.role === 'staff').length;
    const onlineRecently = users.filter(u => {
        if (!u.lastLogin) return false;
        const lastLogin = new Date(u.lastLogin);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastLogin.getTime()) / (1000 * 60);
        return diffMinutes < 30; // ออนไลน์ถ้าเข้าใช้ใน 30 นาทีที่แล้ว
    }).length;

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
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon dash-stat-icon-success">
                            <span style={{ fontSize: '1.5rem' }}>🟢</span>
                        </div>
                        <div className="dash-stat-content">
                            <div className="dash-stat-value">{onlineRecently}</div>
                            <div className="dash-stat-label">ออนไลน์</div>
                        </div>
                    </div>
                </div>

                <button
                    className="dash-btn dash-btn-primary"
                    onClick={() => handleOpenModal()}
                >
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
                            <th>สถานะ</th>
                            <th>ชื่อผู้ใช้</th>
                            <th>ชื่อจริง</th>
                            <th>อีเมล</th>
                            <th>บทบาท</th>
                            <th>ศูนย์พักพิง</th>
                            <th>เข้าสู่ระบบล่าสุด</th>
                            <th style={{ textAlign: 'center' }}>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => {
                            const isOnline = user.lastLogin && (new Date().getTime() - new Date(user.lastLogin).getTime()) / (1000 * 60) < 30;

                            return (
                                <tr key={user._id}>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{ fontSize: '1.25rem' }} title={isOnline ? 'ออนไลน์' : 'ออฟไลน์'}>
                                            {isOnline ? '🟢' : '⚪'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--dash-text-primary)' }}>{user.username}</div>
                                    </td>
                                    <td style={{ color: 'var(--dash-text-secondary)' }}>{user.name || '-'}</td>
                                    <td style={{ color: 'var(--dash-text-secondary)' }}>{user.email}</td>
                                    <td>
                                        <span className={`dash-badge ${user.role === 'admin' ? 'dash-badge-warning' : 'dash-badge-info'
                                            }`}>
                                            {user.role === 'admin' ? '👑 Admin' : '👤 Staff'}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--dash-text-secondary)' }}>
                                        {user.assignedShelterId ? (
                                            <span>
                                                <Building2 size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                                {user.assignedShelterId.name}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                        {user.lastLogin
                                            ? new Date(user.lastLogin).toLocaleString('th-TH', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                            : 'ยังไม่เคยเข้าสู่ระบบ'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button
                                                className="dash-btn dash-btn-secondary"
                                                style={{ padding: '0.5rem' }}
                                                onClick={() => handleOpenModal(user)}
                                                title="แก้ไข"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="dash-btn dash-btn-danger"
                                                style={{ padding: '0.5rem' }}
                                                onClick={() => handleDelete(user._id, user.username)}
                                                title="ลบ"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {filteredUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <Users size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>{searchTerm ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีผู้ใช้ในระบบ'}</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="dash-modal-overlay" onClick={handleCloseModal}>
                    <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dash-modal-header">
                            <h2>{editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h2>
                            <button className="dash-modal-close" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="dash-modal-body">
                                <div className="dash-form-grid">
                                    <div className="dash-form-group">
                                        <label className="dash-label">Username *</label>
                                        <input
                                            type="text"
                                            className="dash-input"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            required
                                            disabled={!!editingUser}
                                        />
                                        {editingUser && (
                                            <small style={{ color: '#94a3b8' }}>Username ไม่สามารถแก้ไขได้</small>
                                        )}
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">ชื่อจริง *</label>
                                        <input
                                            type="text"
                                            className="dash-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">อีเมล *</label>
                                        <input
                                            type="email"
                                            className="dash-input"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">
                                            รหัสผ่าน {editingUser ? '(เว้นว่างถ้าไม่ต้องการเปลี่ยน)' : '*'}
                                        </label>
                                        <input
                                            type="password"
                                            className="dash-input"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required={!editingUser}
                                            placeholder={editingUser ? 'ใส่รหัสผ่านใหม่หากต้องการเปลี่ยน' : ''}
                                        />
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-label">บทบาท *</label>
                                        <select
                                            className="dash-input"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })}
                                        >
                                            <option value="staff">👤 Staff</option>
                                            <option value="admin">👑 Admin</option>
                                        </select>
                                    </div>

                                    {formData.role === 'staff' && (
                                        <div className="dash-form-group">
                                            <label className="dash-label">
                                                ศูนย์พักพิงที่รับผิดชอบ
                                            </label>
                                            <select
                                                className="dash-input"
                                                value={formData.assignedShelterId}
                                                onChange={(e) => setFormData({ ...formData, assignedShelterId: e.target.value })}
                                            >
                                                <option value="">-- ไม่ระบุ --</option>
                                                {shelters.map(shelter => (
                                                    <option key={shelter._id} value={shelter._id}>
                                                        {shelter.name} ({shelter.code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
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
                                    {submitting ? 'กำลังบันทึก...' : (editingUser ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
