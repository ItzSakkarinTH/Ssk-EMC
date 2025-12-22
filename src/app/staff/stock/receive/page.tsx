'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Package,
  TrendingUp,
  FileText,
  Plus,
  Minus,
  Trash2,
  Send,
  ArrowLeft
} from 'lucide-react';

interface StockItem {
  _id: string;
  itemName: string;
  category: string;
  unit: string;
  currentQuantity?: number;
}

interface ReceiveItem {
  stockId: string;
  itemName: string;
  unit: string;
  quantity: number;
}

export default function ReceivePage() {
  const router = useRouter();
  const { success, error: showError, confirm } = useToast();

  const [availableStock, setAvailableStock] = useState<StockItem[]>([]);
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([]);
  const [from, setFrom] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStock, setLoadingStock] = useState(true);

  useEffect(() => {
    void fetchAvailableStock();
  }, []);

  const fetchAvailableStock = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/staff/my-shelter', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setAvailableStock(data.stock || []);
      } else {
        showError('ไม่สามารถโหลดรายการสต็อกได้');
      }
    } catch (error) {
      console.error(error);
      showError('เกิดข้อผิดพลาด');
    } finally {
      setLoadingStock(false);
    }
  };

  const addToReceive = (stock: StockItem) => {
    const existing = receiveItems.find(item => item.stockId === stock._id);
    if (existing) {
      setReceiveItems(prev =>
        prev.map(item =>
          item.stockId === stock._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setReceiveItems(prev => [
        ...prev,
        {
          stockId: stock._id,
          itemName: stock.itemName,
          unit: stock.unit,
          quantity: 1
        }
      ]);
    }
  };

  const updateQuantity = (stockId: string, delta: number) => {
    setReceiveItems(prev =>
      prev.map(item => {
        if (item.stockId === stockId) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: Math.max(1, newQty) };
        }
        return item;
      })
    );
  };

  const removeItem = (stockId: string) => {
    setReceiveItems(prev => prev.filter(item => item.stockId !== stockId));
  };

  const handleSubmit = async () => {
    if (receiveItems.length === 0) {
      showError('กรุณาเลือกสินค้าที่ต้องการรับเข้า');
      return;
    }

    if (!from.trim()) {
      showError('กรุณาระบุแหล่งที่มา');
      return;
    }

    const confirmed = await confirm({
      title: 'ยืนยันการรับเข้าสต็อก',
      message: `ต้องการรับเข้าสินค้า ${receiveItems.length} รายการใช่หรือไม่?`,
      confirmText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      type: 'info'
    });

    if (!confirmed) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/staff/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: receiveItems,
          from: from.trim(),
          referenceId: referenceId.trim() || undefined,
          notes: notes.trim() || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'เกิดข้อผิดพลาด');
      }

      success('รับเข้าสต็อกสำเร็จ!');
      router.push('/staff/stock');

    } catch (err: unknown) {
      const error = err as Error;
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
        return '🍚';
      case 'medicine':
        return '💊';
      case 'clothing':
        return '👕';
      default:
        return '📦';
    }
  };

  if (loadingStock) {
    return (
      <DashboardLayout title="รับเข้าสต็อก" subtitle="บันทึกรายการสินค้าที่รับเข้าศูนย์">
        <div className="dash-loading">
          <div className="dash-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="รับเข้าสต็อก" subtitle="บันทึกรายการสินค้าที่รับเข้าศูนย์">
      {/* Back Button */}
      <button
        onClick={() => router.push('/staff/stock')}
        className="dash-btn dash-btn-secondary"
        style={{
          marginBottom: '1.5rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <ArrowLeft size={18} />
        กลับ
      </button>

      {/* Info Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Package size={24} style={{ color: '#3b82f6' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.5rem' }}>
            รับเข้าสต็อกจากแหล่งภายนอก
          </h3>
          <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', lineHeight: 1.6 }}>
            หน้านี้ใช้สำหรับบันทึกการรับสินค้าจาก <strong>แหล่งภายนอก</strong> เท่านั้น เช่น:
            รับบริจาคจากประชาชน, รับบริจาคจากบริษัท, หรือรับจากหน่วยงานอื่น
          </p>
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            display: 'inline-block'
          }}>
            <span style={{ color: '#fbbf24', fontSize: '0.875rem' }}>
              💡 <strong>ต้องการขอสต็อกจากกองกลางจังหวัด?</strong> กรุณาใช้หน้า{' '}
              <button
                onClick={() => router.push('/staff/stock/request')}
                style={{
                  color: '#60a5fa',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  font: 'inherit'
                }}
              >
                ขอสต็อกจากจังหวัด
              </button>{' '}
              แทน
            </span>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Available Stock */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">
              <Package size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              เลือกสินค้า
            </h3>
            <span className="dash-badge dash-badge-primary">{availableStock.length} รายการ</span>
          </div>
          <div className="dash-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
              {availableStock.map((stock, index) => (
                <div
                  key={stock._id || `stock-${index}`}
                  className="dash-card"
                  style={{
                    padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => addToReceive(stock)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)';
                    e.currentTarget.style.borderColor = '';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                        {getCategoryEmoji(stock.category)} {stock.category}
                      </div>
                      <div style={{ fontWeight: 600, color: '#f1f5f9' }}>
                        {stock.itemName}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                        หน่วย: {stock.unit}
                      </div>
                    </div>
                    <Plus size={20} style={{ color: '#3b82f6' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Receive List */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">
              <TrendingUp size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              รายการรับเข้า
            </h3>
            <span className="dash-badge dash-badge-success">{receiveItems.length} รายการ</span>
          </div>
          <div className="dash-card-body">
            {receiveItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <Package size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>คลิกเลือกสินค้าจากรายการด้านซ้าย</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
                {receiveItems.map(item => (
                  <div
                    key={item.stockId}
                    className="dash-card"
                    style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.05)' }}
                  >
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: '0.25rem' }}>
                        {item.itemName}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                        หน่วย: {item.unit}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        onClick={() => updateQuantity(item.stockId, -1)}
                        className="dash-btn-icon"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}
                      >
                        <Minus size={16} />
                      </button>
                      <div style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#22c55e'
                      }}>
                        {item.quantity}
                      </div>
                      <button
                        onClick={() => updateQuantity(item.stockId, 1)}
                        className="dash-btn-icon"
                        style={{
                          background: 'rgba(34, 197, 94, 0.1)',
                          color: '#22c55e',
                          border: '1px solid rgba(34, 197, 94, 0.2)'
                        }}
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => removeItem(item.stockId)}
                        className="dash-btn-icon"
                        style={{
                          background: 'rgba(148, 163, 184, 0.1)',
                          color: '#94a3b8',
                          border: '1px solid rgba(148, 163, 184, 0.2)'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Details */}
      <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-card-header">
          <h3 className="dash-card-title">
            <FileText size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            รายละเอียดการรับเข้า
          </h3>
        </div>
        <div className="dash-card-body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            <div className="dash-form-group">
              <label className="dash-label">
                แหล่งที่มา <span className="dash-required">*</span>
              </label>
              <input
                type="text"
                className="dash-input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="เช่น: บริจาคจาก บริษัท ABC, โอนจากจังหวัด"
                disabled={loading}
              />
            </div>

            <div className="dash-form-group">
              <label className="dash-label">
                เลขที่ใบรับ <span style={{ color: '#64748b', fontWeight: 400 }}>(ถ้ามี)</span>
              </label>
              <input
                type="text"
                className="dash-input"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="เช่น: RCV-20250122-001"
                disabled={loading}
              />
            </div>
          </div>

          <div className="dash-form-group" style={{ marginTop: '1.5rem' }}>
            <label className="dash-label">
              หมายเหตุ <span style={{ color: '#64748b', fontWeight: 400 }}>(ถ้ามี)</span>
            </label>
            <textarea
              className="dash-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เพิ่มรายละเอียดเพิ่มเติม..."
              rows={3}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          onClick={() => router.push('/staff/stock')}
          className="dash-btn dash-btn-secondary dash-btn-lg"
          disabled={loading}
        >
          ยกเลิก
        </button>
        <button
          onClick={() => void handleSubmit()}
          className="dash-btn dash-btn-success dash-btn-lg"
          disabled={loading || receiveItems.length === 0 || !from.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Send size={20} />
          {loading ? 'กำลังบันทึก...' : 'ยืนยันรับเข้าสต็อก'}
        </button>
      </div>
    </DashboardLayout>
  );
}