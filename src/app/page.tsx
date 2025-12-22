'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import {
  Building2,
  Package2,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import styles from './page.module.css';
import AnnouncementBanner from '@/components/AnnouncementBanner/AnnouncementBanner';

// Types
interface StockOverview {
  totalItems: number;
  totalQuantity: number;
  alerts: {
    lowStock: number;
    outOfStock: number;
  };
  shelters: {
    total: number;
    active: number;
    inactive: number;
    full: number;
  };
  byCategory: {
    food: { items: number; quantity: number };
    medicine: { items: number; quantity: number };
    clothing: { items: number; quantity: number };
    other: { items: number; quantity: number };
  };
}

interface Alert {
  itemName: string;
  category: string;
  currentStock: number;
  minLevel: number;
  unit: string;
  status: 'low' | 'critical' | 'outOfStock';
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  // State
  const [overview, setOverview] = useState<StockOverview | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch overview
        const overviewRes = await fetch('/api/stock/public/overview');
        if (overviewRes.ok) {
          const data = await overviewRes.json();
          setOverview(data);
        }

        // Fetch alerts
        const alertsRes = await fetch('/api/stock/public/alerts');
        if (alertsRes.ok) {
          const data = await alertsRes.json();
          setAlerts(data.alerts || []);
        }

        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate stats
  const totalShelters = overview?.shelters?.total || 0;
  const activeShelters = overview?.shelters?.active || 0;
  const urgentAlerts = alerts.filter(a => a.status === 'critical').length;

  // Category data for chart
  const categoryData = [
    { name: 'น้ำดื่ม', category: 'food', quantity: overview?.byCategory?.food?.quantity || 0, color: '#10b981' },
    { name: 'อาหาร', category: 'food', quantity: overview?.byCategory?.food?.quantity || 0, color: '#3b82f6' },
    { name: 'ยา', category: 'medicine', quantity: overview?.byCategory?.medicine?.quantity || 0, color: '#f59e0b' },
    { name: 'ที่นอน', category: 'other', quantity: overview?.byCategory?.other?.quantity || 0, color: '#ef4444' },
  ];

  // Calculate max for chart scale
  const maxQuantity = Math.max(...categoryData.map(d => d.quantity), 1);

  // Mock trend data (in real app, this would come from API)
  const trendDays = ['-6 วัน', '-5 วัน', '-4 วัน', '-3 วัน', '-2 วัน', '-1 วัน', 'วันนี้'];
  const waterTrend = [1200, 1500, 1800, 2100, 1900, 2200, 2400];
  const foodTrend = [800, 1000, 1200, 1400, 1600, 1800, 2000];

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Calculate percentage for progress bars มาดูว่าเป็นไงงงงง
  const getStatusColor = (quantity: number, max: number) => {
    const percent = (quantity / max) * 100;
    if (percent > 70) return '#10b981'; // Green - ปกติ
    if (percent > 30) return '#f59e0b'; // Orange - เฝ้าระวัง
    return '#ef4444'; // Red - น้อย
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Header */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <div>
              <h1 className={styles.topBarTitle}>Sisaket EMS</h1>
              <p className={styles.topBarSubtitle}>STOCK MANAGEMENT</p>
            </div>
          </div>
          <div className={styles.topBarRight}>
            {!isAuthenticated && (
              <Link href="/login" className={styles.topBarButton}>
                <span>🇹🇭</span>
                <span>เข้าหน้าระบบ</span>
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </header>

        {/* Announcement Banner */}
        <AnnouncementBanner />

        {/* Alert Banner */}
        <div className={`${styles.alertBannerNew} ${urgentAlerts > 0 ? styles.alertDanger : styles.alertNormal}`}>
          <div className={styles.alertIconNew}>
            <AlertCircle size={40} />
          </div>
          <div className={styles.alertContentNew}>
            <h2 className={styles.alertTitleNew}>ระดับปกติ</h2>
            <p className={styles.alertTextNew}>
              {loading ? 'กำลังโหลดข้อมูล...' :
                urgentAlerts > 0 ? `มีรายการเร่งด่วน ${urgentAlerts} รายการ` : 'ไม่มีรายการเร่งด่วนในขณะนี้'}
            </p>
            <p className={styles.alertDateNew}>วันที่ปัจจุบัน: {formatDate(lastUpdate)}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsRow}>
          <div className={`${styles.statsCardNew} ${styles.statsCardPurple}`}>
            <div className={styles.statsIconNew}>
              <Building2 size={28} />
            </div>
            <div className={styles.statsContentNew}>
              <h3 className={styles.statsLabelNew}>ศูนย์พักพิงทั้งหมด</h3>
              <div className={styles.statsValueNew}>
                <span className={styles.statsNumberNew}>{loading ? '...' : totalShelters}</span>
                <span className={styles.statsUnitNew}>แห่ง</span>
              </div>
            </div>
          </div>

          <div className={`${styles.statsCardNew} ${styles.statsCardBrown}`}>
            <div className={styles.statsIconNew}>
              <Package2 size={28} />
            </div>
            <div className={styles.statsContentNew}>
              <h3 className={styles.statsLabelNew}>รายการสิ่งของทั้งหมด</h3>
              <div className={styles.statsValueNew}>
                <span className={styles.statsNumberNew}>{loading ? '...' : overview?.totalItems || 0}</span>
                <span className={styles.statsUnitNew}>รายการ</span>
              </div>
            </div>
          </div>

          <div className={`${styles.statsCardNew} ${styles.statsCardRed}`}>
            <div className={styles.statsIconNew}>
              <AlertTriangle size={28} />
            </div>
            <div className={styles.statsContentNew}>
              <h3 className={styles.statsLabelNew}>ศูนย์เฝ้าระวัง</h3>
              <div className={styles.statsValueNew}>
                <span className={styles.statsNumberNew}>{loading ? '...' : urgentAlerts}</span>
                <span className={styles.statsUnitNew}>แห่ง วิกฤต</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className={styles.chartsRow}>
          {/* Resource Summary Chart */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>สรุปทรัพยากรคงเหลือ</h3>

            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#10b981' }}></span>
                ปริมาณ
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#3b82f6' }}></span>
                ไม่เจาะจงทนุระดับ
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#ef4444' }}></span>
                น้อย/เร่งขาดแคลน
              </span>
            </div>

            <div className={styles.barChart}>
              {loading ? (
                <div className={styles.chartLoading}>กำลังโหลดข้อมูล...</div>
              ) : categoryData.length === 0 ? (
                <div className={styles.chartEmpty}>ไม่มีข้อมูล</div>
              ) : (
                categoryData.map((item, index) => (
                  <div key={index} className={styles.barRow}>
                    <div className={styles.barLabel}>{item.name}</div>
                    <div className={styles.barContainer}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${(item.quantity / maxQuantity) * 100}%`,
                          background: getStatusColor(item.quantity, maxQuantity)
                        }}
                      ></div>
                    </div>
                    <div className={styles.barValue}>{item.quantity}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Trend Chart */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>แนวโน้มการใช้ทรัพยากรย้อนหลัง 7 วัน</h3>

            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#3b82f6' }}></span>
                น้ำดื่ม
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#f59e0b' }}></span>
                อาหาร
              </span>
            </div>

            <div className={styles.lineChart}>
              {loading ? (
                <div className={styles.chartLoading}>กำลังโหลดข้อมูล...</div>
              ) : (
                <div className={styles.lineChartContainer}>
                  <svg width="100%" height="200" viewBox="0 0 600 200">
                    {/* Grid lines */}
                    {[0, 1000, 2000, 3000].map((y, i) => (
                      <g key={i}>
                        <line
                          x1="50"
                          y1={180 - (y / 3000) * 160}
                          x2="580"
                          y2={180 - (y / 3000) * 160}
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="1"
                        />
                        <text
                          x="10"
                          y={180 - (y / 3000) * 160 + 5}
                          fill="#94a3b8"
                          fontSize="10"
                        >
                          {y}
                        </text>
                      </g>
                    ))}

                    {/* Water line */}
                    <polyline
                      points={waterTrend.map((val, i) =>
                        `${50 + (i * 80)},${180 - (val / 3000) * 160}`
                      ).join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                    {waterTrend.map((val, i) => (
                      <circle
                        key={i}
                        cx={50 + (i * 80)}
                        cy={180 - (val / 3000) * 160}
                        r="3"
                        fill="#3b82f6"
                      />
                    ))}

                    {/* Food line */}
                    <polyline
                      points={foodTrend.map((val, i) =>
                        `${50 + (i * 80)},${180 - (val / 3000) * 160}`
                      ).join(' ')}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                    />
                    {foodTrend.map((val, i) => (
                      <circle
                        key={i}
                        cx={50 + (i * 80)}
                        cy={180 - (val / 3000) * 160}
                        r="3"
                        fill="#f59e0b"
                      />
                    ))}

                    {/* X-axis labels */}
                    {trendDays.map((day, i) => (
                      <text
                        key={i}
                        x={50 + (i * 80)}
                        y="195"
                        fill="#94a3b8"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {day}
                      </text>
                    ))}
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className={styles.bottomRow}>
          {/* Shortage Section */}
          <div className={styles.shortageCard}>
            <h3 className={styles.sectionTitleNew}>สิ่งของที่ขาดแคลนมากที่สุด</h3>
            {loading ? (
              <div className={styles.emptyMessage}>กำลังโหลดข้อมูล...</div>
            ) : alerts.length === 0 ? (
              <div className={styles.emptyMessage}>ไม่มีรายการขาดแคลนในขณะนี้</div>
            ) : (
              <div className={styles.shortageList}>
                {alerts.slice(0, 4).map((alert, index) => (
                  <div key={index} className={styles.shortageItemNew}>
                    <span className={styles.shortageNameNew}>{alert.itemName}</span>
                    <span className={styles.shortageQuantityNew}>{alert.currentStock} {alert.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shelter Status */}
          <div className={styles.shelterStatusCard}>
            <h3 className={styles.sectionTitleNew}>สถานะศูนย์พักพิง</h3>
            <div className={styles.shelterStatsRow}>
              <div className={`${styles.shelterStatItem} ${styles.shelterNormal}`}>
                <div className={styles.shelterStatIconNew}>
                  <Building2 size={24} />
                </div>
                <div className={styles.shelterStatTextNew}>
                  <span className={styles.shelterStatLabelNew}>ปกติ</span>
                  <span className={styles.shelterStatNumberNew}>{loading ? '...' : activeShelters}</span>
                  <span className={styles.shelterStatUnitNew}>ศูนย์</span>
                </div>
              </div>

              <div className={`${styles.shelterStatItem} ${styles.shelterWarning}`}>
                <div className={styles.shelterStatIconNew}>
                  <AlertTriangle size={24} />
                </div>
                <div className={styles.shelterStatTextNew}>
                  <span className={styles.shelterStatLabelNew}>เฝ้าระวัง</span>
                  <span className={styles.shelterStatNumberNew}>{loading ? '...' : Math.min(urgentAlerts, totalShelters - activeShelters)}</span>
                  <span className={styles.shelterStatUnitNew}>ศูนย์</span>
                </div>
              </div>

              <div className={`${styles.shelterStatItem} ${styles.shelterDanger}`}>
                <div className={styles.shelterStatIconNew}>
                  <AlertCircle size={24} />
                </div>
                <div className={styles.shelterStatTextNew}>
                  <span className={styles.shelterStatLabelNew}>วิกฤติ</span>
                  <span className={styles.shelterStatNumberNew}>{loading ? '...' : 0}</span>
                  <span className={styles.shelterStatUnitNew}>ศูนย์</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
