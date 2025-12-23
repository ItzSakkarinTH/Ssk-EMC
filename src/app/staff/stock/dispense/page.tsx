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
  User,
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
          className="dash-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={18} />
          ย้อนกลับ
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showList ? '1fr 420px' : '1fr', gap: '1.5rem' }}>
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
              const inList = dispenseList.some(c => c.stockId === item.stockId);
              const categoryColor = getCategoryColor(item.category);
              const statusBadge = getStatusBadge(item.status, item.quantity);

              return (
                <div key={item.stockId} className="dash-card" style={{ padding: '1.5rem', position: 'relative' }}>
                  {statusBadge && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      background: `${statusBadge.color}20`,
                      color: statusBadge.color,
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      <AlertTriangle size={12} />
                      {statusBadge.label}
                    </div>
                  )}

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
                      margin: '0 0 0.75rem 0'
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
                        color: item.quantity <= 10 ? '#ef4444' : '#10b981'
                      }}>
                        {item.quantity}
                      </span>
                      <span style={{ color: '#94a3b8' }}>{item.unit}</span>
                      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>คงเหลือ</span>
                    </div>
                  </div>
                  <button
                    onClick={() => addToList(item)}
                    className={`dash-btn ${inList ? 'dash-btn-secondary' : 'dash-btn-primary'} dash-btn-block`}
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
                        เพิ่มในรายการเบิก
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
              <p style={{ color: '#94a3b8' }}>ไม่พบสินค้าในสต๊อก</p>
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
              {dispenseList.length}
            </span>
          </button>
        )}

        {/* Dispense List Sidebar */}
        {showList && dispenseList.length > 0 && (
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
                รายการเบิก ({dispenseList.length})
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
              {dispenseList.map(item => {
                const categoryColor = getCategoryColor(item.category);
                return (
                  <div key={item.stockId} className="dash-card" style={{
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
                        <span style={{
                          fontSize: '0.8125rem',
                          color: item.quantity <= 10 ? '#ef4444' : '#94a3b8'
                        }}>
                          คงเหลือ: {item.quantity} {item.unit}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFromList(item.stockId)}
                        className="dash-btn-icon"
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="dash-form-group">
                      <label className="dash-label" style={{ fontSize: '0.875rem' }}>จำนวนที่เบิก</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.stockId, item.dispenseQty - 1)}
                          className="dash-btn dash-btn-sm"
                          disabled={item.dispenseQty <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          className="dash-input"
                          style={{ width: '80px', textAlign: 'center' }}
                          value={item.dispenseQty}
                          onChange={(e) => updateQuantity(item.stockId, parseInt(e.target.value) || 1)}
                          min={1}
                          max={item.quantity}
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.stockId, item.dispenseQty + 1)}
                          className="dash-btn dash-btn-sm"
                          disabled={item.dispenseQty >= item.quantity}
                        >
                          <Plus size={14} />
                        </button>
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{item.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Recipient Information */}
              <div className="dash-card" style={{
                padding: '1rem',
                marginBottom: '1rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderLeft: '3px solid #10b981'
              }}>
                <h4 style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#f1f5f9',
                  margin: '0 0 1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <User size={18} />
                  ข้อมูลผู้รับสินค้า
                </h4>

                <div className="dash-form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="dash-label" style={{ fontSize: '0.875rem' }}>
                    ผู้รับ / ครอบครัว <span className="dash-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="dash-input"
                    placeholder="ชื่อผู้รับ หรือ หมายเลขครอบครัว"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
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

              {/* Summary */}
              <div style={{
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '12px',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#cbd5e1'
                }}>
                  <span>รายการทั้งหมด</span>
                  <span style={{ fontWeight: 700 }}>{dispenseList.length} รายการ</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#f1f5f9',
                  marginTop: '0.5rem'
                }}>
                  <span style={{ fontWeight: 600 }}>จำนวนเบิกรวม</span>
                  <span style={{
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    color: '#3b82f6'
                  }}>{totalDispense} ชิ้น</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => void handleSubmit()}
              className="dash-btn dash-btn-success dash-btn-lg dash-btn-block"
              disabled={loading || !recipient.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <>🔄 กำลังเบิกจ่าย...</>
              ) : (
                <>
                  <Send size={20} />
                  ยืนยันเบิกจ่าย
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}