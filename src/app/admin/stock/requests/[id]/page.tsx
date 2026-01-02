'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Package,
  MapPin,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface RequestItem {
  stockId: string;
  itemName: string;
  requestedQuantity: number;
  unit: string;
  reason: string;
}

interface RequestDetail {
  _id: string;
  requestNumber: string;
  shelterId: {
    _id: string;
    name: string;
    code: string;
  };
  requestedBy: {
    _id: string;
    username: string;
  };
  items: RequestItem[];
  status: 'pending' | 'approved' | 'rejected';
  urgency?: string;
  createdAt: string;
  reviewedBy?: {
    username: string;
  };
  reviewedAt?: string;
  adminNotes?: string;
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error: showError, warning, confirm } = useToast();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    void fetchRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchRequest = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/stock/admin/requests/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setRequest(data);
        setAdminNotes(data.adminNotes || '');
      } else {
        showError('ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (error) {
      console.error(error);
      showError('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!request) return;

    const confirmed = await confirm({
      title: 'อนุมัติคำขอ',
      message: 'ต้องการอนุมัติคำขอนี้และโอนสต็อกใช่หรือไม่?',
      confirmText: 'อนุมัติ',
      cancelText: 'ยกเลิก',
      type: 'info'
    });

    if (!confirmed) return;

    setProcessing(true);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/stock/admin/requests/${request._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'approved',
          adminNotes: adminNotes.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'เกิดข้อผิดพลาด');
      }

      success('อนุมัติคำขอสำเร็จ! สต็อกได้ถูกโอนแล้ว');
      router.push('/admin/stock/requests');

    } catch (err: unknown) {
      const error = err as Error;
      showError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;

    if (!adminNotes.trim()) {
      warning('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    const confirmed = await confirm({
      title: 'ปฏิเสธคำขอ',
      message: 'ต้องการปฏิเสธคำขอนี้ใช่หรือไม่?',
      confirmText: 'ปฏิเสธ',
      cancelText: 'ยกเลิก',
      type: 'danger'
    });

    if (!confirmed) return;

    setProcessing(true);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/stock/admin/requests/${request._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'rejected',
          adminNotes: adminNotes.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'เกิดข้อผิดพลาด');
      }

      success('ปฏิเสธคำขอแล้ว');
      router.push('/admin/stock/requests');

    } catch (err: unknown) {
      const error = err as Error;
      showError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'อนุมัติแล้ว', color: '#22c55e', icon: CheckCircle2 };
      case 'rejected':
        return { label: 'ปฏิเสธแล้ว', color: '#ef4444', icon: XCircle };
      default:
        return { label: 'รอพิจารณา', color: '#f59e0b', icon: AlertCircle };
    }
  };

  const getUrgencyConfig = (urgency: string = 'normal') => {
    switch (urgency) {
      case 'high':
        return { label: 'ด่วนมาก', color: '#ef4444' };
      case 'medium':
        return { label: 'ปานกลาง', color: '#f59e0b' };
      default:
        return { label: 'ปกติ', color: '#64748b' };
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="รายละเอียดคำขอ" subtitle="กำลังโหลด...">
        <div className="dash-loading">
          <div className="dash-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout title="ไม่พบข้อมูล" subtitle="">
        <div className="dash-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertCircle size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--dash-text-primary)', marginBottom: '0.5rem' }}>ไม่พบคำขอนี้</h3>
          <button
            onClick={() => router.push('/admin/stock/requests')}
            className="dash-btn dash-btn-primary"
            style={{ marginTop: '1rem' }}
          >
            <ArrowLeft size={18} />
            กลับไปหน้ารายการ
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const statusConfig = getStatusConfig(request.status);
  const StatusIcon = statusConfig.icon;
  const urgencyConfig = getUrgencyConfig(request.urgency);

  return (
    <DashboardLayout
      title={`คำขอ ${request.requestNumber}`}
      subtitle="รายละเอียดคำขอสต็อก"
    >
      {/* Back Button */}
      <button
        onClick={() => router.push('/admin/stock/requests')}
        className="dash-btn dash-btn-secondary"
        style={{
          marginBottom: '1.5rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <ArrowLeft size={18} />
        กลับไปหน้ารายการ
      </button>

      {/* Header Card */}
      <div className="dash-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem'
        }}>
          <div>
            <h2 className="dash-card-title" style={{ marginBottom: '0.5rem' }}>
              {request.requestNumber}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="dash-badge" style={{
                background: `${statusConfig.color}20`,
                color: statusConfig.color,
                border: `1px solid ${statusConfig.color}40`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}>
                <StatusIcon size={14} />
                {statusConfig.label}
              </span>
              <span className="dash-badge" style={{
                background: `${urgencyConfig.color}20`,
                color: urgencyConfig.color,
                border: `1px solid ${urgencyConfig.color}40`
              }}>
                {urgencyConfig.label}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right', color: 'var(--dash-text-muted)', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} />
              {formatDate(request.createdAt)}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          <div className="dash-stat-card">
            <div className="dash-stat-icon dash-stat-icon-primary">
              <MapPin size={24} />
            </div>
            <div className="dash-stat-content">
              <div className="dash-stat-value" style={{ fontSize: '1rem' }}>
                {request.shelterId.name}
              </div>
              <div className="dash-stat-label">ศูนย์พักพิง</div>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon dash-stat-icon-success">
              <User size={24} />
            </div>
            <div className="dash-stat-content">
              <div className="dash-stat-value" style={{ fontSize: '1rem' }}>
                {request.requestedBy.username}
              </div>
              <div className="dash-stat-label">ผู้ยื่นคำขอ</div>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon dash-stat-icon-warning">
              <Package size={24} />
            </div>
            <div className="dash-stat-content">
              <div className="dash-stat-value">{request.items.length}</div>
              <div className="dash-stat-label">รายการสินค้า</div>
            </div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-card-header">
          <h3 className="dash-card-title">
            <FileText size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            รายการสินค้า
          </h3>
          <span className="dash-badge dash-badge-primary">{request.items.length} รายการ</span>
        </div>
        <div className="dash-card-body">
          <div className="dash-table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>สินค้า</th>
                  <th style={{ textAlign: 'right', width: '150px' }}>จำนวน</th>
                  <th>เหตุผล</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td>
                      <strong style={{ color: 'var(--dash-text-primary)' }}>{item.itemName}</strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: 'var(--dash-primary)'
                      }}>
                        {item.requestedQuantity.toLocaleString()}
                      </span>
                      <span style={{ marginLeft: '0.5rem', color: 'var(--dash-text-muted)' }}>
                        {item.unit}
                      </span>
                    </td>
                    <td>
                      <div style={{
                        padding: '0.5rem 0.75rem',
                        background: 'var(--dash-surface-active)',
                        borderRadius: '6px',
                        borderLeft: '3px solid var(--dash-primary)',
                        fontSize: '0.875rem',
                        color: 'var(--dash-text-secondary)'
                      }}>
                        {item.reason}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review Section */}
      {request.status === 'pending' ? (
        <div className="dash-card" style={{ padding: '2rem' }}>
          <h3 className="dash-card-title" style={{ marginBottom: '1.5rem' }}>
            พิจารณาคำขอ
          </h3>

          <div className="dash-form-group" style={{ marginBottom: '2rem' }}>
            <label className="dash-label">
              หมายเหตุจาก Admin
              {request.status === 'pending' && <span style={{ color: 'var(--dash-text-muted)' }}> (จำเป็นสำหรับการปฏิเสธ)</span>}
            </label>
            <textarea
              className="dash-input"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="ระบุหมายเหตุหรือเหตุผล..."
              rows={4}
              disabled={processing}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}>
            <button
              onClick={() => void handleReject()}
              className="dash-btn dash-btn-danger dash-btn-lg"
              disabled={processing}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <XCircle size={20} />
              {processing ? 'กำลังดำเนินการ...' : 'ปฏิเสธคำขอ'}
            </button>
            <button
              onClick={() => void handleApprove()}
              className="dash-btn dash-btn-success dash-btn-lg"
              disabled={processing}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <CheckCircle2 size={20} />
              {processing ? 'กำลังดำเนินการ...' : 'อนุมัติและโอนสต็อก'}
            </button>
          </div>
        </div>
      ) : (
        <div className="dash-card" style={{ padding: '2rem' }}>
          <h3 className="dash-card-title" style={{ marginBottom: '1.5rem' }}>
            ผลการพิจารณา
          </h3>
          {request.reviewedBy && (
            <div style={{ marginBottom: '1rem', color: 'var(--dash-text-secondary)' }}>
              <strong>พิจารณาโดย:</strong> {request.reviewedBy.username}
              {request.reviewedAt && (
                <> | {formatDate(request.reviewedAt)}</>
              )}
            </div>
          )}
          {request.adminNotes && (
            <div style={{
              padding: '1rem',
              background: 'var(--dash-surface-active)',
              borderRadius: '8px',
              borderLeft: '3px solid var(--dash-primary)'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--dash-text-muted)', marginBottom: '0.5rem' }}>
                หมายเหตุ:
              </div>
              <div style={{ color: 'var(--dash-text-secondary)' }}>
                {request.adminNotes}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
