'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { ArrowLeft, Clock, Building2, User, CheckCircle2, XCircle, AlertCircle, ShoppingBag } from 'lucide-react';

interface RequestItem {
  stockId: string;
  itemName: string;
  requestedQuantity: number;
  unit: string;
  reason: string;
}

interface StockRequest {
  _id: string;
  requestNumber: string;
  shelterId?: {
    _id: string;
    name: string;
  };
  requestedBy: {
    _id: string;
    name: string;
  };
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'partial';
  items: RequestItem[];
  reviewedBy?: {
    _id: string;
    name: string;
  };
  reviewedAt?: string;
  adminNotes?: string;
  deliveryStatus?: string;
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<StockRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`/api/stock/admin/requests/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setRequest(data);
        }
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [params.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="dash-badge dash-badge-success"><CheckCircle2 size={14} /> อนุมัติแล้ว</span>;
      case 'rejected':
        return <span className="dash-badge dash-badge-danger"><XCircle size={14} /> ปฏิเสธ</span>;
      case 'pending':
        return <span className="dash-badge dash-badge-warning"><Clock size={14} /> รอพิจารณา</span>;
      case 'partial':
        return <span className="dash-badge dash-badge-info"><AlertCircle size={14} /> อนุมัติบางส่วน</span>;
      default:
        return <span className="dash-badge dash-badge-info">{status}</span>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="รายละเอียดคำร้อง">
        <div className="dash-loading">
          <div className="dash-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout title="รายละเอียดคำร้อง">
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={64} style={{ color: '#ef4444', marginBottom: '1rem', opacity: 0.5 }} />
          <h2>ไม่พบข้อมูลคำร้อง</h2>
          <p className="dash-text-muted">คำร้องที่คุณต้องการอาจถูกลบหรือไม่มีอยู่ในระบบ</p>
          <button onClick={() => router.back()} className="dash-btn dash-btn-secondary" style={{ marginTop: '1.5rem' }}>
            <ArrowLeft size={18} /> กลับไปหน้าที่แล้ว
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`คำร้อง: ${request.requestNumber}`}
      subtitle="รายละเอียดการขอสนับสนุนทรัพยากรจากศูนย์พักพิง"
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => router.back()} className="dash-btn dash-btn-secondary">
          <ArrowLeft size={18} /> กลับ
        </button>
      </div>

      <div className="dash-grid dash-grid-2" style={{ marginBottom: '2rem' }}>
        {/* Summary Card */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">ข้อมูลทั่วไป</h3>
            {getStatusBadge(request.status)}
          </div>
          <div className="dash-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Building2 size={20} style={{ color: '#3b82f6' }} />
                <div>
                  <div className="dash-text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>ศูนย์พักพิง</div>
                  <div style={{ fontWeight: 600 }}>{request.shelterId?.name || 'ไม่ระบุ'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={20} style={{ color: '#3b82f6' }} />
                <div>
                  <div className="dash-text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>ผู้ยื่นคำร้อง</div>
                  <div style={{ fontWeight: 600 }}>{request.requestedBy.name}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock size={20} style={{ color: '#3b82f6' }} />
                <div>
                  <div className="dash-text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>วันที่ยื่นคำร้อง</div>
                  <div style={{ fontWeight: 600 }}>{new Date(request.requestedAt).toLocaleString('th-TH')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Review Card or Notes */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">สถานะการพิจารณา</h3>
          </div>
          <div className="dash-card-body">
            {request.reviewedBy ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                  <div>
                    <div className="dash-text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>ผู้พิจารณา</div>
                    <div style={{ fontWeight: 600 }}>{request.reviewedBy.name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Clock size={20} style={{ color: '#10b981' }} />
                  <div>
                    <div className="dash-text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>วันที่พิจารณา</div>
                    <div style={{ fontWeight: 600 }}>{request.reviewedAt ? new Date(request.reviewedAt).toLocaleString('th-TH') : '-'}</div>
                  </div>
                </div>
                {request.adminNotes && (
                  <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div className="dash-text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>หมายเหตุจาก Admin</div>
                    <div style={{ color: '#f1f5f9' }}>{request.adminNotes}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <Clock size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p className="dash-text-muted">กำลังรอเจ้าหน้าที่จังหวัดพิจารณาคำร้อง</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h3 className="dash-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={20} /> รายการสินค้าที่ขอ
          </h3>
        </div>
        <div className="dash-table-container">
          <table className="dash-table">
            <thead>
              <tr>
                <th>ชื่อสินค้า</th>
                <th style={{ textAlign: 'center' }}>จำนวน</th>
                <th>หน่วย</th>
                <th>เหตุผลการขอ</th>
              </tr>
            </thead>
            <tbody>
              {request.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.itemName}</td>
                  <td style={{ textAlign: 'center', color: '#60a5fa', fontWeight: 700, fontSize: '1.1rem' }}>
                    {item.requestedQuantity.toLocaleString()}
                  </td>
                  <td>{item.unit}</td>
                  <td style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {request.status === 'pending' && (
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button className="dash-btn dash-btn-danger" style={{ padding: '0.75rem 2rem' }}>
            <XCircle size={18} /> ปฏิเสธ
          </button>
          <button className="dash-btn dash-btn-primary" style={{ padding: '0.75rem 2rem' }}>
            <CheckCircle2 size={18} /> อนุมัติคำร้อง
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
