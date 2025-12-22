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
  RefreshCw
} from 'lucide-react';
import styles from './page.module.css';

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
  };
  createdAt: string;
  referenceId?: string;
  notes?: string;
}

export default function StaffHistoryPage() {
  const toast = useToast();
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
  }, []);

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
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getMovementTypeConfig = (type: string) => {
    switch (type) {
      case 'receive':
        return { label: 'รับเข้า', color: '#22c55e', icon: TrendingDown };
      case 'dispense':
        return { label: 'จ่ายออก', color: '#ef4444', icon: TrendingUp };
      case 'transfer':
        return { label: 'โอน', color: '#3b82f6', icon: ArrowRight };
      default:
        return { label: type, color: '#64748b', icon: Package };
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
      title="ประวัติการเคลื่อนไหว"
      subtitle="ตรวจสอบรายการรับเข้า จ่ายออก และโอนสินค้าของศูนย์"
    >
      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-primary">
            <Package size={24} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">{movements.length}</div>
            <div className="dash-stat-label">การเคลื่อนไหวทั้งหมด</div>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-success">
            <TrendingDown size={24} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">
              {movements.filter(m => m.movementType === 'receive').length}
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
              {movements.filter(m => m.movementType === 'dispense').length}
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
              {movements.filter(m => m.movementType === 'transfer').length}
            </div>
            <div className="dash-stat-label">โอน</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้า, แหล่งที่มา, หรือเลขที่อ้างอิง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.filterItem}>
            <Filter size={16} />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className={styles.filterSelect}
            >
              <option value="all">ประเภททั้งหมด</option>
              <option value="receive">รับเข้า</option>
              <option value="dispense">จ่ายออก</option>
              <option value="transfer">โอน</option>
            </select>
          </div>

          <div className={styles.filterItem}>
            <Calendar size={16} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
              className={styles.filterSelect}
            >
              <option value="all">ทุกช่วงเวลา</option>
              <option value="today">วันนี้</option>
              <option value="week">7 วันที่แล้ว</option>
              <option value="month">30 วันที่แล้ว</option>
            </select>
          </div>

          <button
            onClick={() => void fetchMovements()}
            className="dash-btn dash-btn-secondary dash-btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h3 className="dash-card-title">
            รายการเคลื่อนไหว
          </h3>
          <span className="dash-badge dash-badge-primary">
            {filteredMovements.length} รายการ
          </span>
        </div>

        <div className="dash-card-body">
          {paginatedMovements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <Package size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <h3 style={{ color: '#94a3b8', margin: 0 }}>ไม่พบข้อมูล</h3>
            </div>
          ) : (
            <>
              <div className="dash-table-responsive">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>เวลา</th>
                      <th>ประเภท</th>
                      <th>สินค้า</th>
                      <th style={{ textAlign: 'right' }}>จำนวน</th>
                      <th>จาก</th>
                      <th>ถึง</th>
                      <th>โดย</th>
                      <th>หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMovements.map(movement => {
                      const typeConfig = getMovementTypeConfig(movement.movementType);
                      const TypeIcon = typeConfig.icon;

                      return (
                        <tr key={movement._id}>
                          <td>
                            <div style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                              {getRelativeTime(movement.createdAt)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                              {formatDate(movement.createdAt)}
                            </div>
                          </td>
                          <td>
                            <span className="dash-badge" style={{
                              background: `${typeConfig.color}20`,
                              color: typeConfig.color,
                              border: `1px solid ${typeConfig.color}40`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem'
                            }}>
                              <TypeIcon size={14} />
                              {typeConfig.label}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500, color: '#f1f5f9' }}>
                              {movement.itemName || movement.stockId?.itemName}
                            </div>
                            {movement.referenceId && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                {movement.referenceId}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{
                              fontSize: '1.125rem',
                              fontWeight: 700,
                              color: typeConfig.color
                            }}>
                              {movement.quantity.toLocaleString()}
                            </span>
                            <span style={{ marginLeft: '0.5rem', color: '#94a3b8' }}>
                              {movement.unit}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                              {movement.from?.name || '-'}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                              {movement.to?.name || '-'}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                              {movement.performedBy?.username}
                            </div>
                          </td>
                          <td>
                            {movement.notes && (
                              <div style={{
                                fontSize: '0.8125rem',
                                color: '#94a3b8',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }} title={movement.notes}>
                                {movement.notes}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={styles.pagination}>
                <div className={styles.paginationInfo}>
                  แสดง {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredMovements.length)} จาก {filteredMovements.length}
                </div>

                <div className={styles.paginationControls}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={styles.paginationButton}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <span className={styles.paginationNumbers}>
                    {currentPage} / {totalPages || 1}
                  </span>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={styles.paginationButton}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className={styles.paginationSelect}
                >
                  <option value={10}>10 / หน้า</option>
                  <option value={25}>25 / หน้า</option>
                  <option value={50}>50 / หน้า</option>
                  <option value={100}>100 / หน้า</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}