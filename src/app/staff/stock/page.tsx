'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import MyShelterStock from './components/MyShelterStock';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  BarChart3
} from 'lucide-react';

interface StockStats {
  totalItems: number;
  totalQuantity: number;
  criticalItems: number;
  lowStockItems: number;
  sufficientItems: number;
  byCategory: {
    itemName: string;
    category: string;
    count: number;
    totalQuantity: number;
  }[];
  recentMovements: {
    date: string;
    receives: number;
    dispenses: number;
  }[];
}

export default function StaffStockPage() {
  const { error: showError } = useToast();
  const [stats, setStats] = useState<StockStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/staff/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        showError('ไม่สามารถโหลดสถิติได้');
      }
    } catch (error) {
      console.error(error);
      showError('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
        return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', icon: '🍚' };
      case 'medicine':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', icon: '💊' };
      case 'clothing':
        return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', icon: '👕' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b', icon: '📦' };
    }
  };

  return (
    <DashboardLayout
      title="จัดการสต็อกสินค้า"
      subtitle="ศูนย์พักพิงของคุณ"
    >
      {loading ? (
        <div className="dash-loading">
          <div className="dash-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
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
                <div className="dash-stat-value">{stats?.totalItems || 0}</div>
                <div className="dash-stat-label">ชนิดสินค้าทั้งหมด</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {(stats?.totalQuantity || 0).toLocaleString()} ชิ้น
                </div>
              </div>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-icon dash-stat-icon-success">
                <TrendingUp size={24} />
              </div>
              <div className="dash-stat-content">
                <div className="dash-stat-value">{stats?.sufficientItems || 0}</div>
                <div className="dash-stat-label">สินค้าเพียงพอ</div>
              </div>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-icon dash-stat-icon-warning">
                <TrendingDown size={24} />
              </div>
              <div className="dash-stat-content">
                <div className="dash-stat-value">{stats?.lowStockItems || 0}</div>
                <div className="dash-stat-label">สินค้าใกล้หมด</div>
              </div>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-icon dash-stat-icon-danger">
                <AlertTriangle size={24} />
              </div>
              <div className="dash-stat-content">
                <div className="dash-stat-value">{stats?.criticalItems || 0}</div>
                <div className="dash-stat-label">สินค้าวิกฤต</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Category Distribution - Bar Chart */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3 className="dash-card-title">
                  <BarChart3 size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                  สินค้ายอดนิยม (Top 10)
                </h3>
              </div>
              <div className="dash-card-body">
                {stats?.byCategory && stats.byCategory.length > 0 ? (
                  <div style={{ padding: '1rem 0' }}>
                    {/* Bar Chart */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-around',
                      height: '200px',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid rgba(100, 116, 139, 0.2)',
                      overflowX: 'auto'
                    }}>
                      {stats.byCategory.map((item) => {
                        const style = getCategoryColor(item.category);
                        const maxQuantity = Math.max(...stats.byCategory.map(c => c.totalQuantity));
                        const heightPercent = (item.totalQuantity / maxQuantity) * 100;

                        return (
                          <div
                            key={item.itemName}
                            style={{
                              minWidth: '60px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            {/* Value on top */}
                            <div style={{
                              fontSize: '1.125rem',
                              fontWeight: 700,
                              color: style.color,
                              textAlign: 'center'
                            }}>
                              {item.totalQuantity}
                            </div>

                            {/* Bar */}
                            <div style={{
                              width: '100%',
                              maxWidth: '50px',
                              height: `${heightPercent}%`,
                              background: `linear-gradient(180deg, ${style.color}, ${style.color}cc)`,
                              borderRadius: '8px 8px 0 0',
                              minHeight: '20px',
                              transition: 'all 0.6s ease',
                              boxShadow: `0 -4px 12px ${style.color}40`
                            }}></div>

                            {/* Label */}
                            <div style={{
                              textAlign: 'center',
                              fontSize: '0.75rem',
                              color: '#cbd5e1',
                              whiteSpace: 'nowrap',
                              maxWidth: '80px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              <div>{style.icon}</div>
                              <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }} title={item.itemName}>
                                {item.itemName.length > 10 ? item.itemName.substring(0, 10) + '...' : item.itemName}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '2rem',
                      fontSize: '0.8125rem',
                      color: '#94a3b8',
                      marginTop: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '2px' }}></div>
                        จำนวนชิ้น
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    <Package size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p>ยังไม่มีข้อมูล</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity - Bar Chart */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3 className="dash-card-title">
                  <Activity size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                  กิจกรรมล่าสุด (7 วัน)
                </h3>
              </div>
              <div className="dash-card-body">
                {stats?.recentMovements && stats.recentMovements.length > 0 ? (
                  <div style={{ padding: '1rem 0' }}>
                    {/* Bar Chart */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-around',
                      height: '200px',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid rgba(100, 116, 139, 0.2)'
                    }}>
                      {stats.recentMovements.slice(0, 7).map((movement) => {
                        const maxValue = Math.max(
                          ...stats.recentMovements.map(m => Math.max(m.receives, m.dispenses))
                        );
                        const receiveHeight = maxValue > 0 ? (movement.receives / maxValue) * 100 : 0;
                        const dispenseHeight = maxValue > 0 ? (movement.dispenses / maxValue) * 100 : 0;

                        return (
                          <div
                            key={movement.date}
                            style={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            {/* Bars side by side */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'flex-end',
                              gap: '4px',
                              height: '100%'
                            }}>
                              {/* Receive bar */}
                              <div style={{
                                width: '20px',
                                height: `${receiveHeight}%`,
                                background: 'linear-gradient(180deg, #22c55e, #16a34a)',
                                borderRadius: '4px 4px 0 0',
                                minHeight: movement.receives > 0 ? '10px' : '0',
                                position: 'relative',
                                transition: 'all 0.6s ease',
                                boxShadow: '0 -2px 8px rgba(34, 197, 94, 0.3)'
                              }}>
                                {movement.receives > 0 && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: '#22c55e',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {movement.receives}
                                  </div>
                                )}
                              </div>

                              {/* Dispense bar */}
                              <div style={{
                                width: '20px',
                                height: `${dispenseHeight}%`,
                                background: 'linear-gradient(180deg, #ef4444, #dc2626)',
                                borderRadius: '4px 4px 0 0',
                                minHeight: movement.dispenses > 0 ? '10px' : '0',
                                position: 'relative',
                                transition: 'all 0.6s ease',
                                boxShadow: '0 -2px 8px rgba(239, 68, 68, 0.3)'
                              }}>
                                {movement.dispenses > 0 && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: '#ef4444',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {movement.dispenses}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Date label */}
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#94a3b8',
                              textAlign: 'center',
                              whiteSpace: 'nowrap'
                            }}>
                              {new Date(movement.date).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '2rem',
                      fontSize: '0.8125rem',
                      color: '#94a3b8',
                      marginTop: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '2px' }}></div>
                        รับเข้า
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></div>
                        จ่ายออก
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    <Activity size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p>ยังไม่มีกิจกรรม</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stock List */}
          <MyShelterStock />
        </>
      )}
    </DashboardLayout>
  );
}