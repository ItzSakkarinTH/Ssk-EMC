'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './StockAnalytics.module.css';

interface AnalyticsData {
  turnoverRate: number;
  avgDaysInStock: number;
  topReceived: Array<{ name: string; quantity: number }>;
  topDispensed: Array<{ name: string; quantity: number }>;
  categoryDistribution: Record<string, number>;
  summary: {
    totalReceived: number;
    totalDispensed: number;
    period: number;
  };
}

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string; bgColor: string }> = {
  food: { label: 'อาหาร', emoji: '🍚', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
  medicine: { label: 'ยาและเวชภัณฑ์', emoji: '💊', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' },
  clothing: { label: 'เครื่องนุ่งห่ม', emoji: '👕', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' },
  other: { label: 'อื่นๆ', emoji: '📦', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' }
};

export default function StockAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7days');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/stock/admin/analytics?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getPeriodLabel = () => {
    switch (period) {
      case '7days': return '7 วัน';
      case '30days': return '30 วัน';
      case '90days': return '90 วัน';
      default: return period;
    }
  };

  // Calculate totals for category distribution
  const getCategoryTotal = () => {
    if (!data?.categoryDistribution) return 0;
    return Object.values(data.categoryDistribution).reduce((sum, val) => sum + val, 0);
  };

  const getCategoryPercentage = (value: number) => {
    const total = getCategoryTotal();
    if (total === 0) return 0;
    return (value / total) * 100;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
          </div>
          <p className={styles.loadingText}>กำลังวิเคราะห์ข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <h3>ไม่มีข้อมูลการวิเคราะห์</h3>
          <p>ยังไม่มีข้อมูลการเคลื่อนไหวของสต๊อกในช่วงเวลานี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Period Selector Header */}
      <div className={styles.headerSection}>
        <div className={styles.periodInfo}>
          <span className={styles.periodIcon}>📅</span>
          <span className={styles.periodLabel}>ช่วงเวลาวิเคราะห์:</span>
          <span className={styles.periodValue}>{getPeriodLabel()}ล่าสุด</span>
        </div>
        <div className={styles.periodSelector}>
          {['7days', '30days', '90days'].map((p) => (
            <button
              key={p}
              className={`${styles.periodButton} ${period === p ? styles.periodButtonActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === '7days' ? '7 วัน' : p === '30days' ? '30 วัน' : '90 วัน'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats - 4 columns */}
      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles.summaryCardReceive}`}>
          <div className={styles.summaryIconWrapper}>
            <span className={styles.summaryIcon}>📥</span>
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryValue}>
              {data.summary?.totalReceived?.toLocaleString() || 0}
            </div>
            <div className={styles.summaryLabel}>รับเข้าทั้งหมด</div>
            <div className={styles.summarySubtext}>ใน {getPeriodLabel()}</div>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.summaryCardDispense}`}>
          <div className={styles.summaryIconWrapper}>
            <span className={styles.summaryIcon}>📤</span>
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryValue}>
              {data.summary?.totalDispensed?.toLocaleString() || 0}
            </div>
            <div className={styles.summaryLabel}>เบิกจ่ายทั้งหมด</div>
            <div className={styles.summarySubtext}>ใน {getPeriodLabel()}</div>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.summaryCardTurnover}`}>
          <div className={styles.summaryIconWrapper}>
            <span className={styles.summaryIcon}>🔄</span>
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryValue}>
              {data.turnoverRate.toFixed(2)}
            </div>
            <div className={styles.summaryLabel}>อัตราหมุนเวียน</div>
            <div className={styles.summarySubtext}>Stock Turnover Rate</div>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.summaryCardDays}`}>
          <div className={styles.summaryIconWrapper}>
            <span className={styles.summaryIcon}>⏱️</span>
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryValue}>
              {data.avgDaysInStock.toFixed(0)}
            </div>
            <div className={styles.summaryLabel}>วันเฉลี่ยในสต๊อก</div>
            <div className={styles.summarySubtext}>Average Days in Stock</div>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className={styles.categorySection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrapper}>
            <span className={styles.sectionIcon}>📊</span>
            <h3 className={styles.sectionTitle}>การกระจายตามหมวดหมู่</h3>
          </div>
          <div className={styles.sectionSubtitle}>
            สัดส่วนสต๊อกแยกตามประเภทสินค้า
          </div>
        </div>

        <div className={styles.categoryGrid}>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const value = data.categoryDistribution?.[key] || 0;
            const percentage = getCategoryPercentage(value);

            return (
              <div key={key} className={styles.categoryCard} style={{ '--category-color': config.color } as React.CSSProperties}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryIconBox} style={{ backgroundColor: config.bgColor }}>
                    <span>{config.emoji}</span>
                  </div>
                  <div className={styles.categoryInfo}>
                    <div className={styles.categoryName}>{config.label}</div>
                    <div className={styles.categoryValue}>{value.toLocaleString()} หน่วย</div>
                  </div>
                  <div className={styles.categoryPercentage} style={{ color: config.color }}>
                    {percentage.toFixed(1)}%
                  </div>
                </div>
                <div className={styles.categoryProgressContainer}>
                  <div className={styles.categoryProgressBg}>
                    <div
                      className={styles.categoryProgressBar}
                      style={{
                        width: `${Math.max(percentage, 2)}%`,
                        background: `linear-gradient(90deg, ${config.color} 0%, ${config.color}dd 100%)`
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Items Section - 2 columns */}
      <div className={styles.topItemsGrid}>
        {/* Top Received */}
        <div className={styles.topItemsCard}>
          <div className={styles.topItemsHeader}>
            <div className={styles.topItemsTitleWrapper}>
              <div className={styles.topItemsIconBox} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                <span>📥</span>
              </div>
              <div>
                <h3 className={styles.topItemsTitle}>รับเข้ามากที่สุด</h3>
                <p className={styles.topItemsSubtitle}>Top 5 สินค้าที่รับเข้าสูงสุด</p>
              </div>
            </div>
          </div>
          <div className={styles.topItemsList}>
            {data.topReceived.length === 0 ? (
              <div className={styles.noDataMessage}>
                <span>📭</span>
                <p>ไม่มีข้อมูลในช่วงนี้</p>
              </div>
            ) : (
              data.topReceived.map((item, idx) => {
                const maxQty = Math.max(...data.topReceived.map(i => i.quantity));
                const percentage = (item.quantity / maxQty) * 100;

                return (
                  <div key={idx} className={styles.topItemRow}>
                    <div className={styles.topItemRank}>
                      <span className={`${styles.rankBadge} ${idx === 0 ? styles.rankGold : idx === 1 ? styles.rankSilver : idx === 2 ? styles.rankBronze : styles.rankDefault}`}>
                        {idx + 1}
                      </span>
                    </div>
                    <div className={styles.topItemInfo}>
                      <div className={styles.topItemName}>{item.name}</div>
                      <div className={styles.topItemProgress}>
                        <div
                          className={styles.topItemProgressBar}
                          style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, #10b981, #6ee7b7)' }}
                        />
                      </div>
                    </div>
                    <div className={styles.topItemQty}>
                      {item.quantity.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Dispensed */}
        <div className={styles.topItemsCard}>
          <div className={styles.topItemsHeader}>
            <div className={styles.topItemsTitleWrapper}>
              <div className={styles.topItemsIconBox} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                <span>📤</span>
              </div>
              <div>
                <h3 className={styles.topItemsTitle}>เบิกจ่ายมากที่สุด</h3>
                <p className={styles.topItemsSubtitle}>Top 5 สินค้าที่เบิกจ่ายสูงสุด</p>
              </div>
            </div>
          </div>
          <div className={styles.topItemsList}>
            {data.topDispensed.length === 0 ? (
              <div className={styles.noDataMessage}>
                <span>📭</span>
                <p>ไม่มีข้อมูลในช่วงนี้</p>
              </div>
            ) : (
              data.topDispensed.map((item, idx) => {
                const maxQty = Math.max(...data.topDispensed.map(i => i.quantity));
                const percentage = (item.quantity / maxQty) * 100;

                return (
                  <div key={idx} className={styles.topItemRow}>
                    <div className={styles.topItemRank}>
                      <span className={`${styles.rankBadge} ${idx === 0 ? styles.rankGold : idx === 1 ? styles.rankSilver : idx === 2 ? styles.rankBronze : styles.rankDefault}`}>
                        {idx + 1}
                      </span>
                    </div>
                    <div className={styles.topItemInfo}>
                      <div className={styles.topItemName}>{item.name}</div>
                      <div className={styles.topItemProgress}>
                        <div
                          className={styles.topItemProgressBar}
                          style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, #f59e0b, #fcd34d)' }}
                        />
                      </div>
                    </div>
                    <div className={styles.topItemQty}>
                      {item.quantity.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className={styles.insightsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrapper}>
            <span className={styles.sectionIcon}>💡</span>
            <h3 className={styles.sectionTitle}>สรุปข้อมูลเชิงลึก</h3>
          </div>
        </div>
        <div className={styles.insightsGrid}>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>📈</div>
            <div className={styles.insightContent}>
              <div className={styles.insightTitle}>ประสิทธิภาพการหมุนเวียน</div>
              <div className={styles.insightText}>
                {data.turnoverRate >= 1
                  ? 'อัตราหมุนเวียนอยู่ในเกณฑ์ดี สต๊อกมีการเคลื่อนไหวสม่ำเสมอ'
                  : data.turnoverRate >= 0.5
                    ? 'อัตราหมุนเวียนปานกลาง ควรพิจารณาเพิ่มการกระจายสินค้า'
                    : 'อัตราหมุนเวียนต่ำ ควรตรวจสอบสาเหตุและวางแผนการกระจายสินค้า'}
              </div>
            </div>
          </div>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>⚖️</div>
            <div className={styles.insightContent}>
              <div className={styles.insightTitle}>ความสมดุล รับ-จ่าย</div>
              <div className={styles.insightText}>
                {data.summary.totalReceived > data.summary.totalDispensed
                  ? `รับเข้ามากกว่าเบิกจ่าย ${(data.summary.totalReceived - data.summary.totalDispensed).toLocaleString()} หน่วย - สต๊อกเพิ่มขึ้น`
                  : data.summary.totalReceived < data.summary.totalDispensed
                    ? `เบิกจ่ายมากกว่ารับเข้า ${(data.summary.totalDispensed - data.summary.totalReceived).toLocaleString()} หน่วย - ควรเติมสต๊อก`
                    : 'รับเข้าและเบิกจ่ายสมดุล - การบริหารสต๊อกเป็นไปอย่างดี'}
              </div>
            </div>
          </div>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>🎯</div>
            <div className={styles.insightContent}>
              <div className={styles.insightTitle}>หมวดหมู่ที่ต้องให้ความสนใจ</div>
              <div className={styles.insightText}>
                {(() => {
                  const categories = Object.entries(data.categoryDistribution || {});
                  const maxCat = categories.reduce((max, [key, val]) => val > max.value ? { key, value: val } : max, { key: '', value: 0 });
                  const config = CATEGORY_CONFIG[maxCat.key];
                  return config ? `${config.emoji} ${config.label} มีสต๊อกมากที่สุด (${maxCat.value.toLocaleString()} หน่วย)` : 'ยังไม่มีข้อมูลเพียงพอ';
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}