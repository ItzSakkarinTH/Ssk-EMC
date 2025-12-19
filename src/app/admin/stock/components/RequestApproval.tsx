
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
  const [approvalMode, setApprovalMode] = useState<'full' | 'partial'>('full');

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

  return (
    <div className={styles.container}>
      <h2>อนุมัติคำร้องขอสินค้า</h2>

      <div className={styles.layout}>
        {/* รายการคำร้อง */}
        <div className={styles.requestList}>
          <h3>คำร้องรอพิจารณา ({requests.length})</h3>
          {requests.length === 0 ? (
            <div className={styles.empty}>ไม่มีคำร้องรอพิจารณา</div>
          ) : (
            requests.map(req => (
              <div
                key={req.id}
                className={`${styles.requestCard} ${req.urgency === 'high' ? styles.urgent : ''}`}
                onClick={() => viewRequest(req.id)}
              >
                <div className={styles.requestHeader}>
                  <span className={styles.requestNumber}>{req.requestNumber}</span>
                  {req.urgency === 'high' && <span className={styles.urgentBadge}>ด่วน</span>}
                </div>
                <div className={styles.requestInfo}>
                  <div>ศูนย์: {req.shelter.name}</div>
                  <div>จำนวนรายการ: {req.itemCount}</div>
                  <div>โดย: {req.requestedBy.name}</div>
                </div>
                <div className={styles.requestDate}>
                  {new Date(req.requestedAt).toLocaleString('th-TH')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* รายละเอียดคำร้อง */}
        <div className={styles.requestDetail}>
          {!selectedRequest ? (
            <div className={styles.placeholder}>เลือกคำร้องเพื่อดูรายละเอียด</div>
          ) : (
            <>
              <h3>รายละเอียดคำร้อง</h3>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.detailSection}>
                <div className={styles.detailRow}>
                  <span>เลขที่:</span>
                  <strong>{selectedRequest.requestNumber}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>ศูนย์:</span>
                  <strong>{selectedRequest.shelterId.name}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>ผู้ยื่น:</span>
                  <strong>{selectedRequest.requestedBy.name}</strong>
                </div>
              </div>

              <h4>รายการสินค้า</h4>
              <div className={styles.itemsList}>
                {selectedRequest.items.map((item: RequestItem, idx: number) => (
                  <div key={idx} className={styles.itemCard}>
                    <div className={styles.itemName}>{item.itemName}</div>
                    <div className={styles.itemQty}>
                      {item.requestedQuantity} {item.unit}
                    </div>
                    <div className={styles.itemReason}>
                      เหตุผล: {item.reason}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.notesSection}>
                <label>หมายเหตุจาก Admin</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="ระบุหมายเหตุหรือเหตุผล"
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className={styles.actions}>
                <button
                  onClick={handleReject}
                  className={styles.rejectBtn}
                  disabled={loading}
                >
                  ปฏิเสธ
                </button>
                <button
                  onClick={handleApprove}
                  className={styles.approveBtn}
                  disabled={loading}
                >
                  {loading ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}