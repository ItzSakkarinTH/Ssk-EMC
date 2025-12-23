'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Package,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  User,
  FileText,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Movement {
  _id: string;
  itemName?: string;
  stockId?: {
    itemName: string;
  };
  movementType: 'receive' | 'transfer' | 'dispense';
  quantity: number;
  unit: string;
  from: {
    type: string;
    name: string;
  };
  to?: {
    type: string;
    name: string;
  };
  performedBy: {
    username: string;
    name?: string;
  };
  createdAt: string;
  referenceId?: string;
  notes?: string;
}

export default function StaffHistoryPage() {
  const toast = useToast();
  const router = useRouter();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'receive' | 'transfer' | 'dispense'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    void fetchMovements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, dateFilter, itemsPerPage]);

  const fetchMovements = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/staff/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements || []);
      } else {
        toast.error('ไม่สามารถโหลดประวัติได้');
      }
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
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

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    return formatDate(dateString);
  };

  // Filter logic
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const itemName = m.itemName || m.stockId?.itemName || '';

      // Search filter
      const matchesSearch =
        itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.from?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.to?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.referenceId?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Type filter
      if (typeFilter !== 'all' && m.movementType !== typeFilter) return false;

      // Date filter
      if (dateFilter !== 'all') {
        const date = new Date(m.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        switch (dateFilter) {
          case 'today':
            if (diffDays >= 1) return false;
            break;
          case 'week':
            if (diffDays >= 7) return false;
            break;
          case 'month':
            if (diffDays >= 30) return false;
            break;
        }
      }

      return true;
    });
  }, [movements, searchTerm, typeFilter, dateFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMovements = filteredMovements.slice(startIndex, endIndex);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'receive':
        return <TrendingUp size={16} />;
      case 'dispense':
        return <TrendingDown size={16} />;
      case 'transfer':
        return <ArrowLeftRight size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const getMovementBadgeClass = (type: string) => {
    switch (type) {
      case 'receive':
        return 'dash-badge-success';
      case 'dispense':
        return 'dash-badge-danger';
      case 'transfer':
        return 'dash-badge-info';
      default:
        return '';
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'receive':
        return 'รับเข้า';
      case 'dispense':
        return 'จ่ายออก';
      case 'transfer':
        return 'โอน';
      default:
        return 'อื่นๆ';
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="ประวัติการเคลื่อนไหว" subtitle="กำลังโหลด...">
        <div className="dash-loading">
          <div className="dash-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="📜 ประวัติการเคลื่อนไหวสินค้า"
      subtitle="ตรวจสอบรายการรับเข้า จ่ายออก และโอนสินค้าของศูนย์"
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => router.back()}
          className="dash-btn dash-btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={18} />
          ย้อนกลับ
        </button>
      </div>

      {/* Summary Stats */}
      <div className="dash-grid dash-grid-4" style={{ marginBottom: '2rem' }}>
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-primary">
            <Package size={24} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">{filteredMovements.length}</div>
            <div className="dash-stat-label">รายการทั้งหมด</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-success">
            <TrendingUp size={24} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">
              {filteredMovements.filter(m => m.movementType === 'receive').length}
            </div>
            <div className="dash-stat-label">รับเข้า</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-danger">
            <TrendingDown size={24} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">
              {filteredMovements.filter(m => m.movementType === 'dispense').length}
            </div>
            <div className="dash-stat-label">จ่ายออก</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-info">
            <ArrowLeftRight size={24} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">
              {filteredMovements.filter(m => m.movementType === 'transfer').length}
            </div>
            <div className="dash-stat-label">รายการโอน</div>
          </div>
        </div>
      </div>

      <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--dash-text-muted)',
              zIndex: 1
            }} />
            <input
              type="text"
              className="dash-input"
              placeholder="ค้นหาสินค้า, ผู้ส่ง/รับ, เลขที่เอกสาร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '3rem' }}
            />
          </div>

          <div className="dash-grid dash-grid-2">
            {/* Type Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="dash-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} /> ประเภทรายการ
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { value: 'all', label: 'ทั้งหมด' },
                  { value: 'receive', label: '📥 รับเข้า' },
                  { value: 'dispense', label: '📤 จ่ายออก' },
                  { value: 'transfer', label: '🔄 โอน' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTypeFilter(opt.value as 'all' | 'receive' | 'transfer' | 'dispense')}
                    className={`dash-btn ${typeFilter === opt.value ? 'dash-btn-primary' : 'dash-btn-secondary'}`}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8125rem' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="dash-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} /> ช่วงเวลา
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { value: 'all', label: 'ทั้งหมด' },
                  { value: 'today', label: 'วันนี้' },
                  { value: 'week', label: '7 วัน' },
                  { value: 'month', label: '30 วัน' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDateFilter(opt.value as 'all' | 'today' | 'week' | 'month')}
                    className={`dash-btn ${dateFilter === opt.value ? 'dash-btn-primary' : 'dash-btn-secondary'}`}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8125rem' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="dash-card" style={{ marginTop: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--dash-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="dash-text-muted">
            แสดง {filteredMovements.length > 0 ? startIndex + 1 : 0} ถึง {Math.min(endIndex, filteredMovements.length)} จาก {filteredMovements.length} รายการ
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="dash-text-muted">แสดง:</span>
            <select
              className="dash-select"
              style={{ padding: '0.25rem 2rem 0.25rem 0.75rem', fontSize: '0.875rem' }}
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {paginatedMovements.map((movement) => {
            const itemName = movement.itemName || movement.stockId?.itemName || 'N/A';
            const badgeClass = getMovementBadgeClass(movement.movementType);
            const label = getMovementLabel(movement.movementType);

            return (
              <div key={movement._id} style={{
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid var(--dash-border)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className={`dash-badge ${badgeClass}`} style={{ padding: '0.4rem 0.8rem' }}>
                      {getMovementIcon(movement.movementType)}
                      {label}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--dash-text-primary)' }}>{itemName}</div>
                      <div className="dash-text-muted" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {getRelativeTime(movement.createdAt)} ({formatDate(movement.createdAt)})
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 900,
                      color: movement.movementType === 'receive' ? 'var(--dash-success)' : movement.movementType === 'dispense' ? 'var(--dash-danger)' : 'var(--dash-primary)'
                    }}>
                      {movement.movementType === 'receive' ? '+' : movement.movementType === 'dispense' ? '-' : ''}
                      {movement.quantity.toLocaleString()}
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--dash-text-muted)', marginLeft: '0.25rem' }}>{movement.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="dash-grid dash-grid-4" style={{ gap: '0.75rem' }}>
                  <div className="dash-text-secondary" style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="dash-text-muted">จาก:</span> <strong>{movement.from?.name || '-'}</strong>
                  </div>
                  <div className="dash-text-secondary" style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="dash-text-muted">ไปยัง:</span> <strong>{movement.to?.name || '-'}</strong>
                  </div>
                  <div className="dash-text-secondary" style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={14} className="dash-text-muted" /> <strong>{movement.performedBy?.name || movement.performedBy?.username || 'N/A'}</strong>
                  </div>
                  {movement.referenceId && (
                    <div className="dash-text-secondary" style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={14} className="dash-text-muted" /> <span>เอกสาร: {movement.referenceId}</span>
                    </div>
                  )}
                </div>

                {movement.notes && (
                  <div style={{ fontSize: '0.8125rem', padding: '0.75rem', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px', color: 'var(--dash-text-secondary)', borderLeft: '3px solid var(--dash-primary)' }}>
                    <strong>หมายเหตุ:</strong> {movement.notes}
                  </div>
                )}
              </div>
            );
          })}

          {paginatedMovements.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <Package size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
              <p className="dash-text-muted">ไม่พบประวัติการเคลื่อนไหว</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--dash-border)', display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="dash-btn dash-btn-secondary"
              style={{ padding: '0.5rem 1rem' }}
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              // Simple pagination logic: show first, last, current, and neighbors
              if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`dash-btn ${currentPage === page ? 'dash-btn-primary' : 'dash-btn-secondary'}`}
                    style={{ minWidth: '40px', padding: '0.5rem' }}
                  >
                    {page}
                  </button>
                );
              } else if (Math.abs(page - currentPage) === 2) {
                return <span key={page} style={{ alignSelf: 'center', color: 'var(--dash-text-muted)' }}>...</span>;
              }
              return null;
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="dash-btn dash-btn-secondary"
              style={{ padding: '0.5rem 1rem' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .dash-grid-4 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .dash-table th:nth-child(4),
          .dash-table td:nth-child(4),
          .dash-table th:nth-child(5),
          .dash-table td:nth-child(5),
          .dash-table th:nth-child(6),
          .dash-table td:nth-child(6) {
            display: none;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}