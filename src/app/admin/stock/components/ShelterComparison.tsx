'use client';

import { useState, useEffect } from 'react';
import styles from './ShelterComparison.module.css';
import Link from 'next/link';

interface CategoryBreakdown {
  category: string;
  itemCount: number;
  totalQuantity: number;
  lowCount?: number;
  criticalCount?: number;
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
    }
  };

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

  return (
    <div className={styles.container}>
      {/* Header with count badge */}
      <div className={styles.headerSection}>
        <div className={styles.headerLeft}>
          <span className={styles.countBadge}>{shelters.length}/{shelters.length} แห่ง</span>
        </div>
        <Link href="/admin/shelters/new" className={styles.addBtn}>
          + เพิ่มศูนย์พักพิง
        </Link>
      </div>

      {/* Shelter Cards Grid */}
      <div className={styles.grid}>
        {shelters.map(shelter => {
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

              {/* Contact Info */}
              <div className={styles.contactSection}>
                <div className={styles.contactRow}>
                  <span className={styles.contactIcon}>📞</span>
                  <span className={styles.contactText}>
                    {shelter.contactPerson?.phone || 'ไม่ระบุ'}
                  </span>
                </div>
                <div className={styles.contactRow}>
                  <span className={styles.contactIcon}>👤</span>
                  <span className={styles.contactText}>
                    {shelter.contactPerson?.name || 'ยังไม่มีผู้ดูแล'}
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

      {shelters.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏚️</div>
          <p className={styles.emptyText}>ยังไม่มีศูนย์พักพิงในระบบ</p>
          <Link href="/admin/shelters/new" className={styles.addBtnLarge}>
            + เพิ่มศูนย์พักพิงใหม่
          </Link>
        </div>
      )}
    </div>
  );
}