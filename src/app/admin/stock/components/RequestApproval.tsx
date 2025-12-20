
'use client';

import { useState, useEffect } from 'react';
import styles from './RequestApproval.module.css';

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
  shelterId: { name: string };
  requestedBy: { name: string };
  items: RequestItem[];
}

export default function RequestApproval() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/admin/requests?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Failed to fetch requests');
    }
  };

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
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch request details');
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setError(null);
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

      alert('อนุมัติคำร้องสำเร็จ');
      setSelectedRequest(null);
      fetchRequests();

    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!adminNotes.trim()) {
      setError('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    setError(null);
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

      alert('ปฏิเสธคำร้องสำเร็จ');
      setSelectedRequest(null);
      fetchRequests();

    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (requests.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>ไม่มีคำร้องรอพิจารณา</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.requestList}>
        {requests.map(req => (
          <div
            key={req.id}
            className={styles.requestCard}
            onClick={() => viewRequest(req.id)}
          >
            <div className={styles.requestHeader}>
              <div className={styles.requestInfo}>
                <div className={styles.requestTitle}>
                  {req.requestNumber}
                </div>
                <div className={styles.requestMeta}>
                  <span>📍 {req.shelter.name}</span>
                  <span>📦 {req.itemCount} รายการ</span>
                  <span>👤 {req.requestedBy.name}</span>
                </div>
              </div>
              <div className={`${styles.statusBadge} ${styles.statusPending}`}>
                รอพิจารณา
              </div>
            </div>

            {selectedRequest && selectedRequest._id === req.id && (
              <div className={styles.requestBody}>
                {error && <div className={styles.errorMessage}>{error}</div>}

                <div className={styles.requestDetails}>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>เลขที่คำร้อง</div>
                    <div className={styles.detailValue}>{selectedRequest.requestNumber}</div>
                  </div>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>ศูนย์พักพิง</div>
                    <div className={styles.detailValue}>{selectedRequest.shelterId.name}</div>
                  </div>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>ผู้ยื่นคำร้อง</div>
                    <div className={styles.detailValue}>{selectedRequest.requestedBy.name}</div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 700 }}>
                    รายการสินค้า
                  </h4>
                  {selectedRequest.items.map((item: RequestItem, idx: number) => (
                    <div key={idx} style={{
                      padding: '1rem',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '8px',
                      marginBottom: '0.75rem',
                      border: '1px solid rgba(148, 163, 184, 0.1)'
                    }}>
                      <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: '0.5rem' }}>
                        {item.itemName}
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                        จำนวน: {item.requestedQuantity} {item.unit}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        เหตุผล: {item.reason}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#cbd5e1',
                    marginBottom: '0.5rem'
                  }}>
                    หมายเหตุจาก Admin
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="ระบุหมายเหตุหรือเหตุผล"
                    rows={3}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.15)',
                      borderRadius: '12px',
                      color: '#f1f5f9',
                      fontSize: '0.9375rem',
                      resize: 'vertical',
                      minHeight: '100px'
                    }}
                  />
                </div>

                <div className={styles.requestActions}>
                  <button
                    onClick={handleReject}
                    className={styles.rejectButton}
                    disabled={loading}
                  >
                    ปฏิเสธ
                  </button>
                  <button
                    onClick={handleApprove}
                    className={styles.approveButton}
                    disabled={loading}
                  >
                    {loading ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}