'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Package,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
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
        return <TrendingDown size={16} />;
      case 'dispense':
        return <TrendingUp size={16} />;
      case 'transfer':
        return <ArrowRight size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'receive':
        return '#22c55e';
      case 'dispense':
        return '#ef4444';
      case 'transfer':
        return '#3b82f6';
      default:
        return '#64748b';
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
            <TrendingDown size={24} />
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
            <TrendingUp size={24} />
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
            <ArrowRight size={24} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">
              {filteredMovements.filter(m => m.movementType === 'transfer').length}
            </div>
            <div className="dash-stat-label">รายการโอน</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="dash-card">
        <div className="dash-grid dash-grid-3">
          <div className="dash-form-group">
            <label className="dash-label">
              <Search size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              ค้นหาประวัติ
            </label>
            <input
              type="text"
              className="dash-input"
              placeholder="สินค้า, ผู้รับ, เอกสาร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="dash-form-group">
            <label className="dash-label">
              <Filter size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              ประเภทรายการ
            </label>
            <select
              className="dash-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'receive' | 'transfer' | 'dispense')}
            >
              <option value="all">ทั้งหมด</option>
              <option value="receive">📥 รับเข้า</option>
              <option value="dispense">📤 จ่ายออก</option>
              <option value="transfer">🔄 โอน</option>
            </select>
          </div>

          <div className="dash-form-group">
            <label className="dash-label">
              <Calendar size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              ช่วงเวลา
            </label>
            <select
              className="dash-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
            >
              <option value="all">ทั้งหมด</option>
              <option value="today">วันนี้</option>
              <option value="week">7 วันที่ผ่านมา</option>
              <option value="month">30 วันที่ผ่านมา</option>
            </select>
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

        <div style={{ overflowX: 'auto' }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>ประเภท</th>
                <th>สินค้า</th>
                <th>จำนวน</th>
                <th>จาก</th>
                <th>ไปยัง</th>
                <th>ผู้บันทึก</th>
                <th>วันเวลา</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovements.map((movement) => {
                const itemName = movement.itemName || movement.stockId?.itemName || 'N/A';
                const color = getMovementColor(movement.movementType);
                const label = getMovementLabel(movement.movementType);

                return (
                  <tr key={movement._id}>
                    <td>
                      <div className="dash-badge" style={{
                        background: `${color}20`,
                        color: color,
                        border: `1px solid ${color}40`,
                        gap: '0.4rem',
                        fontWeight: 700
                      }}>
                        {getMovementIcon(movement.movementType)}
                        {label}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{itemName}</td>
                    <td>
                      <span style={{
                        fontWeight: 800,
                        color: movement.movementType === 'receive' ? 'var(--dash-success)' : movement.movementType === 'dispense' ? 'var(--dash-danger)' : 'var(--dash-primary)'
                      }}>
                        {movement.movementType === 'receive' ? '+' : movement.movementType === 'dispense' ? '-' : ''}
                        {movement.quantity.toLocaleString()}
                      </span>
                      <span className="dash-text-muted" style={{ marginLeft: '0.4rem', fontSize: '0.8rem' }}>{movement.unit}</span>
                    </td>
                    <td><span className="dash-text-secondary">{movement.from?.name || '-'}</span></td>
                    <td><span className="dash-text-secondary">{movement.to?.name || '-'}</span></td>
                    <td><span className="dash-text-secondary">{movement.performedBy?.name || movement.performedBy?.username || 'N/A'}</span></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{getRelativeTime(movement.createdAt)}</span>
                        <span className="dash-text-muted" style={{ fontSize: '0.75rem' }}>{formatDate(movement.createdAt)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedMovements.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '4rem' }}>
                    <Package size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                    <p className="dash-text-muted">ไม่พบประวัติการเคลื่อนไหว</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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