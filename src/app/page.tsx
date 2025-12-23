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
    crisis: number;
    warning: number;
  };
  byCategory: {
    water: { items: number; quantity: number; status?: 'sufficient' | 'low' | 'critical' };
    food: { items: number; quantity: number; status?: 'sufficient' | 'low' | 'critical' };
    medicine: { items: number; quantity: number; status?: 'sufficient' | 'low' | 'critical' };
    bedding: { items: number; quantity: number; status?: 'sufficient' | 'low' | 'critical' };
    clothing: { items: number; quantity: number; status?: 'sufficient' | 'low' | 'critical' };
    other: { items: number; quantity: number; status?: 'sufficient' | 'low' | 'critical' };
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
  const [trends, setTrends] = useState<{ labels: string[], data: any }>({ labels: [], data: {} });
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

        // Fetch trends
        const trendsRes = await fetch('/api/stock/public/trends');
        if (trendsRes.ok) {
          const data = await trendsRes.json();
          setTrends(data);
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


  // ฟังก์ชันกำหนดสีตามสถานะวิกฤติ
  // เกณฑ์: แดง (< 50), ส้ม (< 200), เขียว (>= 200)
  const getColorByStatus = (status?: 'sufficient' | 'low' | 'critical'): string => {
    if (status === 'critical') return '#ef4444'; // แดง - วิกฤติ (< 50)
    if (status === 'low') return '#f59e0b'; // ส้ม - เฝ้าระวัง (< 200)
    return '#10b981'; // เขียว - ปกติ (>= 200)
  };

  // Category data for chart - แยกข้อมูลน้ำดื่มและอาหารจากฐานข้อมูลจริง พร้อมสีตามระดับวิกฤติ
  const categoryData = [
    {
      name: 'น้ำดื่ม',
      category: 'water',
      quantity: overview?.byCategory?.water?.quantity || 0,
      status: overview?.byCategory?.water?.status,
      color: getColorByStatus(overview?.byCategory?.water?.status)
    },
    {
      name: 'อาหาร',
      category: 'food',
      quantity: overview?.byCategory?.food?.quantity || 0,
      status: overview?.byCategory?.food?.status,
      color: getColorByStatus(overview?.byCategory?.food?.status)
    },
    {
      name: 'ยา',
      category: 'medicine',
      quantity: overview?.byCategory?.medicine?.quantity || 0,
      status: overview?.byCategory?.medicine?.status,
      color: getColorByStatus(overview?.byCategory?.medicine?.status)
    },
    {
      name: 'ที่นอน',
      category: 'bedding',
      quantity: overview?.byCategory?.bedding?.quantity || 0,
      status: overview?.byCategory?.bedding?.status,
      color: getColorByStatus(overview?.byCategory?.bedding?.status)
    },
  ];

  // Calculate max for chart scale
  const maxQuantity = Math.max(...categoryData.map(d => d.quantity), 1);

  // Trend data from API
  const trendDays = trends.labels.length > 0 ? trends.labels : ['...', '...', '...', '...', '...', '...', '...'];
  const waterTrend = trends.data.water || [0, 0, 0, 0, 0, 0, 0];
  const foodTrend = trends.data.food || [0, 0, 0, 0, 0, 0, 0];
  const medicineTrend = trends.data.medicine || [0, 0, 0, 0, 0, 0, 0];
  const beddingTrend = trends.data.bedding || [0, 0, 0, 0, 0, 0, 0];

  // Calculate max for trend chart scale
  const allTrendValues = [...waterTrend, ...foodTrend, ...medicineTrend, ...beddingTrend];
  const maxTrendValue = Math.max(...allTrendValues, 100); // Minimum 100 for scale
  const chartScale = Math.ceil(maxTrendValue / 100) * 100;
  const gridSteps = [0, chartScale * 0.25, chartScale * 0.5, chartScale * 0.75, chartScale].map(v => Math.round(v));

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
        {(() => {
          const hasCritical = categoryData.some(c => c.status === 'critical');
          const hasLow = categoryData.some(c => c.status === 'low');

          let bannerClass = styles.alertSuccess;
          let bannerTitle = 'ระดับปกติ';
          let bannerText = 'ทรัพยากรส่วนใหญ่อยู่ในระดับปกติ';

          if (hasCritical) {
            bannerClass = styles.alertDanger;
            bannerTitle = 'ระดับวิกฤติ';
            bannerText = 'มีทรัพยากรบางรายการอยู่ในระดับวิกฤติ (น้อยกว่า 50) โปรดตรวจสอบด่วน';
          } else if (hasLow) {
            bannerClass = styles.alertNormal;
            bannerTitle = 'ระดับเฝ้าระวัง';
            bannerText = 'มีทรัพยากรบางรายการเริ่มขาดแคลน (น้อยกว่า 200) โปรดเตรียมการเติมสต็อก';
          }

          if (loading) {
            bannerText = 'กำลังโหลดข้อมูลล่าสุด...';
          }

          return (
            <div className={`${styles.alertBannerNew} ${bannerClass}`}>
              <div className={styles.alertIconNew}>
                <AlertCircle size={40} />
              </div>
              <div className={styles.alertContentNew}>
                <h2 className={styles.alertTitleNew}>{bannerTitle}</h2>
                <p className={styles.alertTextNew}>{bannerText}</p>
                <p className={styles.alertDateNew}>ข้อมูลล่าสุด ณ วันที่: {formatDate(lastUpdate)}</p>
              </div>
            </div>
          );
        })()}

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
              <h3 className={styles.statsLabelNew}>ศูนย์วิกฤติ (ต้องช่วยด่วน)</h3>
              <div className={styles.statsValueNew}>
                <span className={styles.statsNumberNew}>{loading ? '...' : overview?.shelters?.crisis || 0}</span>
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
                          background: item.color
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

            <div className={styles.lineChart}>
              {loading ? (
                <div className={styles.chartLoading}>กำลังโหลดข้อมูล...</div>
              ) : (
                <div className={styles.lineChartContainer}>
                  <svg width="100%" height="200" viewBox="0 0 600 200">
                    {/* Grid lines */}
                    {gridSteps.map((y: number, i: number) => (
                      <g key={i}>
                        <line
                          x1="50"
                          y1={180 - (y / chartScale) * 160}
                          x2="580"
                          y2={180 - (y / chartScale) * 160}
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="1"
                        />
                        <text
                          x="10"
                          y={180 - (y / chartScale) * 160 + 5}
                          fill="#94a3b8"
                          fontSize="10"
                        >
                          {y}
                        </text>
                      </g>
                    ))}

                    {/* Water line */}
                    <polyline
                      points={waterTrend.map((val: number, i: number) =>
                        `${50 + (i * 80)},${180 - (val / chartScale) * 160}`
                      ).join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                    {waterTrend.map((val: number, i: number) => (
                      <circle
                        key={i}
                        cx={50 + (i * 80)}
                        cy={180 - (val / chartScale) * 160}
                        r="3"
                        fill="#3b82f6"
                      />
                    ))}

                    {/* Food line */}
                    <polyline
                      points={foodTrend.map((val: number, i: number) =>
                        `${50 + (i * 80)},${180 - (val / chartScale) * 160}`
                      ).join(' ')}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                    />
                    {foodTrend.map((val: number, i: number) => (
                      <circle
                        key={i}
                        cx={50 + (i * 80)}
                        cy={180 - (val / chartScale) * 160}
                        r="3"
                        fill="#f59e0b"
                      />
                    ))}

                    {/* Medicine line */}
                    <polyline
                      points={medicineTrend.map((val: number, i: number) =>
                        `${50 + (i * 80)},${180 - (val / chartScale) * 160}`
                      ).join(' ')}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                    />
                    {medicineTrend.map((val: number, i: number) => (
                      <circle
                        key={i}
                        cx={50 + (i * 80)}
                        cy={180 - (val / chartScale) * 160}
                        r="3"
                        fill="#ef4444"
                      />
                    ))}

                    {/* Bedding line */}
                    <polyline
                      points={beddingTrend.map((val: number, i: number) =>
                        `${50 + (i * 80)},${180 - (val / chartScale) * 160}`
                      ).join(' ')}
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2"
                    />
                    {beddingTrend.map((val: number, i: number) => (
                      <circle
                        key={i}
                        cx={50 + (i * 80)}
                        cy={180 - (val / chartScale) * 160}
                        r="3"
                        fill="#a855f7"
                      />
                    ))}

                    {/* X-axis labels */}
                    {trendDays.map((day: string, i: number) => (
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
              {/* Legend */}
              <div className={styles.chartLegend}>
                <div className={styles.legendItem}><span style={{ background: '#3b82f6' }}></span>น้ำดื่ม</div>
                <div className={styles.legendItem}><span style={{ background: '#f59e0b' }}></span>อาหาร</div>
                <div className={styles.legendItem}><span style={{ background: '#ef4444' }}></span>ยา/เวชภัณฑ์</div>
                <div className={styles.legendItem}><span style={{ background: '#a855f7' }}></span>เครื่องนอน</div>
              </div>
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
                {alerts.slice(0, 6).map((alert, index) => (
                  <div key={index} className={styles.shortageItemNew}>
                    <div className={styles.shortageItemLeft}>
                      <span
                        className={styles.statusDot}
                        style={{ background: alert.status === 'critical' ? '#ef4444' : '#f59e0b' }}
                      ></span>
                      <span className={styles.shortageNameNew}>{alert.itemName}</span>
                    </div>
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
                  <span className={styles.shelterStatNumberNew}>{loading ? '...' : overview?.shelters?.warning || 0}</span>
                  <span className={styles.shelterStatUnitNew}>ศูนย์</span>
                </div>
              </div>

              <div className={`${styles.shelterStatItem} ${styles.shelterDanger}`}>
                <div className={styles.shelterStatIconNew}>
                  <AlertCircle size={24} />
                </div>
                <div className={styles.shelterStatTextNew}>
                  <span className={styles.shelterStatLabelNew}>วิกฤติ</span>
                  <span className={styles.shelterStatNumberNew}>{loading ? '...' : overview?.shelters?.crisis || 0}</span>
                  <span className={styles.shelterStatUnitNew}>ศูนย์</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main >
    </div >
  );
}
