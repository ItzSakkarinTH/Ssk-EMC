'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from './ShelterComparison.module.css';
import Link from 'next/link';
import { Search, Filter, RefreshCw } from 'lucide-react';

interface CategoryBreakdown {
  category: string;
  itemCount: number;
  totalQuantity: number;
  lowCount?: number;
  criticalCount?: number;
}

interface StaffInfo {
  _id: string;
  name: string;
  username: string;
  email: string;
}

interface Shelter {
  shelterId: string;
  shelterName: string;
  shelterCode: string;
  location?: string;
  totalItems: number;
  totalQuantity: number;
  alerts: { low: number; critical: number; total: number };
  status: 'normal' | 'tight' | 'critical';
  categoryBreakdown?: CategoryBreakdown[];
  contactPerson?: { name: string; phone: string };
  assignedStaff?: StaffInfo[];
}

// Category label mapping
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'food': 'อาหาร',
    'water': 'น้ำดื่ม',
    'medicine': 'ยา',
    'clothing': 'เครื่องนุ่งห่ม',
    'bedding': 'ที่นอน',
    'hygiene': 'ของใช้ส่วนตัว',
    'equipment': 'อุปกรณ์',
    'other': 'อื่นๆ',
  };
  return labels[category.toLowerCase()] || category;
};

export default function ShelterComparison() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'tight' | 'critical'>('all');
  const [alertFilter, setAlertFilter] = useState<'all' | 'hasAlerts' | 'noAlerts'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/admin/all-shelters', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setShelters(data.shelters);
      }
    } catch (err) {
      console.error('Failed to fetch', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filtered shelters
  const filteredShelters = useMemo(() => {
    return shelters.filter(shelter => {
      // Search filter
      const matchSearch =
        shelter.shelterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shelter.shelterCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shelter.location?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (shelter.assignedStaff?.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())) || false);

      if (!matchSearch) return false;

      // Status filter
      if (statusFilter !== 'all' && shelter.status !== statusFilter) return false;

      // Alert filter
      if (alertFilter === 'hasAlerts' && shelter.alerts.total === 0) return false;
      if (alertFilter === 'noAlerts' && shelter.alerts.total > 0) return false;

      return true;
    });
  }, [shelters, searchTerm, statusFilter, alertFilter]);

  // Summary stats
  const stats = useMemo(() => ({
    total: filteredShelters.length,
    normal: filteredShelters.filter(s => s.status === 'normal').length,
    tight: filteredShelters.filter(s => s.status === 'tight').length,
    critical: filteredShelters.filter(s => s.status === 'critical').length,
    withAlerts: filteredShelters.filter(s => s.alerts.total > 0).length
  }), [filteredShelters]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // Calculate max quantity for progress bar scaling
  const getMaxQuantity = (breakdown: CategoryBreakdown[] | undefined) => {
    if (!breakdown || breakdown.length === 0) return 100;
    return Math.max(...breakdown.map(c => c.totalQuantity), 100);
  };

  // Get bar status color
  const getBarStatus = (quantity: number, criticalCount: number = 0, lowCount: number = 0): 'normal' | 'warning' | 'critical' => {
    if (criticalCount > 0 || quantity === 0) return 'critical';
    if (lowCount > 0) return 'warning';
    return 'normal';
  };

  // Get staff display name
  const getStaffDisplayName = (shelter: Shelter): string => {
    if (shelter.assignedStaff && shelter.assignedStaff.length > 0) {
      const names = shelter.assignedStaff.map(s => s.name).join(', ');
      return names;
    }
    return shelter.contactPerson?.name || 'ยังไม่มีผู้ดูแล';
  };

  return (
    <div className={styles.container}>
      {/* Top Action Bar with Refresh */}
      <div className={styles.topActionBar}>
        <div className={styles.topActionInfo}>
          <span className={styles.pageTitle}>📍 ศูนย์พักพิงทั้งหมด</span>
          <span className={styles.updateTime}>
            อัพเดท: {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? styles.spinning : ''} />
          {refreshing ? 'กำลังโหลด...' : 'รีเฟรช'}
        </button>
      </div>

      {/* Filter Section */}
      <div className={styles.filterSection}>
        {/* Search */}
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="ค้นหาชื่อศูนย์, รหัส, ที่ตั้ง, ผู้ดูแล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className={styles.filterGroup}>
          <Filter size={16} />
          <span className={styles.filterLabel}>สถานะ:</span>
          <div className={styles.filterButtons}>
            {[
              { value: 'all', label: 'ทั้งหมด' },
              { value: 'normal', label: '🟢 ปกติ' },
              { value: 'tight', label: '🟡 ตึง' },
              { value: 'critical', label: '🔴 วิกฤต' }
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

        {/* Alert Filter */}
        <div className={styles.filterGroup}>
          <Filter size={16} />
          <span className={styles.filterLabel}>การแจ้งเตือน:</span>
          <div className={styles.filterButtons}>
            {[
              { value: 'all', label: 'ทั้งหมด' },
              { value: 'hasAlerts', label: '⚠️ มีแจ้งเตือน' },
              { value: 'noAlerts', label: '✓ ไม่มี' }
            ].map(option => (
              <button
                key={option.value}
                className={`${styles.filterBtn} ${alertFilter === option.value ? styles.active : ''}`}
                onClick={() => setAlertFilter(option.value as typeof alertFilter)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className={styles.statsSummary}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>ทั้งหมด</span>
        </div>
        <div className={`${styles.statItem} ${styles.statNormal}`}>
          <span className={styles.statValue}>{stats.normal}</span>
          <span className={styles.statLabel}>🟢 ปกติ</span>
        </div>
        <div className={`${styles.statItem} ${styles.statTight}`}>
          <span className={styles.statValue}>{stats.tight}</span>
          <span className={styles.statLabel}>🟡 ตึง</span>
        </div>
        <div className={`${styles.statItem} ${styles.statCritical}`}>
          <span className={styles.statValue}>{stats.critical}</span>
          <span className={styles.statLabel}>🔴 วิกฤต</span>
        </div>
        <div className={`${styles.statItem} ${styles.statAlerts}`}>
          <span className={styles.statValue}>{stats.withAlerts}</span>
          <span className={styles.statLabel}>⚠️ มีแจ้งเตือน</span>
        </div>
      </div>

      {/* Header with count badge */}
      <div className={styles.headerSection}>
        <div className={styles.headerLeft}>
          <span className={styles.countBadge}>{filteredShelters.length}/{shelters.length} แห่ง</span>
          {searchTerm && (
            <span className={styles.searchInfo}>
              ผลการค้นหา &quot;{searchTerm}&quot;
            </span>
          )}
        </div>
        <Link href="/admin/shelters" className={styles.addBtn}>
          ⚙️ จัดการศูนย์พักพิง
        </Link>
      </div>

      {/* Shelter Cards Grid */}
      {filteredShelters.length > 0 ? (
        <div className={styles.grid}>
          {filteredShelters.map(shelter => {
            const maxQty = getMaxQuantity(shelter.categoryBreakdown);

            return (
              <div key={shelter.shelterId} className={styles.card}>
                {/* Status Strip */}
                <div className={`${styles.statusStrip} ${styles[shelter.status]}`}></div>

                {/* Status Badge */}
                <div className={styles.statusBadgeWrapper}>
                  <span className={`${styles.statusBadge} ${styles[`badge${shelter.status.charAt(0).toUpperCase() + shelter.status.slice(1)}`]}`}>
                    {shelter.status === 'normal' ? 'เปิดใช้งาน' : shelter.status === 'tight' ? 'เริ่มตึง' : 'วิกฤต'}
                  </span>
                </div>

                {/* Shelter Info */}
                <div className={styles.shelterInfo}>
                  <div className={styles.shelterIcon}>📍</div>
                  <div className={styles.shelterDetails}>
                    <h3 className={styles.shelterName}>{shelter.shelterName}</h3>
                    <p className={styles.shelterLocation}>{shelter.location || shelter.shelterCode}</p>
                  </div>
                </div>

                {/* Stock Summary */}
                <div className={styles.stockSummary}>
                  {/* Items Progress */}
                  <div className={styles.stockRow}>
                    <span className={styles.stockIcon}>📦</span>
                    <span className={styles.stockLabel}>รายการสินค้าในศูนย์</span>
                    <span className={styles.stockValue}>{shelter.totalItems} รายการ</span>
                  </div>
                  <div className={styles.progressRow}>
                    <div className={styles.progressBar}>
                      <div
                        className={`${styles.progressFill} ${shelter.alerts.total > 5 ? styles.progressDanger :
                          shelter.alerts.total > 0 ? styles.progressWarning :
                            styles.progressSuccess
                          }`}
                        style={{ width: `${Math.min((shelter.totalItems / Math.max(shelter.totalItems, 20)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Resource Summary Section */}
                <div className={styles.resourceSection}>
                  <h4 className={styles.resourceTitle}>📊 สรุปทรัพยากรคงเหลือ</h4>

                  {/* Legend */}
                  <div className={styles.legend}>
                    <div className={styles.legendItem}>
                      <span className={`${styles.legendDot} ${styles.legendNormal}`}></span>
                      <span>เพียงพอ</span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={`${styles.legendDot} ${styles.legendWarning}`}></span>
                      <span>ใกล้ต่ำ</span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={`${styles.legendDot} ${styles.legendCritical}`}></span>
                      <span>ขาดแคลน</span>
                    </div>
                  </div>

                  {/* Resource Bars */}
                  <div className={styles.resourceList}>
                    {shelter.categoryBreakdown && shelter.categoryBreakdown.length > 0 ? (
                      shelter.categoryBreakdown.slice(0, 4).map((cat, idx) => {
                        const barWidth = Math.max((cat.totalQuantity / maxQty) * 100, 2);
                        const barStatus = getBarStatus(cat.totalQuantity, cat.criticalCount, cat.lowCount);

                        return (
                          <div key={idx} className={styles.resourceItem}>
                            <span className={styles.resourceName}>{getCategoryLabel(cat.category)}</span>
                            <div className={styles.resourceBarWrapper}>
                              <div className={styles.resourceBarBg}>
                                <div
                                  className={`${styles.resourceBar} ${styles[`bar${barStatus.charAt(0).toUpperCase() + barStatus.slice(1)}`]}`}
                                  style={{ width: `${barWidth}%` }}
                                >
                                  {barStatus === 'critical' && cat.totalQuantity > 0 && (
                                    <span className={styles.criticalDot}></span>
                                  )}
                                </div>
                              </div>
                              <span className={styles.resourceValue}>{cat.totalQuantity.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className={styles.noData}>ไม่มีข้อมูลสินค้า</div>
                    )}
                  </div>
                </div>

                {/* Contact Info - Updated to show staff */}
                <div className={styles.contactSection}>
                  <div className={styles.contactRow}>
                    <span className={styles.contactIcon}>👤</span>
                    <span className={styles.contactLabel}>ผู้ดูแล:</span>
                    <span className={styles.contactText}>
                      {getStaffDisplayName(shelter)}
                    </span>
                  </div>
                  <div className={styles.contactRow}>
                    <span className={styles.contactIcon}>📞</span>
                    <span className={styles.contactLabel}>โทร:</span>
                    <span className={styles.contactText}>
                      {shelter.contactPerson?.phone || 'ไม่ระบุ'}
                    </span>
                  </div>
                  {shelter.alerts.total > 0 && (
                    <div className={styles.alertRow}>
                      <span className={styles.alertText}>⚠️ มี {shelter.alerts.total} รายการต้องดูแล</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className={styles.actionButtons}>
                  <Link
                    href={`/admin/stock/shelter/${shelter.shelterId}`}
                    className={styles.editBtn}
                  >
                    ✏️ แก้ไข
                  </Link>
                  <Link
                    href={`/admin/stock/shelter/${shelter.shelterId}/report`}
                    className={styles.reportBtn}
                  >
                    📊 ดูรายงาน
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <p className={styles.emptyText}>
            {searchTerm || statusFilter !== 'all' || alertFilter !== 'all'
              ? 'ไม่พบศูนย์พักพิงที่ตรงกับเงื่อนไข'
              : 'ยังไม่มีศูนย์พักพิงในระบบ'}
          </p>
          {(searchTerm || statusFilter !== 'all' || alertFilter !== 'all') && (
            <button
              className={styles.clearFilterBtn}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setAlertFilter('all');
              }}
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      )}
    </div>
  );
}