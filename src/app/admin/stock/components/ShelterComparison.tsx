'use client';

import { useState, useEffect } from 'react';
import { Building2, Package, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import styles from './ShelterComparison.module.css';

interface Shelter {
  shelterId: string;
  shelterName: string;
  shelterCode: string;
  totalItems: number;
  totalQuantity: number;
  alerts: { low: number; critical: number; total: number };
  status: 'normal' | 'tight' | 'critical';
  capacity?: number;
  currentOccupancy?: number;
}

interface SummaryData {
  totalShelters: number;
  normalShelters: number;
  tightShelters: number;
  criticalShelters: number;
}

export default function ShelterComparison() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'quantity'>('status');
  const [filterStatus, setFilterStatus] = useState<'all' | 'normal' | 'tight' | 'critical'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/stock/admin/all-shelters');

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setShelters(data.shelters || []);
      setSummary(data.summary || null);
    } catch (err: unknown) {
      console.error('Failed to fetch:', err);
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <RefreshCw className={styles.spinIcon} size={32} />
          <span>กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <AlertTriangle size={48} />
          <h3>เกิดข้อผิดพลาด</h3>
          <p>{error}</p>
          <button onClick={fetchData} className={styles.retryBtn}>
            <RefreshCw size={16} />
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // Filter และ Sort
  const filteredShelters = shelters.filter(shelter => {
    if (filterStatus === 'all') return true;
    return shelter.status === filterStatus;
  });

  const sortedShelters = [...filteredShelters].sort((a, b) => {
    if (sortBy === 'name') return a.shelterName.localeCompare(b.shelterName, 'th');
    if (sortBy === 'status') {
      const statusOrder = { critical: 0, tight: 1, normal: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return b.totalQuantity - a.totalQuantity;
  });

  const statusColors: Record<string, string> = {
    normal: styles.normal,
    tight: styles.tight,
    critical: styles.critical
  };

  const statusLabels: Record<string, string> = {
    normal: 'ปกติ',
    tight: 'เริ่มตึง',
    critical: 'วิกฤต'
  };

  // Empty State
  if (shelters.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <Building2 size={64} />
          <h3>ไม่พบข้อมูลศูนย์พักพิง</h3>
          <p>ยังไม่มีศูนย์พักพิงในระบบ</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Summary Cards */}
      {summary && (
        <div className={styles.summaryCards}>
          <div className={`${styles.summaryCard} ${styles.allCard}`}>
            <div className={styles.summaryIcon}>
              <Building2 size={24} />
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryValue}>{summary.totalShelters}</div>
              <div className={styles.summaryLabel}>ศูนย์ทั้งหมด</div>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${styles.normalCard}`}>
            <div className={styles.summaryIcon}>
              <Package size={24} />
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryValue}>{summary.normalShelters}</div>
              <div className={styles.summaryLabel}>ปกติ</div>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${styles.tightCard}`}>
            <div className={styles.summaryIcon}>
              <TrendingUp size={24} />
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryValue}>{summary.tightShelters}</div>
              <div className={styles.summaryLabel}>เริ่มตึง</div>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${styles.criticalCard}`}>
            <div className={styles.summaryIcon}>
              <AlertTriangle size={24} />
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryValue}>{summary.criticalShelters}</div>
              <div className={styles.summaryLabel}>วิกฤต</div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>กรองตามสถานะ:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'normal' | 'tight' | 'critical')}
          >
            <option value="all">ทั้งหมด ({shelters.length})</option>
            <option value="normal">ปกติ ({shelters.filter(s => s.status === 'normal').length})</option>
            <option value="tight">เริ่มตึง ({shelters.filter(s => s.status === 'tight').length})</option>
            <option value="critical">วิกฤต ({shelters.filter(s => s.status === 'critical').length})</option>
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label>เรียงตาม:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'status' | 'quantity')}
          >
            <option value="status">สถานะ (วิกฤต → ปกติ)</option>
            <option value="name">ชื่อ (ก-ฮ)</option>
            <option value="quantity">จำนวนสต๊อก (มาก → น้อย)</option>
          </select>
        </div>

        <button onClick={fetchData} className={styles.refreshBtn} title="รีเฟรชข้อมูล">
          <RefreshCw size={18} />
          <span>รีเฟรช</span>
        </button>
      </div>

      {/* Results Count */}
      <div className={styles.resultsInfo}>
        แสดง <strong>{sortedShelters.length}</strong> จาก {shelters.length} ศูนย์
      </div>

      {/* Grid */}
      {sortedShelters.length === 0 ? (
        <div className={styles.noResults}>
          <p>ไม่พบศูนย์พักพิงที่ตรงกับเงื่อนไข</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {sortedShelters.map(shelter => (
            <div key={shelter.shelterId} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.shelterName}>
                    <Building2 size={18} />
                    {shelter.shelterName}
                  </div>
                  <div className={styles.shelterCode}>รหัส: {shelter.shelterCode}</div>
                </div>
                <div className={`${styles.status} ${statusColors[shelter.status]}`}>
                  {statusLabels[shelter.status]}
                </div>
              </div>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{shelter.totalItems}</span>
                  <span className={styles.statLabel}>รายการ</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>
                    {shelter.totalQuantity.toLocaleString()}
                  </span>
                  <span className={styles.statLabel}>จำนวน</span>
                </div>
              </div>

              {/* Capacity Bar (ถ้ามีข้อมูล) */}
              {shelter.capacity && shelter.currentOccupancy !== undefined && (
                <div className={styles.capacitySection}>
                  <div className={styles.capacityLabel}>
                    ความจุ: {shelter.currentOccupancy} / {shelter.capacity}
                  </div>
                  <div className={styles.capacityBar}>
                    <div
                      className={styles.capacityFill}
                      style={{
                        width: `${Math.min((shelter.currentOccupancy / shelter.capacity) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Alerts */}
              {shelter.alerts.total > 0 && (
                <div className={styles.alerts}>
                  {shelter.alerts.critical > 0 && (
                    <span className={styles.alertCritical}>
                      วิกฤต: {shelter.alerts.critical}
                    </span>
                  )}
                  {shelter.alerts.low > 0 && (
                    <span className={styles.alertLow}>
                      ใกล้หมด: {shelter.alerts.low}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}