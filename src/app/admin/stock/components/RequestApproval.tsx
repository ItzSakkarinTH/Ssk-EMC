'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Package, Clock, User, MapPin, CheckCircle2, XCircle, AlertTriangle, FileText } from 'lucide-react';

interface RequestItem {
  stockId: string;
  itemName: string;
  requestedQuantity: number;
  unit: string;
  reason: string;
}

interface Request {
  id: string;
  requestNumber: string;
  shelter: { name: string; code: string };
  requestedBy: { name: string };
  requestedAt: string;
  status: string;
  itemCount: number;
  urgency: string;
}

interface RequestDetail {
  _id: string;
  requestNumber: string;
  shelterId: { name: string; code: string };
  requestedBy: { username: string };
  items: RequestItem[];
  createdAt: string;
  status: string;
}

export default function RequestApproval() {
  const { success, error: showError, info } = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/admin/requests?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch requests', err);
      showError('ไม่สามารถโหลดรายการคำขอได้');
    }
  }, [showError]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const viewRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/stock/admin/requests/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedRequest(data);
        setAdminNotes('');
        setShowModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch request details', err);
      showError('ไม่สามารถโหลดรายละเอียดคำขอได้');
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/stock/admin/requests/${selectedRequest._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'approved',
          adminNotes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'เกิดข้อผิดพลาด');
      }

      success('อนุมัติคำขอสำเร็จ! สต็อกได้ถูกโอนแล้ว');
      setShowModal(false);
      setSelectedRequest(null);
      void fetchRequests();

    } catch (err: unknown) {
      const error = err as Error;
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!adminNotes.trim()) {
      showError('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/stock/admin/requests/${selectedRequest._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'rejected',
          adminNotes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'เกิดข้อผิดพลาด');
      }

      info('ปฏิเสธคำขอแล้ว');
      setShowModal(false);
      setSelectedRequest(null);
      void fetchRequests();

    } catch (err: unknown) {
      const error = err as Error;
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return { label: 'ด่วนมาก', color: '#ef4444', icon: AlertTriangle };
      case 'medium':
        return { label: 'ปานกลาง', color: '#f59e0b', icon: Clock };
      default:
        return { label: 'ปกติ', color: '#3b82f6', icon: FileText };
    }
  };

  if (requests.length === 0) {
    return (
      <div className="dash-card" style={{ padding: '4rem', textAlign: 'center' }}>
        <Package size={80} style={{ opacity: 0.3, marginBottom: '1.5rem' }} />
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--dash-text-primary)', marginBottom: '0.5rem' }}>
          ไม่มีคำขอรอพิจารณา
        </h3>
        <p style={{ color: 'var(--dash-text-muted)' }}>
          คำขอทั้งหมดได้รับการพิจารณาแล้ว
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Request Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1.5rem'
      }}>
        {requests.map(req => {
          const urgencyConfig = getUrgencyConfig(req.urgency);
          const UrgencyIcon = urgencyConfig.icon;

          return (
            <div
              key={req.id}
              className="dash-card"
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(148, 163, 184, 0.15)'
              }}
              onClick={() => void viewRequest(req.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: 'var(--dash-text-primary)',
                    marginBottom: '0.25rem'
                  }}>
                    {req.requestNumber}
                  </h3>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--dash-text-muted)' }}>
                    {new Date(req.requestedAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <span className="dash-badge" style={{
                  background: `${urgencyConfig.color}20`,
                  color: urgencyConfig.color,
                  border: `1px solid ${urgencyConfig.color}40`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}>
                  <UrgencyIcon size={14} />
                  {urgencyConfig.label}
                </span>
              </div>

              {/* Info */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <MapPin size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
                  <span style={{ color: 'var(--dash-text-secondary)', fontSize: '0.9375rem' }}>
                    {req.shelter.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <User size={16} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                  <span style={{ color: 'var(--dash-text-secondary)', fontSize: '0.9375rem' }}>
                    {req.requestedBy.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Package size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                  <span style={{ color: 'var(--dash-text-secondary)', fontSize: '0.9375rem' }}>
                    {req.itemCount} รายการ
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div style={{
                marginTop: '1.25rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid rgba(148, 163, 184, 0.1)'
              }}>
                <div style={{
                  color: '#3b82f6',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  คลิกเพื่อดูรายละเอียด →
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && selectedRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem'
        }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="dash-card"
            style={{
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '2rem'
            }}>
              <div>
                <h2 className="dash-card-title" style={{ marginBottom: '0.5rem' }}>
                  {selectedRequest.requestNumber}
                </h2>
                <p style={{ color: 'var(--dash-text-muted)', margin: 0 }}>
                  รายละเอียดคำขอสินค้า
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="dash-btn-icon"
                style={{ fontSize: '1.5rem' }}
              >
                ×
              </button>
            </div>

            {/* Info Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div className="dash-stat-card">
                <div className="dash-stat-icon dash-stat-icon-primary">
                  <MapPin size={24} />
                </div>
                <div className="dash-stat-content">
                  <div className="dash-stat-value" style={{ fontSize: '1rem' }}>
                    {selectedRequest.shelterId.name}
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
                    {selectedRequest.requestedBy.username}
                  </div>
                  <div className="dash-stat-label">ผู้ยื่นคำขอ</div>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 className="dash-card-title" style={{ marginBottom: '1rem' }}>
                รายการสินค้า ({selectedRequest.items.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedRequest.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1.25rem',
                      background: 'var(--dash-surface)',
                      border: '1px solid var(--dash-border)',
                      borderRadius: 'var(--dash-radius-md)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.75rem'
                    }}>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--dash-text-primary)',
                        margin: 0
                      }}>
                        {item.itemName}
                      </h4>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#3b82f6'
                      }}>
                        {item.requestedQuantity} {item.unit}
                      </div>
                    </div>
                    <div style={{
                      padding: '0.75rem',
                      background: 'var(--dash-surface-active)',
                      borderRadius: '8px',
                      borderLeft: '3px solid var(--dash-primary)'
                    }}>
                      <div style={{
                        fontSize: '0.8125rem',
                        color: 'var(--dash-text-muted)',
                        marginBottom: '0.25rem'
                      }}>
                        เหตุผล:
                      </div>
                      <div style={{ color: 'var(--dash-text-secondary)', fontSize: '0.9375rem' }}>
                        {item.reason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="dash-form-group" style={{ marginBottom: '2rem' }}>
              <label className="dash-label">
                หมายเหตุจาก Admin
              </label>
              <textarea
                className="dash-input"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="ระบุหมายเหตุหรือเหตุผล (จำเป็นสำหรับการปฏิเสธ)"
                rows={4}
                disabled={loading}
              />
            </div>

            {/* Actions */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              <button
                onClick={() => void handleReject()}
                className="dash-btn dash-btn-danger dash-btn-lg"
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <XCircle size={20} />
                {loading ? 'กำลังดำเนินการ...' : 'ปฏิเสธคำขอ'}
              </button>
              <button
                onClick={() => void handleApprove()}
                className="dash-btn dash-btn-success dash-btn-lg"
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <CheckCircle2 size={20} />
                {loading ? 'กำลังดำเนินการ...' : 'อนุมัติและโอนสต็อก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}