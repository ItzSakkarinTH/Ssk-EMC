'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Minus, Trash2, ClipboardList, Send, AlertCircle, Search, Filter } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface StockItem {
  _id: string;
  itemName: string;
  provincialStock: number;
  unit: string;
  category: string;
}

interface RequestItem extends StockItem {
  quantity: number;
  reason: string;
}

interface Props {
  onSuccess: () => void;
}

export default function RequestForm({ onSuccess }: Props) {
  const { success, error: showError, warning, info } = useToast();
  const [availableStock, setAvailableStock] = useState<StockItem[]>([]);
  const [requestList, setRequestList] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStock, setLoadingStock] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    void fetchAvailableStock();
  }, []);

  const fetchAvailableStock = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/provincial', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setAvailableStock(data.stock || []);
      }
    } catch (err) {
      console.error('Failed to fetch stock', err);
      showError('ไม่สามารถโหลดข้อมูลสต็อกได้');
    } finally {
      setLoadingStock(false);
    }
  };

  const addToList = (item: StockItem) => {
    const existing = requestList.find(c => c._id === item._id);
    if (existing) {
      warning('สินค้านี้อยู่ในรายการแล้ว');
      setShowList(true);
      return;
    }
    setRequestList([...requestList, { ...item, quantity: 1, reason: '' }]);
    success(`เพิ่ม ${item.itemName} ในรายการแล้ว`);
  };

  const removeFromList = (id: string) => {
    setRequestList(requestList.filter(item => item._id !== id));
    info('ลบออกจากรายการแล้ว');
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return;
    setRequestList(requestList.map(item =>
      item._id === id ? { ...item, quantity } : item
    ));
  };

  const updateReason = (id: string, reason: string) => {
    setRequestList(requestList.map(item =>
      item._id === id ? { ...item, reason } : item
    ));
  };

  const handleSubmit = async () => {
    // Validation
    if (requestList.length === 0) {
      showError('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ');
      return;
    }

    for (const item of requestList) {
      if (!item.reason.trim()) {
        showError(`กรุณาระบุเหตุผลสำหรับ ${item.itemName}`);
        return;
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const items = requestList.map(c => ({
        stockId: c._id,
        itemName: c.itemName,
        quantity: c.quantity,
        reason: c.reason,
        unit: c.unit
      }));

      const res = await fetch('/api/stock/staff/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'เกิดข้อผิดพลาด');
      }

      const result = await res.json();
      success(`ยื่นคำขอสำเร็จ! เลขที่: ${result.requestNumber}`);
      setRequestList([]);
      onSuccess();

    } catch (err: unknown) {
      const error = err as Error;
      showError('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingStock) {
    return (
      <div className="dash-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
        <p style={{ color: '#94a3b8' }}>กำลังโหลดสินค้า...</p>
      </div>
    );
  }

  // Filter items
  let filteredItems = availableStock;

  if (searchTerm) {
    filteredItems = filteredItems.filter(item =>
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (filterCategory !== 'all') {
    filteredItems = filteredItems.filter(item => item.category === filterCategory);
  }

  const categoryConfig: Record<string, { emoji: string; label: string; color: string }> = {
    food: { emoji: '🍚', label: 'อาหาร', color: '#22c55e' },
    medicine: { emoji: '💊', label: 'ยา', color: '#3b82f6' },
    clothing: { emoji: '👕', label: 'เสื้อผ้า', color: '#f59e0b' },
    other: { emoji: '📦', label: 'อื่นๆ', color: '#8b5cf6' }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showList ? '1fr 400px' : '1fr', gap: '1.5rem' }}>
      {/* Product List */}
      <div>
        {/* Search & Filter */}
        <div className="dash-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="dash-form-group">
              <label className="dash-label">
                <Search size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                ค้นหาสินค้า
              </label>
              <input
                type="text"
                className="dash-input"
                placeholder="ชื่อสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="dash-form-group">
              <label className="dash-label">
                <Filter size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                หมวดหมู่
              </label>
              <select
                className="dash-input"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">ทั้งหมด</option>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.emoji} {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredItems.map(item => {
            const config = categoryConfig[item.category];
            const inList = requestList.some(c => c._id === item._id);

            return (
              <div key={item._id} className="dash-card" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: `${config.color}20`,
                    color: config.color,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    marginBottom: '0.75rem'
                  }}>
                    {config.emoji} {config.label}
                  </div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: 'var(--dash-text-primary)',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {item.itemName}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: item.provincialStock > 100 ? '#22c55e' : item.provincialStock > 50 ? '#f59e0b' : '#ef4444'
                    }}>
                      {item.provincialStock}
                    </span>
                    <span style={{ color: '#94a3b8' }}>{item.unit}</span>
                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>คงเหลือ</span>
                  </div>
                </div>
                <button
                  onClick={() => addToList(item)}
                  className="dash-btn dash-btn-primary dash-btn-block"
                  disabled={inList}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {inList ? (
                    <>✓ อยู่ในรายการแล้ว</>
                  ) : (
                    <>
                      <Plus size={18} />
                      เพิ่มในรายการ
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="dash-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <Package size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ color: '#94a3b8' }}>ไม่พบสินค้า</p>
          </div>
        )}
      </div>

      {/* Floating List Button (Mobile) */}
      {!showList && requestList.length > 0 && (
        <button
          onClick={() => setShowList(true)}
          className="dash-btn dash-btn-primary"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1000
          }}
        >
          <ClipboardList size={24} />
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {requestList.length}
          </span>
        </button>
      )}

      {/* Request List */}
      {showList && requestList.length > 0 && (
        <div className="dash-card" style={{
          padding: '1.5rem',
          position: 'sticky',
          top: '1rem',
          maxHeight: 'calc(100vh - 2rem)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 className="dash-card-title" style={{ margin: 0 }}>
              <ClipboardList size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              รายการขอ ({requestList.length})
            </h3>
            <button
              onClick={() => setShowList(false)}
              className="dash-btn-icon"
              style={{ fontSize: '1.25rem' }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem' }}>
            {requestList.map(item => (
              <div key={item._id} className="dash-card" style={{
                padding: '1rem',
                marginBottom: '1rem',
                background: 'var(--dash-bg-tertiary)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: 'var(--dash-text-primary)',
                      margin: '0 0 0.25rem 0'
                    }}>
                      {item.itemName}
                    </h4>
                    <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                      คงเหลือ: {item.provincialStock} {item.unit}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFromList(item._id)}
                    className="dash-btn-icon"
                    style={{ color: '#ef4444' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="dash-form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="dash-label" style={{ fontSize: '0.875rem' }}>จำนวน</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="dash-btn dash-btn-sm"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      className="dash-input"
                      style={{ width: '80px', textAlign: 'center' }}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item._id, parseInt(e.target.value) || 1)}
                      min={1}
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="dash-btn dash-btn-sm"
                    >
                      <Plus size={14} />
                    </button>
                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{item.unit}</span>
                  </div>
                  {item.quantity > item.provincialStock && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <AlertCircle size={14} style={{ color: '#f59e0b' }} />
                      <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                        มากกว่าสต็อกที่มี
                      </span>
                    </div>
                  )}
                </div>

                <div className="dash-form-group">
                  <label className="dash-label" style={{ fontSize: '0.875rem' }}>
                    เหตุผล <span className="dash-required">*</span>
                  </label>
                  <textarea
                    className="dash-input"
                    rows={2}
                    placeholder="ระบุเหตุผล..."
                    value={item.reason}
                    onChange={(e) => updateReason(item._id, e.target.value)}
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => void handleSubmit()}
            className="dash-btn dash-btn-primary dash-btn-lg dash-btn-block"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? (
              <>🔄 กำลังส่ง...</>
            ) : (
              <>
                <Send size={20} />
                ยืนยันส่งคำขอ
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}