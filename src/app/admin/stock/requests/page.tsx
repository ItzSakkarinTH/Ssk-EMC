'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  Zap
} from 'lucide-react';
import styles from '../history/history.module.css';

interface Request {
  id: string;
  requestNumber: string;
  shelter: { name: string; code: string };
  requestedBy: { name: string };
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  itemCount: number;
  urgency: string;
}

export default function RequestsPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick action modal
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [quickAction, setQuickAction] = useState<'approve' | 'reject' | null>(null);
  const [quickNotes, setQuickNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'high' | 'medium' | 'normal'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    void fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/admin/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      } else {
        showError('ไม่สามารถโหลดรายการคำขอได้');
      }
    } catch (error) {
      console.error(error);
      showError('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const openQuickAction = (requestId: string, action: 'approve' | 'reject') => {
    setSelectedRequestId(requestId);
    setQuickAction(action);
    setQuickNotes('');
    setShowQuickActionModal(true);
  };

  const handleQuickAction = async () => {
    if (!selectedRequestId || !quickAction) return;

    if (quickAction === 'reject' && !quickNotes.trim()) {
      showError('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    setProcessing(true);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/stock/admin/requests/${selectedRequestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: quickAction === 'approve' ? 'approved' : 'rejected',
          adminNotes: quickNotes.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'เกิดข้อผิดพลาด');
      }

      success(quickAction === 'approve' ? 'อนุมัติคำขอสำเร็จ!' : 'ปฏิเสธคำขอแล้ว');
      setShowQuickActionModal(false);
      setSelectedRequestId(null);
      setQuickAction(null);
      setQuickNotes('');
      void fetchRequests();

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Filter logic
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch =
        req.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.shelter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requestedBy.name.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      if (urgencyFilter !== 'all' && req.urgency !== urgencyFilter) return false;

      return true;
    });
  }, [requests, searchTerm, statusFilter, urgencyFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, urgencyFilter, itemsPerPage]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'อนุมัติแล้ว', color: 'var(--dash-success)', icon: CheckCircle2 };
      case 'rejected':
        return { label: 'ปฏิเสธแล้ว', color: 'var(--dash-danger)', icon: XCircle };
      default:
        return { label: 'รอพิจารณา', color: 'var(--dash-warning)', icon: Clock };
    }
  };

  const getUrgencyConfig = (urgency: string) => {
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
      <DashboardLayout title="คำขอสินค้า" subtitle="จัดการคำขอสินค้าจากศูนย์พักพิง">
        <div className="dash-loading">
          <div className="dash-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="คำขอสินค้า" subtitle="จัดการคำขอสินค้าจากศูนย์พักพิง">
      {/* Summary Stats */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <FileText size={32} />
          <div>
            <div className={styles.summaryLabel}>ทั้งหมด</div>
            <div className={styles.summaryValue}>{filteredRequests.length}</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <Clock size={32} />
          <div>
            <div className={styles.summaryLabel}>รอพิจารณา</div>
            <div className={styles.summaryValue}>
              {filteredRequests.filter(r => r.status === 'pending').length}
            </div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <CheckCircle2 size={32} />
          <div>
            <div className={styles.summaryLabel}>อนุมัติแล้ว</div>
            <div className={styles.summaryValue}>
              {filteredRequests.filter(r => r.status === 'approved').length}
            </div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <XCircle size={32} />
          <div>
            <div className={styles.summaryLabel}>ปฏิเสธแล้ว</div>
            <div className={styles.summaryValue}>
              {filteredRequests.filter(r => r.status === 'rejected').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterSection}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={20} style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8'
          }} />
          <input
            type="text"
            className="dash-input"
            placeholder="ค้นหาเลขที่, ศูนย์, ผู้ยื่น..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '3rem' }}
          />
        </div>

        <div className={styles.filterGroup}>
          <Filter size={18} />
          <span>สถานะ:</span>
          <div className={styles.buttonGroup}>
            {[
              { value: 'all', label: 'ทั้งหมด' },
              { value: 'pending', label: 'รอพิจารณา' },
              { value: 'approved', label: 'อนุมัติแล้ว' },
              { value: 'rejected', label: 'ปฏิเสธแล้ว' }
            ].map(option => (
              <button
                key={option.value}
                className={`${styles.filterBtn} ${statusFilter === option.value ? styles.active : ''}`}
                onClick={() => setStatusFilter(option.value as typeof statusFilter)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <Filter size={18} />
          <span>ความเร่งด่วน:</span>
          <div className={styles.buttonGroup}>
            {[
              { value: 'all', label: 'ทั้งหมด' },
              { value: 'high', label: 'ด่วนมาก' },
              { value: 'medium', label: 'ปานกลาง' },
              { value: 'normal', label: 'ปกติ' }
            ].map(option => (
              <button
                key={option.value}
                className={`${styles.filterBtn} ${urgencyFilter === option.value ? styles.active : ''}`}
                onClick={() => setUrgencyFilter(option.value as typeof urgencyFilter)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.tableHeader}>
        <div className={styles.resultsInfo}>
          แสดง {startIndex + 1}-{Math.min(endIndex, filteredRequests.length)} จาก {filteredRequests.length} รายการ
        </div>
        <div className={styles.perPageSelector}>
          <span>แสดง:</span>
          {[5, 10, 20, 50].map(num => (
            <button
              key={num}
              className={`${styles.perPageBtn} ${itemsPerPage === num ? styles.active : ''}`}
              onClick={() => setItemsPerPage(num)}
            >
              {num}
            </button>
          ))}
          <span>รายการ</span>
        </div>
      </div>

      {paginatedRequests.length > 0 ? (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>เลขที่คำขอ</th>
                  <th>ศูนย์พักพิง</th>
                  <th>ผู้ยื่นคำขอ</th>
                  <th>จำนวนรายการ</th>
                  <th>ความเร่งด่วน</th>
                  <th>วันที่ยื่น</th>
                  <th>สถานะ</th>
                  <th style={{ width: '120px' }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map((req) => {
                  const statusConfig = getStatusConfig(req.status);
                  const StatusIcon = statusConfig.icon;
                  const urgencyConfig = getUrgencyConfig(req.urgency);

                  return (
                    <tr key={req.id}>
                      <td>
                        <code className={styles.refCode}>{req.requestNumber}</code>
                      </td>
                      <td>
                        <strong>{req.shelter.name}</strong>
                        <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                          {req.shelter.code}
                        </div>
                      </td>
                      <td>{req.requestedBy.name}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#3b82f6' }}>
                          {req.itemCount} รายการ
                        </span>
                      </td>
                      <td>
                        <span
                          className={styles.typeBadge}
                          style={{
                            background: `${urgencyConfig.color}20`,
                            color: urgencyConfig.color
                          }}
                        >
                          {urgencyConfig.label}
                        </span>
                      </td>
                      <td>{formatDate(req.requestedAt)}</td>
                      <td>
                        <span
                          className={styles.typeBadge}
                          style={{
                            background: `${statusConfig.color}20`,
                            color: statusConfig.color
                          }}
                        >
                          <StatusIcon size={16} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-start' }}>
                          {req.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => openQuickAction(req.id, 'approve')}
                                className="dash-btn-icon"
                                title="อนุมัติคำขอ"
                                style={{
                                  color: '#22c55e',
                                  background: 'rgba(34, 197, 94, 0.1)',
                                  border: '1px solid rgba(34, 197, 94, 0.2)',
                                  padding: '0.5rem',
                                  borderRadius: '8px'
                                }}
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                onClick={() => openQuickAction(req.id, 'reject')}
                                className="dash-btn-icon"
                                title="ปฏิเสธคำขอ"
                                style={{
                                  color: '#ef4444',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  padding: '0.5rem',
                                  borderRadius: '8px'
                                }}
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          ) : null}
                          <button
                            onClick={() => router.push(`/admin/stock/requests/${req.id}`)}
                            className="dash-btn-icon"
                            title="ดูรายละเอียด"
                            style={{
                              color: '#3b82f6',
                              background: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              padding: '0.5rem',
                              borderRadius: '8px'
                            }}
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={18} />
                ก่อนหน้า
              </button>

              <div className={styles.pageNumbers}>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <div key={page} style={{ display: 'flex', gap: '0.5rem' }}>
                        {showEllipsis && <span className={styles.ellipsis}>...</span>}
                        <button
                          className={`${styles.pageNumBtn} ${currentPage === page ? styles.active : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}
              </div>

              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                ถัดไป
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.emptyState}>
          <Package size={64} style={{ opacity: 0.3 }} />
          <h3>ไม่พบข้อมูล</h3>
          <p>ลองปรับเปลี่ยนตัวกรองหรือคำค้นหา</p>
        </div>
      )}

      {/* Quick Action Modal */}
      {showQuickActionModal && (
        <div
          style={{
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
          onClick={() => setShowQuickActionModal(false)}
        >
          <div
            className="dash-card"
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Zap size={24} style={{ color: quickAction === 'approve' ? '#22c55e' : '#ef4444' }} />
              <h3 className="dash-card-title" style={{ margin: 0 }}>
                {quickAction === 'approve' ? 'อนุมัติคำขอ' : 'ปฏิเสธคำขอ'}
              </h3>
            </div>

            <div className="dash-form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="dash-label">
                หมายเหตุ
                {quickAction === 'reject' && <span className="dash-required">*</span>}
              </label>
              <textarea
                className="dash-input"
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
                placeholder={quickAction === 'reject' ? 'ระบุเหตุผล (จำเป็น)' : 'ระบุหมายเหตุ (ถ้ามี)'}
                rows={4}
                disabled={processing}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button
                onClick={() => setShowQuickActionModal(false)}
                className="dash-btn dash-btn-secondary"
                disabled={processing}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => void handleQuickAction()}
                className={`dash-btn ${quickAction === 'approve' ? 'dash-btn-success' : 'dash-btn-danger'}`}
                disabled={processing}
              >
                {processing ? 'กำลังดำเนินการ...' : (quickAction === 'approve' ? 'ยืนยันอนุมัติ' : 'ยืนยันปฏิเสธ')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}