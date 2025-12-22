'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Package,
  Plus,
  Minus,
  Trash2,
  ClipboardList,
  Send,
  ArrowLeft,
  Search,
  Filter
} from 'lucide-react';

interface StockItem {
  _id: string;
  itemName: string;
  category: string;
  unit: string;
  currentQuantity?: number;
}

interface ReceiveItem extends StockItem {
  quantity: number;
}

export default function ReceivePage() {
  const router = useRouter();
  const { success, error: showError, warning, info } = useToast();

  const [availableStock, setAvailableStock] = useState<StockItem[]>([]);
  const [receiveList, setReceiveList] = useState<ReceiveItem[]>([]);
  const [from, setFrom] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
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
    const existing = receiveList.find(c => c._id === item._id);
    if (existing) {
      warning('สินค้านี้อยู่ในรายการแล้ว');
      setShowList(true);
      return;
    }
    setReceiveList([...receiveList, { ...item, quantity: 1 }]);
    success(`เพิ่ม ${item.itemName} ในรายการแล้ว`);
  };

  const removeFromList = (id: string) => {
    setReceiveList(receiveList.filter(item => item._id !== id));
    info('ลบออกจากรายการแล้ว');
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return;
    setReceiveList(receiveList.map(item =>
      item._id === id ? { ...item, quantity } : item
    ));
  };

  const handleSubmit = async () => {
    // Validation
    if (receiveList.length === 0) {
      showError('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ');
      return;
    }

    if (!from.trim()) {
      showError('กรุณาระบุแหล่งที่มา');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const items = receiveList.map(c => ({
        stockId: c._id,
        itemName: c.itemName,
        quantity: c.quantity,
        unit: c.unit
      }));

      const res = await fetch('/api/stock/staff/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items,
          from,
          referenceId,
          notes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'เกิดข้อผิดพลาด');
      }

      success('บันทึกการรับสินค้าสำเร็จ!');
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

  if (loadingStock) {
    return (
      <DashboardLayout
        title="รับสินค้าเข้าคลัง"
        subtitle="บันทึกการรับสินค้าจากแหล่งต่างๆ"
      >
        <div className="dash-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
          <p style={{ color: '#94a3b8' }}>กำลังโหลดสินค้า...</p>
        </div>
      </DashboardLayout>
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

  const categories = ['food', 'medicine', 'clothing', 'shelter', 'hygiene', 'education', 'tools', 'electronics', 'other'];

  return (
    <DashboardLayout
      title="รับสินค้าเข้าคลัง"
      subtitle="บันทึกการรับสินค้าจากแหล่งต่างๆ"
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => router.back()}
          className="dash-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={18} />
          ย้อนกลับ
        </button>
      </div>

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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredItems.map(item => {
              const inList = receiveList.some(c => c._id === item._id);
              const categoryColor = getCategoryColor(item.category);

              return (
                <div key={item._id} className="dash-card" style={{ padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      background: `${categoryColor}20`,
                      color: categoryColor,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginBottom: '0.75rem'
                    }}>
                      {getCategoryEmoji(item.category)} {getCategoryLabel(item.category)}
                    </div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: '#f1f5f9',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {item.itemName}
                    </h3>
                    {item.currentQuantity !== undefined && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: '#94a3b8'
                        }}>
                          {item.currentQuantity}
                        </span>
                        <span style={{ color: '#94a3b8' }}>{item.unit}</span>
                        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>ปัจจุบัน</span>
                      </div>
                    )}
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
        {!showList && receiveList.length > 0 && (
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
              {receiveList.length}
            </span>
          </button>
        )}

        {/* Receive List */}
        {showList && receiveList.length > 0 && (
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
                รายการรับ ({receiveList.length})
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
              {/* List Items */}
              {receiveList.map(item => (
                <div key={item._id} className="dash-card" style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: 'rgba(15, 23, 42, 0.5)'
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
                        color: '#f1f5f9',
                        margin: '0 0 0.25rem 0'
                      }}>
                        {getCategoryEmoji(item.category)} {item.itemName}
                      </h4>
                      {item.currentQuantity !== undefined && (
                        <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                          ปัจจุบัน: {item.currentQuantity} {item.unit}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromList(item._id)}
                      className="dash-btn-icon"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="dash-form-group">
                    <label className="dash-label" style={{ fontSize: '0.875rem' }}>จำนวนที่รับ</label>
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
                  </div>
                </div>
              ))}

              {/* Source Information */}
              <div className="dash-card" style={{
                padding: '1rem',
                marginBottom: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderLeft: '3px solid #3b82f6'
              }}>
                <h4 style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#f1f5f9',
                  margin: '0 0 1rem 0'
                }}>
                  ข้อมูลการรับสินค้า
                </h4>

                <div className="dash-form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="dash-label" style={{ fontSize: '0.875rem' }}>
                    แหล่งที่มา <span className="dash-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="dash-input"
                    placeholder="เช่น กองกลางจังหวัด, บริจาค, ..."
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>

                <div className="dash-form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="dash-label" style={{ fontSize: '0.875rem' }}>
                    เลขที่อ้างอิง
                  </label>
                  <input
                    type="text"
                    className="dash-input"
                    placeholder="เลขที่เอกสาร (ถ้ามี)"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>

                <div className="dash-form-group">
                  <label className="dash-label" style={{ fontSize: '0.875rem' }}>
                    หมายเหตุ
                  </label>
                  <textarea
                    className="dash-input"
                    rows={2}
                    placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>
              </div>
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
                <>🔄 กำลังบันทึก...</>
              ) : (
                <>
                  <Send size={20} />
                  บันทึกการรับสินค้า
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}