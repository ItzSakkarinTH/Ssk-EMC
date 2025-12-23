'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Package,
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  ArrowLeftRight,
  Boxes,
  Activity
} from 'lucide-react';
import styles from './adminStock.module.css';

interface OverviewData {
  overview: {
    totalProvincialStock: number;
    totalShelterStock: number;
    totalStock: number;
    totalItems: number;
    alerts: {
      low: number;
      outOfStock: number;
    };
  };
  byCategory: Record<string, { provincial: number; shelter: number; items: number }>;
  recentActivity: {
    receive: { count: number; quantity: number };
    transfer: { count: number; quantity: number };
    dispense: { count: number; quantity: number };
  };
  provincialStock: Array<{
    stockId: string;
    itemName: string;
    category: string;
    quantity: number;
    unit: string;
    status: string;
  }>;
}

export default function AdminStockPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Auto refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/admin/province-stock', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const categoryEmojis: Record<string, string> = {
    food: '🍚',
    medicine: '💊',
    clothing: '👕',
    equipment: '🔧',
    hygiene: '🧴',
    other: '📦'
  };

  const categoryLabels: Record<string, string> = {
    food: 'อาหาร',
    medicine: 'ยา/เวชภัณฑ์',
    clothing: 'เสื้อผ้า',
    equipment: 'อุปกรณ์',
    hygiene: 'สุขอนามัย',
    other: 'อื่นๆ'
  };

  const categoryColors: Record<string, string> = {
    food: '#10b981',
    medicine: '#3b82f6',
    clothing: '#8b5cf6',
    equipment: '#f59e0b',
    hygiene: '#ec4899',
    other: '#64748b'
  };

  // Calculate totals for charts
  const getTotalActivity = () => {
    if (!data) return 0;
    return data.recentActivity.receive.quantity +
      data.recentActivity.transfer.quantity +
      data.recentActivity.dispense.quantity;
  };

  const getCategoryTotal = () => {
    if (!data) return 0;
    return Object.values(data.byCategory).reduce((sum, cat) => sum + cat.provincial + cat.shelter, 0);
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard สต๊อก" subtitle="กำลังโหลด...">
        <div className="dash-loading">
          <div className="dash-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Dashboard สต๊อกระดับจังหวัด"
      subtitle="ภาพรวมและรายงานการจัดการสต๊อกทั้งหมด"
    >
      {/* Header with Last Updated */}
      <div className={styles.dashboardHeader}>
        <div className={styles.liveIndicator}>
          <Activity size={16} />
          <span>Live Data</span>
        </div>
        <div className={styles.headerActions}>
          {lastUpdated && (
            <span className={styles.lastUpdated}>
              อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH')}
            </span>
          )}
          <button onClick={fetchData} className={styles.refreshBtn}>
            <RefreshCw size={16} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCardLarge}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <Package size={32} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValueLarge}>{data?.overview.totalStock.toLocaleString() || 0}</div>
            <div className={styles.statLabel}>สต๊อกรวมทั้งหมด</div>
            <div className={styles.statSubLabel}>หน่วย</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Building2 size={28} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{data?.overview.totalProvincialStock.toLocaleString() || 0}</div>
            <div className={styles.statLabel}>สต๊อกกองกลาง</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <Boxes size={28} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{data?.overview.totalShelterStock.toLocaleString() || 0}</div>
            <div className={styles.statLabel}>สต๊อกในศูนย์</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Package size={28} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{data?.overview.totalItems || 0}</div>
            <div className={styles.statLabel}>รายการสินค้า</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {data && (data.overview.alerts.outOfStock > 0 || data.overview.alerts.low > 0) && (
        <div className={styles.alertsSection}>
          {data.overview.alerts.outOfStock > 0 && (
            <div className={styles.alertCritical}>
              <AlertTriangle size={20} />
              <span>สินค้าหมดแล้ว <strong>{data.overview.alerts.outOfStock}</strong> รายการ</span>
            </div>
          )}
          {data.overview.alerts.low > 0 && (
            <div className={styles.alertWarning}>
              <AlertTriangle size={20} />
              <span>สินค้าใกล้หมด <strong>{data.overview.alerts.low}</strong> รายการ</span>
            </div>
          )}
        </div>
      )}

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Stock Distribution Donut Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>การกระจายสต๊อก</h3>
            <span className={styles.chartSubtitle}>กองกลาง vs ศูนย์พักพิง</span>
          </div>
          <div className={styles.donutChartContainer}>
            <div className={styles.donutChart}>
              <svg viewBox="0 0 100 100" className={styles.donutSvg}>
                {(() => {
                  const provincial = data?.overview.totalProvincialStock || 0;
                  const shelter = data?.overview.totalShelterStock || 0;
                  const total = provincial + shelter || 1;
                  const provincialPercent = (provincial / total) * 100;
                  const shelterPercent = (shelter / total) * 100;
                  const provincialDash = provincialPercent * 2.51327;
                  const shelterDash = shelterPercent * 2.51327;

                  return (
                    <>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--dash-border-color)" strokeWidth="12" />
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeDasharray={`${provincialDash} 251.327`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                        className={styles.donutSegment}
                      />
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="12"
                        strokeDasharray={`${shelterDash} 251.327`}
                        strokeDashoffset={`-${provincialDash}`}
                        transform="rotate(-90 50 50)"
                        className={styles.donutSegment}
                      />
                    </>
                  );
                })()}
              </svg>
              <div className={styles.donutCenter}>
                <div className={styles.donutValue}>{data?.overview.totalStock.toLocaleString() || 0}</div>
                <div className={styles.donutLabel}>รวม</div>
              </div>
            </div>
            <div className={styles.donutLegend}>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#10b981' }}></span>
                <span>กองกลาง</span>
                <strong>{data?.overview.totalProvincialStock.toLocaleString() || 0}</strong>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#8b5cf6' }}></span>
                <span>ศูนย์พักพิง</span>
                <strong>{data?.overview.totalShelterStock.toLocaleString() || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>กิจกรรม 7 วันล่าสุด</h3>
            <span className={styles.chartSubtitle}>รับเข้า / โอน / เบิกจ่าย</span>
          </div>
          <div className={styles.activityBars}>
            {data && (
              <>
                <div className={styles.activityBarItem}>
                  <div className={styles.activityBarLabel}>
                    <TrendingUp size={18} style={{ color: '#10b981' }} />
                    <span>รับเข้า</span>
                  </div>
                  <div className={styles.activityBarTrack}>
                    <div
                      className={styles.activityBarFill}
                      style={{
                        width: `${Math.min((data.recentActivity.receive.quantity / (getTotalActivity() || 1)) * 100, 100)}%`,
                        background: 'linear-gradient(90deg, #10b981, #059669)'
                      }}
                    ></div>
                  </div>
                  <div className={styles.activityBarValue}>
                    <strong>{data.recentActivity.receive.count}</strong> ครั้ง
                    <span>{data.recentActivity.receive.quantity.toLocaleString()} หน่วย</span>
                  </div>
                </div>

                <div className={styles.activityBarItem}>
                  <div className={styles.activityBarLabel}>
                    <ArrowLeftRight size={18} style={{ color: '#3b82f6' }} />
                    <span>โอน</span>
                  </div>
                  <div className={styles.activityBarTrack}>
                    <div
                      className={styles.activityBarFill}
                      style={{
                        width: `${Math.min((data.recentActivity.transfer.quantity / (getTotalActivity() || 1)) * 100, 100)}%`,
                        background: 'linear-gradient(90deg, #3b82f6, #2563eb)'
                      }}
                    ></div>
                  </div>
                  <div className={styles.activityBarValue}>
                    <strong>{data.recentActivity.transfer.count}</strong> ครั้ง
                    <span>{data.recentActivity.transfer.quantity.toLocaleString()} หน่วย</span>
                  </div>
                </div>

                <div className={styles.activityBarItem}>
                  <div className={styles.activityBarLabel}>
                    <TrendingDown size={18} style={{ color: '#ef4444' }} />
                    <span>เบิกจ่าย</span>
                  </div>
                  <div className={styles.activityBarTrack}>
                    <div
                      className={styles.activityBarFill}
                      style={{
                        width: `${Math.min((data.recentActivity.dispense.quantity / (getTotalActivity() || 1)) * 100, 100)}%`,
                        background: 'linear-gradient(90deg, #ef4444, #dc2626)'
                      }}
                    ></div>
                  </div>
                  <div className={styles.activityBarValue}>
                    <strong>{data.recentActivity.dispense.count}</strong> ครั้ง
                    <span>{data.recentActivity.dispense.quantity.toLocaleString()} หน่วย</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown Chart */}
      <div className={styles.chartCardFull}>
        <div className={styles.chartHeader}>
          <h3>สต๊อกแยกตามหมวดหมู่</h3>
          <span className={styles.chartSubtitle}>เปรียบเทียบปริมาณแต่ละหมวด</span>
        </div>
        <div className={styles.categoryChartContainer}>
          {data && Object.entries(data.byCategory).map(([key, value]) => {
            const total = value.provincial + value.shelter;
            const maxTotal = Math.max(...Object.values(data.byCategory).map(c => c.provincial + c.shelter)) || 1;
            const percentage = (total / maxTotal) * 100;

            return (
              <div key={key} className={styles.categoryBarItem}>
                <div className={styles.categoryBarHeader}>
                  <span className={styles.categoryBarEmoji}>{categoryEmojis[key] || '📦'}</span>
                  <span className={styles.categoryBarName}>{categoryLabels[key] || key}</span>
                  <span className={styles.categoryBarTotal}>{total.toLocaleString()}</span>
                </div>
                <div className={styles.categoryBarTrack}>
                  <div
                    className={styles.categoryBarProvincial}
                    style={{
                      width: `${(value.provincial / (total || 1)) * percentage}%`,
                      background: categoryColors[key] || '#64748b'
                    }}
                  ></div>
                  <div
                    className={styles.categoryBarShelter}
                    style={{
                      width: `${(value.shelter / (total || 1)) * percentage}%`,
                      background: `${categoryColors[key] || '#64748b'}80`
                    }}
                  ></div>
                </div>
                <div className={styles.categoryBarDetails}>
                  <span>กองกลาง: <strong>{value.provincial.toLocaleString()}</strong></span>
                  <span>ศูนย์: <strong>{value.shelter.toLocaleString()}</strong></span>
                  <span>รายการ: <strong>{value.items}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
        <div className={styles.categoryLegend}>
          <div className={styles.legendItem}>
            <div className={styles.legendBar} style={{ opacity: 1 }}></div>
            <span>กองกลาง</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendBar} style={{ opacity: 0.5 }}></div>
            <span>ศูนย์พักพิง</span>
          </div>
        </div>
      </div>

      {/* Top Stock Items */}
      {data && data.provincialStock.length > 0 && (
        <div className={styles.chartCardFull}>
          <div className={styles.chartHeader}>
            <h3>Top 10 สินค้าในกองกลาง</h3>
            <span className={styles.chartSubtitle}>สินค้าที่มีปริมาณมากที่สุด</span>
          </div>
          <div className={styles.topStockGrid}>
            {data.provincialStock.slice(0, 10).map((item, i) => {
              const maxQty = data.provincialStock[0]?.quantity || 1;
              const percentage = (item.quantity / maxQty) * 100;

              return (
                <div key={item.stockId} className={styles.topStockItem}>
                  <div className={styles.topStockRank} style={{
                    background: i < 3 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(59, 130, 246, 0.15)',
                    color: i < 3 ? 'white' : '#3b82f6'
                  }}>
                    {i + 1}
                  </div>
                  <div className={styles.topStockInfo}>
                    <div className={styles.topStockName}>
                      {categoryEmojis[item.category] || '📦'} {item.itemName}
                    </div>
                    <div className={styles.topStockBar}>
                      <div
                        className={styles.topStockBarFill}
                        style={{
                          width: `${percentage}%`,
                          background: `linear-gradient(90deg, ${categoryColors[item.category] || '#3b82f6'}, ${categoryColors[item.category] || '#3b82f6'}80)`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className={styles.topStockQty}>
                    <strong>{item.quantity.toLocaleString()}</strong>
                    <span>{item.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}