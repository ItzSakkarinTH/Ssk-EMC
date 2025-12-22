'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Package,
  TrendingUp,
  TrendingDown,
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
      title="📊 แดชบอร์ด"
      subtitle={stats?.shelterName ? `ศูนย์พักพิง: ${stats.shelterName}` : "ศูนย์พักพิงของคุณ"}
    >
      {/* Main Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '1.5rem'
      }}>

        {/* Row 1: Summary Stats (4 cards) */}
        <div className="dash-stat-card" style={{ gridColumn: 'span 3' }}>
          <div className="dash-stat-icon dash-stat-icon-primary">
            <Package size={24} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">{stats?.totalItems || 0}</div>
            <div className="dash-stat-label">ชนิดสินค้า</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              {(stats?.totalQuantity || 0).toLocaleString()} ชิ้น
            </div>
          </div>
        </div>

        <div className="dash-stat-card" style={{ gridColumn: 'span 3' }}>
          <div className="dash-stat-icon dash-stat-icon-success">
            <CheckCircle2 size={24} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">{stats?.sufficientItems || 0}</div>
            <div className="dash-stat-label">สินค้าปกติ</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>เพียงพอ</div>
          </div>
        </div>

        <div className="dash-stat-card" style={{ gridColumn: 'span 3' }}>
          <div className="dash-stat-icon dash-stat-icon-warning">
            <AlertTriangle size={24} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">{stats?.lowStockItems || 0}</div>
            <div className="dash-stat-label">สินค้าใกล้หมด</div>
            <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>ต้องเติม</div>
          </div>
        </div>

        <div className="dash-stat-card" style={{ gridColumn: 'span 3' }}>
          <div className="dash-stat-icon dash-stat-icon-danger">
            <XCircle size={24} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">{stats?.criticalItems || 0}</div>
            <div className="dash-stat-label">สินค้าวิกฤต</div>
            <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>ด่วน!</div>
          </div>
        </div>

        {/* Row 2: Donut Chart (4 cols) + Activity Chart (8 cols) */}
        {/* Stock Status Donut Chart */}
        <div className="dash-card" style={{ gridColumn: 'span 4' }}>
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

              // SVG Circle calculations
              const size = 200;
              const strokeWidth = 30;
              const radius = (size - strokeWidth) / 2;
              const circumference = 2 * Math.PI * radius;

              // Calculate dash arrays
              const sufficientDash = (sufficientPercent / 100) * circumference;
              const lowDash = (lowPercent / 100) * circumference;
              const criticalDash = (criticalPercent / 100) * circumference;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
                  {/* Donut Chart SVG */}
                  <div style={{ position: 'relative', width: size, height: size, marginBottom: '1.5rem' }}>
                    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                      {/* Background circle */}
                      <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(30, 41, 59, 0.5)"
                        strokeWidth={strokeWidth}
                      />

                      {/* Sufficient (Green) */}
                      {sufficientPercent > 0 && (
                        <circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${sufficientDash} ${circumference}`}
                          strokeDashoffset={0}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 0.6s ease' }}
                        />
                      )}

                      {/* Low Stock (Orange) */}
                      {lowPercent > 0 && (
                        <circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${lowDash} ${circumference}`}
                          strokeDashoffset={-sufficientDash}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
                        />
                      )}

                      {/* Critical (Red) */}
                      {criticalPercent > 0 && (
                        <circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${criticalDash} ${circumference}`}
                          strokeDashoffset={-(sufficientDash + lowDash)}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
                        />
                      )}
                    </svg>

                    {/* Center Text */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f1f5f9' }}>
                        {total}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        สินค้าทั้งหมด
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '2px',
                          background: '#10b981'
                        }}></div>
                        <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>สินค้าปกติ</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10b981' }}>
                          {stats?.sufficientItems || 0}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          ({sufficientPercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '2px',
                          background: '#f59e0b'
                        }}></div>
                        <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>สินค้าใกล้หมด</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f59e0b' }}>
                          {stats?.lowStockItems || 0}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          ({lowPercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '2px',
                          background: '#ef4444'
                        }}></div>
                        <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>สินค้าวิกฤต</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ef4444' }}>
                          {stats?.criticalItems || 0}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          ({criticalPercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Activity Chart */}
        <div className="dash-card" style={{ gridColumn: 'span 8' }}>
          <div className="dash-card-header">
            <h3 className="dash-card-title">
              <Activity size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              กิจกรรมสต็อก 7 วันล่าสุด
            </h3>
          </div>
          <div className="dash-card-body">
            {stats?.recentMovements && stats.recentMovements.length > 0 ? (
              <div style={{ padding: '1.5rem 0' }}>
                {/* Grouped Bar Chart */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-evenly',
                  height: '260px',
                  gap: '1.5rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '2px solid rgba(100, 116, 139, 0.2)'
                }}>
                  {stats?.recentMovements.slice(0, 7).map((movement) => {
                    const maxValue = Math.max(
                      ...stats.recentMovements.map(m => Math.max(m.receives, m.transfersFromProvincial, m.dispenses))
                    );
                    const receiveHeight = maxValue > 0 ? (movement.receives / maxValue) * 100 : 0;
                    const transferHeight = maxValue > 0 ? (movement.transfersFromProvincial / maxValue) * 100 : 0;
                    const dispenseHeight = maxValue > 0 ? (movement.dispenses / maxValue) * 100 : 0;

                    return (
                      <div
                        key={movement.date}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.75rem',
                          minWidth: '100px',
                          flex: 1
                        }}
                      >
                        <div style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                          gap: '6px',
                          height: '100%',
                          padding: '0 8px'
                        }}>
                          {/* Receive Bar (สีเขียว) */}
                          <div style={{
                            flex: 1,
                            maxWidth: '28px',
                            height: `${receiveHeight}%`,
                            background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                            borderRadius: '6px 6px 0 0',
                            minHeight: movement.receives > 0 ? '15px' : '2px',
                            position: 'relative',
                            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: movement.receives > 0
                              ? '0 -4px 16px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                              : 'none',
                            opacity: movement.receives > 0 ? 1 : 0.3
                          }}
                            title={`รับเข้า: ${movement.receives} ครั้ง (${movement.receivesQty} ชิ้น)`}
                          >
                            {movement.receives > 0 && (
                              <div style={{
                                position: 'absolute',
                                top: '-26px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: '#10b981',
                                whiteSpace: 'nowrap',
                                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '2px 4px',
                                borderRadius: '4px'
                              }}>
                                {movement.receivesQty}
                              </div>
                            )}
                          </div>

                          {/* Transfer from Provincial Bar (สีฟ้า) */}
                          <div style={{
                            flex: 1,
                            maxWidth: '28px',
                            height: `${transferHeight}%`,
                            background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                            borderRadius: '6px 6px 0 0',
                            minHeight: movement.transfersFromProvincial > 0 ? '15px' : '2px',
                            position: 'relative',
                            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: movement.transfersFromProvincial > 0
                              ? '0 -4px 16px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                              : 'none',
                            opacity: movement.transfersFromProvincial > 0 ? 1 : 0.3
                          }}
                            title={`รับโอนจากกองกลาง: ${movement.transfersFromProvincial} ครั้ง (${movement.transfersFromProvincialQty} ชิ้น)`}
                          >
                            {movement.transfersFromProvincial > 0 && (
                              <div style={{
                                position: 'absolute',
                                top: '-26px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: '#3b82f6',
                                whiteSpace: 'nowrap',
                                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                background: 'rgba(59, 130, 246, 0.1)',
                                padding: '2px 4px',
                                borderRadius: '4px'
                              }}>
                                {movement.transfersFromProvincialQty}
                              </div>
                            )}
                          </div>

                          {/* Dispense Bar (สีส้ม) */}
                          <div style={{
                            flex: 1,
                            maxWidth: '28px',
                            height: `${dispenseHeight}%`,
                            background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)',
                            borderRadius: '6px 6px 0 0',
                            minHeight: movement.dispenses > 0 ? '15px' : '2px',
                            position: 'relative',
                            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: movement.dispenses > 0
                              ? '0 -4px 16px rgba(249, 115, 22, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                              : 'none',
                            opacity: movement.dispenses > 0 ? 1 : 0.3
                          }}
                            title={`เบิกออก: ${movement.dispenses} ครั้ง (${movement.dispensesQty} ชิ้น)`}
                          >
                            {movement.dispenses > 0 && (
                              <div style={{
                                position: 'absolute',
                                top: '-26px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: '#f97316',
                                whiteSpace: 'nowrap',
                                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                background: 'rgba(249, 115, 22, 0.1)',
                                padding: '2px 4px',
                                borderRadius: '4px'
                              }}>
                                {movement.dispensesQty}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Date and Info */}
                        <div style={{
                          textAlign: 'center',
                          width: '100%'
                        }}>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#cbd5e1',
                            whiteSpace: 'nowrap',
                            marginBottom: '0.375rem'
                          }}>
                            {new Date(movement.date).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </div>

                          {(movement.receives > 0 || movement.transfersFromProvincial > 0 || movement.dispenses > 0) && (
                            <div style={{
                              display: 'flex',
                              gap: '6px',
                              justifyContent: 'center',
                              alignItems: 'center',
                              fontSize: '0.75rem',
                              flexWrap: 'wrap'
                            }}>
                              {movement.receives > 0 && (
                                <div style={{
                                  color: '#10b981',
                                  fontWeight: 600,
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}
                                  title="จำนวนครั้งที่รับเข้า"
                                >
                                  {movement.receives} ครั้ง
                                </div>
                              )}
                              {movement.transfersFromProvincial > 0 && (
                                <div style={{
                                  color: '#3b82f6',
                                  fontWeight: 600,
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}
                                  title="จำนวนครั้งที่รับโอน"
                                >
                                  {movement.transfersFromProvincial} ครั้ง
                                </div>
                              )}
                              {movement.dispenses > 0 && (
                                <div style={{
                                  color: '#f97316',
                                  fontWeight: 600,
                                  background: 'rgba(249, 115, 22, 0.1)',
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}
                                  title="จำนวนครั้งที่เบิกออก"
                                >
                                  {movement.dispenses} ครั้ง
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '2.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        borderRadius: '4px',
                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                      }}></div>
                      <span style={{ color: '#cbd5e1', fontWeight: 500 }}>รับเข้า</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        borderRadius: '4px',
                        boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                      }}></div>
                      <span style={{ color: '#cbd5e1', fontWeight: 500 }}>รับโอนจากกองกลาง</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        background: 'linear-gradient(135deg, #f97316, #ea580c)',
                        borderRadius: '4px',
                        boxShadow: '0 2px 6px rgba(249, 115, 22, 0.3)'
                      }}></div>
                      <span style={{ color: '#cbd5e1', fontWeight: 500 }}>เบิกออก</span>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textAlign: 'center',
                    lineHeight: 1.6
                  }}>
                    <div>ตัวเลขบนแท่ง = จำนวนครั้ง • ตัวเลขด้านล่าง = จำนวนสินค้า (ชิ้น)</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <Activity size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>ยังไม่มีกิจกรรม</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Activity Summary */}
        <div className="dash-card" style={{ gridColumn: 'span 4' }}>
          <div className="dash-card-header">
            <h3 className="dash-card-title">
              <Clock size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              สรุปกิจกรรม 7 วัน
            </h3>
          </div>
          <div className="dash-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  กิจกรรมทั้งหมด
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f1f5f9' }}>
                  {totalMovements}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                  ครั้ง
                </div>
              </div>

              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>
                      <TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                      รับเข้า
                    </span>
                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{totalReceives}</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${totalMovements > 0 ? (totalReceives / totalMovements) * 100 : 0}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981, #059669)',
                      borderRadius: '4px',
                      transition: 'width 0.6s ease'
                    }}></div>
                  </div>
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <span style={{ color: '#f97316', fontWeight: 600 }}>
                      <TrendingDown size={16} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                      เบิกออก
                    </span>
                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{totalDispenses}</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${totalMovements > 0 ? (totalDispenses / totalMovements) * 100 : 0}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #f97316, #ea580c)',
                      borderRadius: '4px',
                      transition: 'width 0.6s ease'
                    }}></div>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.875rem',
                color: '#cbd5e1',
                lineHeight: 1.6
              }}>
                <strong style={{ color: '#60a5fa' }}>💡 สถานะ:</strong>
                <br />
                {totalReceives > totalDispenses ? (
                  <>สต็อกเพิ่มขึ้น <span style={{ color: '#10b981' }}>+{totalReceives - totalDispenses}</span> ครั้ง</>
                ) : totalDispenses > totalReceives ? (
                  <>สต็อกลดลง <span style={{ color: '#f97316' }}>-{totalDispenses - totalReceives}</span> ครั้ง</>
                ) : (
                  <>สต็อกสมดุล</>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Category Distribution Chart (4 cols) + Top Items (8 cols) */}
        {/* Category Distribution Donut Chart */}
        <div className="dash-card" style={{ gridColumn: 'span 4' }}>
          <div className="dash-card-header">
            <h3 className="dash-card-title">
              <Package size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              สัดส่วนตามประเภท
            </h3>
          </div>
          <div className="dash-card-body">
            {(() => {
              // Group by category and calculate totals
              const categoryTotals = new Map<string, number>();
              stats?.byCategory.forEach(item => {
                const current = categoryTotals.get(item.category) || 0;
                categoryTotals.set(item.category, current + item.totalQuantity);
              });

              const categories = Array.from(categoryTotals.entries()).map(([name, quantity]) => ({
                name,
                quantity
              }));

              const total = categories.reduce((sum, cat) => sum + cat.quantity, 0);

              // Define colors for 9 categories
              const categoryColors: { [key: string]: string } = {
                'food': '#10b981',
                'medicine': '#ef4444',
                'clothing': '#3b82f6',
                'shelter': '#f59e0b',
                'hygiene': '#8b5cf6',
                'education': '#ec4899',
                'tool': '#14b8a6',
                'electronic': '#f97316',
                'other': '#64748b'
              };

              const getCategoryIcon = (category: string) => {
                const icons: { [key: string]: string } = {
                  'food': '🍚',
                  'medicine': '💊',
                  'clothing': '👕',
                  'shelter': '🏠',
                  'hygiene': '🧼',
                  'education': '📚',
                  'tool': '🔧',
                  'electronic': '💻',
                  'other': '📦'
                };
                return icons[category.toLowerCase()] || '📦';
              };

              // SVG Circle calculations
              const size = 220;
              const strokeWidth = 35;
              const radius = (size - strokeWidth) / 2;
              const circumference = 2 * Math.PI * radius;

              // Calculate segments
              let currentOffset = 0;
              const segments = categories.map(cat => {
                const percent = total > 0 ? (cat.quantity / total) * 100 : 0;
                const dashLength = (percent / 100) * circumference;
                const offset = currentOffset;
                currentOffset -= dashLength;
                return {
                  ...cat,
                  percent,
                  dashLength,
                  offset,
                  color: categoryColors[cat.name.toLowerCase()] || '#64748b'
                };
              });

              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
                  {/* Donut Chart SVG */}
                  <div style={{ position: 'relative', width: size, height: size, marginBottom: '1.5rem' }}>
                    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                      {/* Background circle */}
                      <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(30, 41, 59, 0.5)"
                        strokeWidth={strokeWidth}
                      />

                      {/* Category segments */}
                      {segments.map((segment) => (
                        segment.percent > 0 && (
                          <circle
                            key={segment.name}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${segment.dashLength} ${circumference}`}
                            strokeDashoffset={segment.offset}
                            strokeLinecap="round"
                            style={{ transition: 'all 0.6s ease' }}
                          />
                        )
                      ))}
                    </svg>

                    {/* Center Text */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f1f5f9' }}>
                        {categories.length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        ประเภท
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {segments.map(segment => (
                      <div key={segment.name} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.375rem 0.5rem',
                        borderRadius: '6px',
                        background: segment.percent > 0 ? `${segment.color}10` : 'transparent',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                          <div style={{
                            fontSize: '1.25rem',
                            lineHeight: 1
                          }}>
                            {getCategoryIcon(segment.name)}
                          </div>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '2px',
                            background: segment.color,
                            flexShrink: 0
                          }}></div>
                          <span style={{
                            fontSize: '0.8125rem',
                            color: '#cbd5e1',
                            textTransform: 'capitalize'
                          }}>
                            {segment.name}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          flexShrink: 0
                        }}>
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: segment.color
                          }}>
                            {segment.quantity.toLocaleString()}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#64748b',
                            minWidth: '45px',
                            textAlign: 'right'
                          }}>
                            ({segment.percent.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Top Items (8 cols) */}
        <div className="dash-card" style={{ gridColumn: 'span 8' }}>
          <div className="dash-card-header">
            <h3 className="dash-card-title">
              <Package size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              สินค้ายอดนิยม Top 10
            </h3>
            <span className="dash-badge dash-badge-primary">
              {stats?.byCategory.length || 0} รายการ
            </span>
          </div>
          <div className="dash-card-body">
            {stats?.byCategory && stats.byCategory.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {stats.byCategory.map((item, index) => {
                  const getCategoryColor = (category: string) => {
                    switch (category.toLowerCase()) {
                      case 'food':
                        return { color: '#10b981', icon: '🍚' };
                      case 'medicine':
                        return { color: '#ef4444', icon: '💊' };
                      case 'clothing':
                        return { color: '#3b82f6', icon: '👕' };
                      default:
                        return { color: '#64748b', icon: '📦' };
                    }
                  };

                  const style = getCategoryColor(item.category);

                  return (
                    <div
                      key={item.itemName}
                      style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(100, 116, 139, 0.2)',
                        borderRadius: '12px',
                        padding: '1rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                        e.currentTarget.style.borderColor = style.color + '40';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)';
                        e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.2)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: `${style.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem'
                        }}>
                          {style.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            marginBottom: '0.125rem'
                          }}>
                            #{index + 1}
                          </div>
                          <div style={{
                            fontWeight: 600,
                            color: '#f1f5f9',
                            fontSize: '0.9375rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                            title={item.itemName}
                          >
                            {item.itemName}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline'
                      }}>
                        <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>จำนวน:</span>
                        <span style={{
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: style.color
                        }}>
                          {item.totalQuantity.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <Package size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>ยังไม่มีข้อมูลสินค้า</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}