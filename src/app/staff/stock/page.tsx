'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Package,
  AlertTriangle,
  Activity,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

interface StockStats {
  shelterName: string;
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
    receivesQty: number;
    transfersFromProvincial: number;
    transfersFromProvincialQty: number;
    dispenses: number;
    dispensesQty: number;
  }[];
}

export default function StaffStockDashboard() {
  const { error: showError } = useToast();
  const [stats, setStats] = useState<StockStats | null>(null);
  const [loading, setLoading] = useState(true);


  const fetchStats = useCallback(async () => {
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
    } catch (err) {
      console.error(err);
      showError('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      void fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <DashboardLayout title="แดชบอร์ด" subtitle="โหลดข้อมูล...">
        <div className="dash-loading">
          <div className="dash-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalMovements = stats?.recentMovements.reduce((sum, m) => sum + m.receives + m.dispenses, 0) || 0;
  const totalReceives = stats?.recentMovements.reduce((sum, m) => sum + m.receives, 0) || 0;
  const totalDispenses = stats?.recentMovements.reduce((sum, m) => sum + m.dispenses, 0) || 0;

  return (
    <DashboardLayout
      title="สต็อกข้อมูล"
      subtitle={stats?.shelterName ? `ศูนย์พักพิง: ${stats.shelterName}` : "ศูนย์พักพิงของคุณ"}
    >
      {/* Main Grid Layout */}
      <div className="dash-grid dash-grid-4">

        {/* Row 1: Summary Stats (4 cards) */}
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-primary">
            <Package size={24} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">{stats?.totalItems || 0}</div>
            <div className="dash-stat-label">ชนิดสินค้า</div>
            <div className="dash-text-muted" style={{ marginTop: '0.25rem' }}>
              {(stats?.totalQuantity || 0).toLocaleString()} ชิ้น
            </div>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-success">
            <CheckCircle2 size={24} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">{stats?.sufficientItems || 0}</div>
            <div className="dash-stat-label">สินค้าปกติ</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--dash-success)' }}>เพียงพอ</div>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-warning">
            <AlertTriangle size={24} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">{stats?.lowStockItems || 0}</div>
            <div className="dash-stat-label">สินค้าใกล้หมด</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--dash-warning)' }}>ต้องเติม</div>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-danger">
            <XCircle size={24} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">{stats?.criticalItems || 0}</div>
            <div className="dash-stat-label">สินค้าวิกฤต</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--dash-danger)' }}>ด่วน!</div>
          </div>
        </div>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginTop: '1.5rem' }}>
        {/* Row 2: Donut Chart + Activity Chart */}
        {/* Stock Status Donut Chart */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">
              <Package size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              สถานะสต็อก
            </h3>
          </div>
          <div className="dash-card-body">
            {(() => {
              const total = (stats?.sufficientItems || 0) + (stats?.lowStockItems || 0) + (stats?.criticalItems || 0);
              const sufficientPercent = total > 0 ? ((stats?.sufficientItems || 0) / total) * 100 : 0;
              const lowPercent = total > 0 ? ((stats?.lowStockItems || 0) / total) * 100 : 0;
              const criticalPercent = total > 0 ? ((stats?.criticalItems || 0) / total) * 100 : 0;

              const size = 200;
              const strokeWidth = 30;
              const radius = (size - strokeWidth) / 2;
              const circumference = 2 * Math.PI * radius;

              const sufficientDash = (sufficientPercent / 100) * circumference;
              const lowDash = (lowPercent / 100) * circumference;
              const criticalDash = (criticalPercent / 100) * circumference;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
                  <div style={{ position: 'relative', width: size, height: size, marginBottom: '1.5rem' }}>
                    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(30, 41, 59, 0.5)"
                        strokeWidth={strokeWidth}
                      />
                      {sufficientPercent > 0 && (
                        <circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          fill="none"
                          stroke="var(--dash-success)"
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${sufficientDash} ${circumference}`}
                          strokeDashoffset={0}
                          strokeLinecap="round"
                        />
                      )}
                      {lowPercent > 0 && (
                        <circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          fill="none"
                          stroke="var(--dash-warning)"
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${lowDash} ${circumference}`}
                          strokeDashoffset={-sufficientDash}
                          strokeLinecap="round"
                        />
                      )}
                      {criticalPercent > 0 && (
                        <circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          fill="none"
                          stroke="var(--dash-danger)"
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${criticalDash} ${circumference}`}
                          strokeDashoffset={-(sufficientDash + lowDash)}
                          strokeLinecap="round"
                        />
                      )}
                    </svg>

                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center'
                    }}>
                      <div className="dash-stat-value" style={{ fontSize: '2rem' }}>{total}</div>
                      <div className="dash-text-muted" style={{ fontSize: '0.75rem' }}>สินค้าทั้งหมด</div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--dash-success)' }}></div>
                        <span className="dash-text-secondary" style={{ fontSize: '0.875rem' }}>สินค้าปกติ</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--dash-success)' }}>{stats?.sufficientItems || 0}</span>
                        <span className="dash-text-muted" style={{ fontSize: '0.75rem' }}>({sufficientPercent.toFixed(1)}%)</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--dash-warning)' }}></div>
                        <span className="dash-text-secondary" style={{ fontSize: '0.875rem' }}>สินค้าใกล้หมด</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--dash-warning)' }}>{stats?.lowStockItems || 0}</span>
                        <span className="dash-text-muted" style={{ fontSize: '0.75rem' }}>({lowPercent.toFixed(1)}%)</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--dash-danger)' }}></div>
                        <span className="dash-text-secondary" style={{ fontSize: '0.875rem' }}>สินค้าวิกฤต</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--dash-danger)' }}>{stats?.criticalItems || 0}</span>
                        <span className="dash-text-muted" style={{ fontSize: '0.75rem' }}>({criticalPercent.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Activity Chart */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">
              <Activity size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              กิจกรรมสต็อก 7 วันล่าสุด
            </h3>
          </div>
          <div className="dash-card-body">
            {stats?.recentMovements && stats.recentMovements.length > 0 ? (
              <div style={{ padding: '1rem 0' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-evenly',
                  height: '240px',
                  gap: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '2px solid var(--dash-border)',
                  overflowX: 'auto'
                }}>
                  {stats?.recentMovements.slice(0, 7).map((movement) => {
                    const maxValue = Math.max(
                      ...stats.recentMovements.map(m => Math.max(m.receives, m.transfersFromProvincial, m.dispenses))
                    );
                    const receiveHeight = maxValue > 0 ? (movement.receives / maxValue) * 100 : 0;
                    const transferHeight = maxValue > 0 ? (movement.transfersFromProvincial / maxValue) * 100 : 0;
                    const dispenseHeight = maxValue > 0 ? (movement.dispenses / maxValue) * 100 : 0;

                    return (
                      <div key={movement.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: '80px', flex: 1, height: '100%' }}>
                        <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4px', height: '100%' }}>
                          <div style={{ flex: 1, maxWidth: '20px', height: `${receiveHeight}%`, background: 'var(--dash-success)', borderRadius: '4px 4px 0 0', minHeight: movement.receives > 0 ? '10px' : '2px', opacity: movement.receives > 0 ? 1 : 0.2 }} title={`รับเข้า: ${movement.receivesQty}`}></div>
                          <div style={{ flex: 1, maxWidth: '20px', height: `${transferHeight}%`, background: 'var(--dash-primary)', borderRadius: '4px 4px 0 0', minHeight: movement.transfersFromProvincial > 0 ? '10px' : '2px', opacity: movement.transfersFromProvincial > 0 ? 1 : 0.2 }} title={`รับโอน: ${movement.transfersFromProvincialQty}`}></div>
                          <div style={{ flex: 1, maxWidth: '20px', height: `${dispenseHeight}%`, background: 'var(--dash-warning)', borderRadius: '4px 4px 0 0', minHeight: movement.dispenses > 0 ? '10px' : '2px', opacity: movement.dispenses > 0 ? 1 : 0.2 }} title={`เบิกออก: ${movement.dispensesQty}`}></div>
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--dash-text-muted)', textAlign: 'center' }}>
                          {new Date(movement.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--dash-success)' }}></div>
                    <span className="dash-text-muted" style={{ fontSize: '0.75rem' }}>รับเข้า</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--dash-primary)' }}></div>
                    <span className="dash-text-muted" style={{ fontSize: '0.75rem' }}>รับโอน</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--dash-warning)' }}></div>
                    <span className="dash-text-muted" style={{ fontSize: '0.75rem' }}>เบิกออก</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dash-text-muted)' }}>
                <Activity size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>ยังไม่มีกิจกรรมในสัปดาห์นี้</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginTop: '1.5rem' }}>
        {/* Row 3: Category Distribution + Quick Summary */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">
              <Package size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              สัดส่วนตามประเภท
            </h3>
          </div>
          <div className="dash-card-body">
            {(() => {
              const categoryTotals = new Map<string, number>();
              stats?.byCategory.forEach(item => {
                const current = categoryTotals.get(item.category) || 0;
                categoryTotals.set(item.category, current + item.totalQuantity);
              });

              const categories = Array.from(categoryTotals.entries()).map(([name, quantity]) => ({ name, quantity }));
              const totalItems = categories.reduce((sum, cat) => sum + cat.quantity, 0);

              const categoryColors: { [key: string]: string } = {
                'food': 'var(--dash-success)',
                'medicine': 'var(--dash-danger)',
                'clothing': 'var(--dash-primary)',
                'shelter': 'var(--dash-warning)',
                'hygiene': '#8b5cf6',
                'education': '#ec4899',
                'tool': '#14b8a6',
                'electronic': '#f97316',
                'other': 'var(--dash-text-muted)'
              };

              const getCategoryIcon = (category: string) => {
                const icons: { [key: string]: string } = {
                  'food': '🍚', 'medicine': '💊', 'clothing': '👕',
                  'shelter': '🏠', 'hygiene': '🧼', 'education': '📚',
                  'tool': '🔧', 'electronic': '💻', 'other': '📦'
                };
                return icons[category.toLowerCase()] || '📦';
              };

              const size = 200;
              const strokeWidth = 30;
              const radius = (size - strokeWidth) / 2;
              const circumference = 2 * Math.PI * radius;

              let currentOffset = 0;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
                  <div style={{ position: 'relative', width: size, height: size, marginBottom: '1.5rem' }}>
                    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(30, 41, 59, 0.5)" strokeWidth={strokeWidth} />
                      {categories.map((cat) => {
                        const percent = totalItems > 0 ? (cat.quantity / totalItems) * 100 : 0;
                        const dashLen = (percent / 100) * circumference;
                        const offset = currentOffset;
                        currentOffset -= dashLen;
                        return percent > 0 ? (
                          <circle
                            key={cat.name}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={categoryColors[cat.name.toLowerCase()] || '#64748b'}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${dashLen} ${circumference}`}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                          />
                        ) : null;
                      })}
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                      <div className="dash-stat-value" style={{ fontSize: '1.5rem' }}>{categories.length}</div>
                      <div className="dash-text-muted" style={{ fontSize: '0.75rem' }}>หมวดหมู่</div>
                    </div>
                  </div>
                  <div style={{ width: '100%', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {categories.map(cat => (
                      <div key={cat.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{getCategoryIcon(cat.name)}</span>
                          <span className="dash-text-secondary" style={{ fontSize: '0.875rem' }}>{cat.name}</span>
                        </div>
                        <span style={{ fontWeight: 600, color: categoryColors[cat.name.toLowerCase()] || '#64748b' }}>{cat.quantity.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Quick Summary Card */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">
              <Clock size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              สรุป 7 วัน
            </h3>
          </div>
          <div className="dash-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div className="dash-text-muted" style={{ marginBottom: '0.5rem' }}>กิจกรรมทั้งหมด</div>
                <div className="dash-stat-value">{totalMovements}</div>
                <div className="dash-text-muted">รายการกระทำ</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--dash-success)' }}>รับเข้า ({totalReceives})</span>
                    <span className="dash-text-muted">{totalMovements > 0 ? Math.round((totalReceives / totalMovements) * 100) : 0}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--dash-border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${totalMovements > 0 ? (totalReceives / totalMovements) * 100 : 0}%`, height: '100%', background: 'var(--dash-success)' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--dash-warning)' }}>เบิกออก ({totalDispenses})</span>
                    <span className="dash-text-muted">{totalMovements > 0 ? Math.round((totalDispenses / totalMovements) * 100) : 0}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--dash-border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${totalMovements > 0 ? (totalDispenses / totalMovements) * 100 : 0}%`, height: '100%', background: 'var(--dash-warning)' }}></div>
                  </div>
                </div>
              </div>

              <div className="dash-badge dash-badge-info" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
                {totalReceives >= totalDispenses ? '📈 สต็อกมีแนวโน้มเพิ่มขึ้น' : '📉 สต็อกมีแนวโน้มลดลง'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Items List */}
      <div className="dash-card" style={{ marginTop: '1.5rem' }}>
        <div className="dash-card-header">
          <h3 className="dash-card-title">📦 รายการสินค้า 10 ลำดับแรก</h3>
        </div>
        <div className="dash-card-body">
          <div className="dash-grid dash-grid-auto">
            {stats?.byCategory.slice(0, 10).map((item, idx) => (
              <div key={idx} style={{ padding: '1rem', border: '1px solid var(--dash-border)', borderRadius: 'var(--dash-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="dash-text-muted" style={{ fontSize: '0.75rem' }}>{item.category}</div>
                  <div style={{ fontWeight: 600 }}>{item.itemName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dash-primary)' }}>{item.totalQuantity.toLocaleString()}</div>
                  <div className="dash-text-muted" style={{ fontSize: '0.75rem' }}>คงเหลือ</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}