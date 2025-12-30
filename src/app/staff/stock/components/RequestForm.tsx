'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Minus, Trash2, ClipboardList, Send, Search, Filter } from 'lucide-react';
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


  const fetchAvailableStock = useCallback(async () => {
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
  }, [showError]);

  useEffect(() => {
    void fetchAvailableStock();
  }, [fetchAvailableStock]);

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

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      food: '🍚', medicine: '💊', clothing: '👕',
      shelter: '🏠', hygiene: '🧼', education: '📚',
      tool: '🔧', electronic: '💻', other: '📦'
    };
    return emojis[category.toLowerCase()] || '📦';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      food: 'อาหาร', medicine: 'ยา/เวชภัณฑ์', clothing: 'เครื่องนุ่งห่ม',
      shelter: 'ที่พักพิง', hygiene: 'สุขอนามัย', education: 'การศึกษา',
      tool: 'เครื่องมือ', electronic: 'อุปกรณ์ไฟฟ้า', other: 'อื่นๆ'
    };
    return labels[category.toLowerCase()] || 'อื่นๆ';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: '#22c55e', medicine: '#ef4444', clothing: '#3b82f6',
      shelter: '#f59e0b', hygiene: '#8b5cf6', education: '#ec4899',
      tool: '#14b8a6', electronic: '#f97316', other: '#64748b'
    };
    return colors[category.toLowerCase()] || '#64748b';
  };

  const categories = Array.from(new Set(availableStock.map(i => i.category)));

  return (
    <div className="dash-grid" style={{ gridTemplateColumns: showList ? '1fr 400px' : '1fr', alignItems: 'start' }}>
      {/* Source Product List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Search & Filter */}
        <div className="dash-card">
          <div className="dash-grid dash-grid-2">
            <div className="dash-form-group">
              <label className="dash-label">
                <Search size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                ค้นหาสินค้าจากกองกลาง
              </label>
              <input
                type="text"
                className="dash-input"
                placeholder="ชื่อสินค้าที่ต้องการ..."
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
                className="dash-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">ทั้งหมด</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryEmoji(cat)} {getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="dash-grid dash-grid-auto">
          {filteredItems.map(item => {
            const inList = requestList.some(c => c._id === item._id);
            const categoryColor = getCategoryColor(item.category);

            return (
              <div key={item._id} className="dash-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      background: `${categoryColor}20`,
                      color: categoryColor,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: `1px solid ${categoryColor}40`
                    }}>
                      {getCategoryEmoji(item.category)} {getCategoryLabel(item.category)}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{item.itemName}</h3>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <span style={{
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      color: item.provincialStock > 100 ? 'var(--dash-success)' : item.provincialStock > 50 ? 'var(--dash-warning)' : 'var(--dash-danger)'
                    }}>
                      {item.provincialStock.toLocaleString()}
                    </span>
                    <span className="dash-text-muted">{item.unit} (กองกลาง)</span>
                  </div>
                </div>

                <button
                  onClick={() => addToList(item)}
                  className={`dash-btn ${inList ? 'dash-btn-secondary' : 'dash-btn-primary'} dash-btn-block`}
                  disabled={inList}
                >
                  {inList ? '✔️ ในรายการ' : <><Plus size={18} /> ยื่นขอสินค้า</>}
                </button>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="dash-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <Package size={64} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p className="dash-text-muted">ไม่พบรหัสสินค้าที่ต้องการ</p>
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
            width: '64px',
            height: '64px',
            padding: 0,
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
            zIndex: 100
          }}
        >
          <ClipboardList size={28} />
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'var(--dash-danger)',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '0.75rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--dash-bg-primary)'
          }}>
            {requestList.length}
          </span>
        </button>
      )}

      {/* Sidebar/List Section */}
      {showList && (
        <div className="dash-card" style={{ position: 'sticky', top: '2rem', maxHeight: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column', padding: '0' }}>
          <div className="dash-card-header" style={{ padding: '1.5rem', marginBottom: 0 }}>
            <h3 className="dash-card-title">
              <ClipboardList size={20} style={{ marginRight: '0.5rem' }} />
              รายการคำขอสินค้า
            </h3>
            <button onClick={() => setShowList(false)} className="dash-btn dash-btn-secondary" style={{ padding: '0.4rem', minWidth: 'auto' }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {requestList.map(item => (
                <div key={item._id} style={{ background: 'var(--dash-bg-tertiary)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--dash-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{getCategoryEmoji(item.category)} {item.itemName}</div>
                    <button onClick={() => removeFromList(item._id)} style={{ color: 'var(--dash-danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="dash-form-group">
                    <label className="dash-label" style={{ fontSize: '0.8rem' }}>จำนวนที่ขอ</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--dash-bg-primary)', borderRadius: '8px', padding: '0.25rem', border: '1px solid var(--dash-border)' }}>
                        <button onClick={() => updateQuantity(item._id, item.quantity - 1)} disabled={item.quantity <= 1} style={{ padding: '0.4rem', borderRadius: '6px', border: 'none', background: 'none', color: 'var(--dash-text-primary)' }}><Minus size={14} /></button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item._id, parseInt(e.target.value) || 1)}
                          style={{ width: '50px', textAlign: 'center', background: 'none', border: 'none', color: 'var(--dash-text-primary)', fontWeight: 700 }}
                        />
                        <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ padding: '0.4rem', borderRadius: '6px', border: 'none', background: 'none', color: 'var(--dash-text-primary)' }}><Plus size={14} /></button>
                      </div>
                      <span className="dash-text-muted" style={{ fontSize: '0.9rem' }}>{item.unit}</span>
                    </div>
                  </div>

                  <div className="dash-form-group" style={{ marginTop: '1rem' }}>
                    <label className="dash-label" style={{ fontSize: '0.8rem' }}>เหตุผลการขอ <span style={{ color: 'var(--dash-danger)' }}>*</span></label>
                    <textarea
                      className="dash-textarea"
                      rows={2}
                      placeholder="ระบุเหตุผลความจำเป็น..."
                      value={item.reason}
                      onChange={(e) => updateReason(item._id, e.target.value)}
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '1.5rem', background: 'var(--dash-surface-solid)', borderTop: '1px solid var(--dash-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 700 }}>
              <span>รายการทั้งหมด</span>
              <span style={{ color: 'var(--dash-primary)' }}>{requestList.length} รายการ</span>
            </div>
            <button
              onClick={() => void handleSubmit()}
              className="dash-btn dash-btn-primary dash-btn-block dash-btn-lg"
              disabled={loading || requestList.length === 0}
            >
              {loading ? '🔄 กำลังส่งคำขอ...' : <><Send size={18} /> ยืนยันยื่นคำขอสินค้า</>}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 1024px) {
          .dash-grid[style*="repeat(auto-fit, minmax(280px, 1fr))"] {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          }
        }
        @media (max-width: 900px) {
          .dash-grid[style*="400px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}