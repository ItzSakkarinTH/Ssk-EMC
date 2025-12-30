'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Package,
  Minus,
  Plus,
  Trash2,
  ClipboardList,
  Send,
  ArrowLeft,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';

interface StockItem {
  stockId: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
}

interface DispenseItem extends StockItem {
  dispenseQty: number;
}

export default function DispensePage() {
  const router = useRouter();
  const { success, error: showError, warning, info } = useToast();

  const [shelterStock, setShelterStock] = useState<StockItem[]>([]);
  const [dispenseList, setDispenseList] = useState<DispenseItem[]>([]);
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStock, setLoadingStock] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showList, setShowList] = useState(false);

  const fetchStock = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/staff/my-shelter', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setShelterStock(data.stock || []);
      }
    } catch (err) {
      console.error('Failed to fetch stock', err);
      showError('ไม่สามารถโหลดข้อมูลสต็อกได้');
    } finally {
      setLoadingStock(false);
    }
  }, [showError]);

  useEffect(() => {
    void fetchStock();
  }, [fetchStock]);

  const addToList = (item: StockItem) => {
    const existing = dispenseList.find(c => c.stockId === item.stockId);
    if (existing) {
      warning('สินค้านี้อยู่ในรายการแล้ว');
      setShowList(true);
      return;
    }
    setDispenseList([...dispenseList, { ...item, dispenseQty: 1 }]);
    success(`เพิ่ม ${item.itemName} ในรายการเบิกจ่าย`);
  };

  const removeFromList = (stockId: string) => {
    setDispenseList(dispenseList.filter(item => item.stockId !== stockId));
    info('ลบออกจากรายการแล้ว');
  };

  const updateQuantity = (stockId: string, qty: number) => {
    const item = dispenseList.find(c => c.stockId === stockId);
    if (!item) return;
    if (qty <= 0) return;
    if (qty > item.quantity) {
      warning(`สต๊อกไม่เพียงพอ (มีเพียง ${item.quantity} ${item.unit})`);
      return;
    }
    setDispenseList(dispenseList.map(c =>
      c.stockId === stockId ? { ...c, dispenseQty: qty } : c
    ));
  };

  const handleSubmit = async () => {
    if (dispenseList.length === 0) {
      showError('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ');
      return;
    }

    if (!recipient.trim()) {
      showError('กรุณาระบุผู้รับสินค้า');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');

      // Process each item
      for (const item of dispenseList) {
        const res = await fetch('/api/stock/staff/dispense', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            stockId: item.stockId,
            quantity: item.dispenseQty,
            recipient,
            notes
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `เกิดข้อผิดพลาดกับ ${item.itemName}`);
        }
      }

      success('เบิกจ่ายสำเร็จ!');
      router.push('/staff/stock');

    } catch (err: unknown) {
      const error = err as Error;
      showError('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryEmoji = (category: string) => {
    const map: Record<string, string> = {
      food: '🍚',
      medicine: '💊',
      clothing: '👕',
      shelter: '🏠',
      hygiene: '🧼',
      education: '📚',
      tools: '🔧',
      electronics: '💡',
      other: '📦'
    };
    return map[category] || '📦';
  };

  const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
      food: 'อาหาร',
      medicine: 'ยา',
      clothing: 'เสื้อผ้า',
      shelter: 'ที่พักอาศัย',
      hygiene: 'สุขอนามัย',
      education: 'การศึกษา',
      tools: 'เครื่องมือ',
      electronics: 'อิเล็กทรอนิกส์',
      other: 'อื่นๆ'
    };
    return map[category] || 'อื่นๆ';
  };

  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
      food: '#22c55e',
      medicine: '#3b82f6',
      clothing: '#f59e0b',
      shelter: '#8b5cf6',
      hygiene: '#06b6d4',
      education: '#ec4899',
      tools: '#f97316',
      electronics: '#eab308',
      other: '#64748b'
    };
    return map[category] || '#64748b';
  };

  const getStatusBadge = (status: string, quantity: number) => {
    if (status === 'critical' || quantity <= 5) {
      return { color: '#ef4444', label: 'วิกฤต', icon: AlertTriangle };
    }
    if (status === 'low' || quantity <= 20) {
      return { color: '#f59e0b', label: 'เฝ้าระวัง', icon: AlertTriangle };
    }
    return null;
  };

  if (loadingStock) {
    return (
      <DashboardLayout
        title="เบิกจ่ายสินค้า"
        subtitle="บันทึกการเบิกจ่ายสินค้าให้กับผู้ประสบภัย"
      >
        <div className="dash-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
          <p style={{ color: '#94a3b8' }}>กำลังโหลดสินค้า...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Filter items with stock > 0
  let filteredItems = shelterStock.filter(item => item.quantity > 0);

  if (searchTerm) {
    filteredItems = filteredItems.filter(item =>
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (filterCategory !== 'all') {
    filteredItems = filteredItems.filter(item => item.category === filterCategory);
  }

  const categories = ['food', 'medicine', 'clothing', 'shelter', 'hygiene', 'education', 'tools', 'electronics', 'other'];
  const totalDispense = dispenseList.reduce((sum, item) => sum + item.dispenseQty, 0);

  return (
    <DashboardLayout
      title="เบิกจ่ายสินค้า"
      subtitle="บันทึกการเบิกจ่ายสินค้าให้กับผู้ประสบภัย"
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => router.back()}
          className="dash-btn dash-btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={18} />
          ย้อนกลับ
        </button>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: showList ? '1fr 420px' : '1fr', alignItems: 'start' }}>
        {/* Product List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Search & Filter */}
          <div className="dash-card">
            <div className="dash-grid dash-grid-2">
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
              const inList = dispenseList.some(c => c.stockId === item.stockId);
              const categoryColor = getCategoryColor(item.category);
              const statusBadge = getStatusBadge(item.status, item.quantity);

              return (
                <div key={item.stockId} className="dash-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                      {statusBadge && (
                        <div className={`dash-badge dash-badge-${statusBadge.color === '#ef4444' ? 'critical' : 'urgent'}`} style={{ fontSize: '0.7rem' }}>
                          <statusBadge.icon size={12} />
                          {statusBadge.label}
                        </div>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{item.itemName}</h3>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 800, color: item.quantity <= 10 ? 'var(--dash-danger)' : 'var(--dash-success)' }}>
                        {item.quantity.toLocaleString()}
                      </span>
                      <span className="dash-text-muted">{item.unit}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => addToList(item)}
                    className={`dash-btn ${inList ? 'dash-btn-secondary' : 'dash-btn-primary'} dash-btn-block`}
                    disabled={inList}
                  >
                    {inList ? '✓ ในรายการ' : <><Plus size={18} /> เพิ่มรายการ</>}
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
        {!showList && dispenseList.length > 0 && (
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
              {dispenseList.length}
            </span>
          </button>
        )}

        {/* Sidebar/List Section */}
        {showList && (
          <div className="dash-card" style={{ position: 'sticky', top: '2rem', maxHeight: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column', padding: '0' }}>
            <div className="dash-card-header" style={{ padding: '1.5rem', marginBottom: 0 }}>
              <h3 className="dash-card-title">
                <ClipboardList size={20} style={{ marginRight: '0.5rem' }} />
                รายการเบิกจ่าย
              </h3>
              <button onClick={() => setShowList(false)} className="dash-btn dash-btn-secondary" style={{ padding: '0.4rem', minWidth: 'auto' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {dispenseList.map(item => (
                  <div key={item.stockId} style={{ background: 'var(--dash-bg-tertiary)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--dash-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 600 }}>{getCategoryEmoji(item.category)} {item.itemName}</div>
                      <button onClick={() => removeFromList(item.stockId)} style={{ color: 'var(--dash-danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--dash-bg-primary)', borderRadius: '8px', padding: '0.25rem' }}>
                        <button onClick={() => updateQuantity(item.stockId, item.dispenseQty - 1)} disabled={item.dispenseQty <= 1} style={{ padding: '0.5rem', borderRadius: '6px', border: 'none', background: 'none', color: 'var(--dash-text-primary)' }}><Minus size={14} /></button>
                        <input
                          type="number"
                          value={item.dispenseQty}
                          onChange={(e) => updateQuantity(item.stockId, parseInt(e.target.value) || 1)}
                          style={{ width: '50px', textAlign: 'center', background: 'none', border: 'none', color: 'var(--dash-text-primary)', fontWeight: 700 }}
                        />
                        <button onClick={() => updateQuantity(item.stockId, item.dispenseQty + 1)} disabled={item.dispenseQty >= item.quantity} style={{ padding: '0.5rem', borderRadius: '6px', border: 'none', background: 'none', color: 'var(--dash-text-primary)' }}><Plus size={14} /></button>
                      </div>
                      <span className="dash-text-muted">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="dash-form-group">
                  <label className="dash-label">ผู้รับสินค้า / ครอบครัว <span style={{ color: 'var(--dash-danger)' }}>*</span></label>
                  <input
                    type="text"
                    className="dash-input"
                    placeholder="ระบุชื่อหรือรหัสครอบครัว"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </div>
                <div className="dash-form-group">
                  <label className="dash-label">หมายเหตุ</label>
                  <textarea
                    className="dash-textarea"
                    rows={2}
                    placeholder="รายละเอียดเพิ่มเติม..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem', background: 'var(--dash-surface-solid)', borderTop: '1px solid var(--dash-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 700 }}>
                <span>รวมทั้งหมด</span>
                <span style={{ color: 'var(--dash-primary)' }}>{totalDispense} {dispenseList[0]?.unit || 'ชิ้น'}</span>
              </div>
              <button
                onClick={() => void handleSubmit()}
                className="dash-btn dash-btn-success dash-btn-block dash-btn-lg"
                disabled={loading || !recipient.trim() || dispenseList.length === 0}
              >
                {loading ? '🔄 กำลังบันทึก...' : <><Send size={18} /> ยืนยันการเบิกจ่าย</>}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .dash-grid[style*="repeat(auto-fit, minmax(280px, 1fr))"] {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          }
        }
        @media (max-width: 900px) {
          .dash-grid[style*="420px"] {
            grid-template-columns: 1fr !important;
          }
          /* On mobile, make the list section fixed bottom or full width */
        }
      `}</style>
    </DashboardLayout>
  );
}