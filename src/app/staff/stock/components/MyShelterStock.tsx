'use client';

import { useState, useEffect } from 'react';
import { Package, RefreshCw, AlertCircle, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface StockItem {
  stockId: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  status: 'sufficient' | 'low' | 'critical' | 'unavailable';
  lastUpdated: string | null;
  minStockLevel: number;
  criticalLevel: number;
}

interface MyShelterStockData {
  shelterId: string;
  shelterName: string;
  totalItems: number;
  stock: StockItem[];
}

export default function MyShelterStock() {
  const [data, setData] = useState<MyShelterStockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    void fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/staff/my-shelter', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <RefreshCw size={48} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem', opacity: 0.5 }} />
        <p style={{ color: '#94a3b8' }}>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-card" style={{ padding: '2rem', textAlign: 'center', borderColor: '#ef4444' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <p style={{ color: '#ef4444' }}>เกิดข้อผิดพลาด: {error}</p>
        <button onClick={() => void fetchStock()} className="dash-btn dash-btn-primary" style={{ marginTop: '1rem' }}>
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  if (!data) return null;

  // กรองข้อมูล
  let filteredStock = data.stock;

  if (filterCategory !== 'all') {
    filteredStock = filteredStock.filter(s => s.category === filterCategory);
  }

  if (filterStatus !== 'all') {
    filteredStock = filteredStock.filter(s => s.status === filterStatus);
  }

  const categoryEmoji: Record<string, string> = {
    food: '🍚',
    medicine: '💊',
    clothing: '👕',
    other: '📦'
  };

  const categoryLabels: Record<string, string> = {
    food: 'อาหาร',
    medicine: 'ยา',
    clothing: 'เสื้อผ้า',
    other: 'อื่นๆ'
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'sufficient':
        return { icon: CheckCircle2, label: 'เพียงพอ', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' };
      case 'low':
        return { icon: AlertTriangle, label: 'ใกล้หมด', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'critical':
        return { icon: AlertCircle, label: 'วิกฤต', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
      default:
        return { icon: XCircle, label: 'ไม่พร้อมใช้', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
    }
  };

  const sufficientCount = data.stock.filter(s => s.status === 'sufficient').length;
  const lowCount = data.stock.filter(s => s.status === 'low').length;
  const criticalCount = data.stock.filter(s => s.status === 'critical').length;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h2 className="dash-card-title" style={{ marginBottom: '0.5rem' }}>
            <Package size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            สต็อกสินค้าของศูนย์
          </h2>
          <p style={{ color: '#94a3b8', margin: 0 }}>{data.shelterName}</p>
        </div>
        <button
          onClick={() => void fetchStock()}
          className="dash-btn dash-btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={18} />
          รีเฟรช
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-primary">
            <Package size={28} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">{data.totalItems}</div>
            <div className="dash-stat-label">รายการทั้งหมด</div>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-success">
            <CheckCircle2 size={28} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">{sufficientCount}</div>
            <div className="dash-stat-label">เพียงพอ</div>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-warning">
            <AlertTriangle size={28} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">{lowCount}</div>
            <div className="dash-stat-label">ใกล้หมด</div>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-danger">
            <AlertCircle size={28} />
          </div>
          <div className="dash-stat-content">
            <div className="dash-stat-value">{criticalCount}</div>
            <div className="dash-stat-label">วิกฤต</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="dash-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div className="dash-form-group">
            <label className="dash-label">หมวดหมู่</label>
            <select
              className="dash-input"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">ทั้งหมด</option>
              <option value="food">🍚 อาหาร</option>
              <option value="medicine">💊 ยา</option>
              <option value="clothing">👕 เสื้อผ้า</option>
              <option value="other">📦 อื่นๆ</option>
            </select>
          </div>

          <div className="dash-form-group">
            <label className="dash-label">สถานะ</label>
            <select
              className="dash-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">ทั้งหมด</option>
              <option value="sufficient">✅ เพียงพอ</option>
              <option value="low">⚠️ ใกล้หมด</option>
              <option value="critical">🚨 วิกฤต</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stock List */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h3 className="dash-card-title">รายการสต็อก</h3>
          <span className="dash-badge dash-badge-primary">{filteredStock.length} รายการ</span>
        </div>
        <div className="dash-card-body" style={{ padding: 0 }}>
          {filteredStock.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              <Package size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>ไม่พบรายการสินค้า</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>สินค้า</th>
                    <th>หมวดหมู่</th>
                    <th style={{ textAlign: 'right' }}>จำนวน</th>
                    <th style={{ textAlign: 'center' }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map(item => {
                    const statusConfig = getStatusConfig(item.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <tr key={item.stockId}>
                        <td>
                          <div style={{ fontWeight: 500, color: '#f1f5f9' }}>
                            {item.itemName}
                          </div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            {categoryEmoji[item.category]}
                            {categoryLabels[item.category]}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f1f5f9' }}>
                            {item.quantity}
                          </span>
                          <span style={{ marginLeft: '0.5rem', color: '#94a3b8' }}>
                            {item.unit}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="dash-badge" style={{
                            background: statusConfig.bg,
                            color: statusConfig.color,
                            border: `1px solid ${statusConfig.color}40`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <StatusIcon size={14} />
                            {statusConfig.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}