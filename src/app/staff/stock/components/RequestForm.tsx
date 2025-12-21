'use client';

import { useState, useEffect } from 'react';
import styles from './RequestForm.module.css';

interface StockItem {
  _id: string;
  itemName: string;
  provincialStock: number;
  unit: string;
  category: string;
}

interface RequestItem {
  stockId: string;
  itemName: string;
  quantity: number;
  reason: string;
  unit: string;
}

interface Props {
  onSuccess: () => void;
}

export default function RequestForm({ onSuccess }: Props) {
  const [availableStock, setAvailableStock] = useState<StockItem[]>([]);
  const [items, setItems] = useState<RequestItem[]>([
    { stockId: '', itemName: '', quantity: 0, reason: '', unit: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingStock, setLoadingStock] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableStock();
  }, []);

  const fetchAvailableStock = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/admin?provincial=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setAvailableStock(data.stock || []);
      }
    } catch (err) {
      console.error('Failed to fetch stock', err);
      setError('ไม่สามารถโหลดข้อมูลสต๊อกได้');
    } finally {
      setLoadingStock(false);
    }
  };

  const addItem = () => {
    setItems([...items, { stockId: '', itemName: '', quantity: 0, reason: '', unit: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof RequestItem, value: string | number) => {
    const updated = [...items];

    // ถ้าเลือกสินค้า ให้เติมข้อมูลอัตโนมัติ
    if (field === 'stockId') {
      const selectedStock = availableStock.find(s => s._id === value);
      if (selectedStock) {
        updated[index] = {
          ...updated[index],
          stockId: value as string,
          itemName: selectedStock.itemName,
          unit: selectedStock.unit
        };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    for (const item of items) {
      if (!item.stockId || !item.quantity || !item.reason) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วนในทุกรายการ');
        return;
      }
      if (item.quantity <= 0) {
        setError('จำนวนต้องมากกว่า 0');
        return;
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
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

      let message = `ยื่นคำร้องสำเร็จ\nเลขที่: ${result.requestNumber}\nสถานะ: รอพิจารณา`;

      if (result.warnings && result.warnings.length > 0) {
        message += '\n\n⚠️ คำเตือน:\n' + result.warnings.join('\n');
      }

      alert(message);

      // รีเซ็ตฟอร์ม
      setItems([{ stockId: '', itemName: '', quantity: 0, reason: '', unit: '' }]);
      onSuccess();

    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingStock) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner"></div>
        <p>กำลังโหลดข้อมูลสินค้า...</p>
      </div>
    );
  }

  // จัดกลุ่มสินค้าตามหมวดหมู่
  const categoryLabels: Record<string, string> = {
    food: '🍚 อาหาร',
    medicine: '💊 ยา',
    clothing: '👕 เสื้อผ้า',
    other: '📦 อื่นๆ'
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className="dash-alert dash-alert-error">{error}</div>}

        <div className={styles.itemsList}>
          {items.map((item, index) => {
            const selectedStock = availableStock.find(s => s._id === item.stockId);

            return (
              <div key={index} className={styles.itemCard}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemNumber}>รายการที่ {index + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="dash-btn dash-btn-sm dash-btn-danger"
                      disabled={loading}
                    >
                      ✕ ลบ
                    </button>
                  )}
                </div>

                <div className={styles.field}>
                  <label className="dash-label">
                    เลือกสินค้า <span className="dash-required">*</span>
                  </label>
                  <select
                    value={item.stockId}
                    onChange={(e) => updateItem(index, 'stockId', e.target.value)}
                    className="dash-select"
                    disabled={loading}
                    required
                  >
                    <option value="">-- เลือกสินค้า --</option>
                    {Object.keys(categoryLabels).map(category => {
                      const categoryItems = availableStock.filter(s => s.category === category);
                      if (categoryItems.length === 0) return null;

                      return (
                        <optgroup key={category} label={categoryLabels[category]}>
                          {categoryItems.map(stock => (
                            <option key={stock._id} value={stock._id}>
                              {stock.itemName} (คงเหลือ: {stock.provincialStock} {stock.unit})
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                {selectedStock && (
                  <div className={styles.stockInfo}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>สต๊อกจังหวัด:</span>
                      <span className={styles.infoValue}>
                        {selectedStock.provincialStock} {selectedStock.unit}
                      </span>
                    </div>
                  </div>
                )}

                <div className={styles.field}>
                  <label className="dash-label">
                    จำนวนที่ขอ <span className="dash-required">*</span>
                  </label>
                  <div className={styles.quantityField}>
                    <input
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                      className="dash-input"
                      min="1"
                      step="1"
                      disabled={loading}
                      placeholder="จำนวน"
                      required
                    />
                    {item.unit && <span className={styles.unit}>{item.unit}</span>}
                  </div>
                  {selectedStock && item.quantity > selectedStock.provincialStock && (
                    <div className={styles.warning}>
                      ⚠️ จำนวนที่ขอมากกว่าสต๊อกที่มี อาจได้รับไม่ครบ
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <label className="dash-label">
                    เหตุผลที่ขอ <span className="dash-required">*</span>
                  </label>
                  <textarea
                    value={item.reason}
                    onChange={(e) => updateItem(index, 'reason', e.target.value)}
                    className="dash-textarea"
                    placeholder="ระบุเหตุผลที่ขอ (เช่น: มีผู้ประสบภัยเพิ่ม, สต๊อกหมด, การแจกจ่ายตามแผน)"
                    rows={3}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="dash-btn dash-btn-secondary dash-btn-block"
          disabled={loading}
        >
          + เพิ่มรายการสินค้า
        </button>

        <div className={styles.actions}>
          <button
            type="submit"
            className="dash-btn dash-btn-primary dash-btn-lg"
            disabled={loading}
          >
            {loading ? '🔄 กำลังส่งคำร้อง...' : '✉️ ยืนยันส่งคำร้อง'}
          </button>
        </div>

        <div className={styles.info}>
          <p>💡 <strong>หมายเหตุ:</strong> คำร้องจะถูกส่งไปยังเจ้าหน้าที่ระดับจังหวัดเพื่อพิจารณา</p>
          <p>คุณสามารถตรวจสอบสถานะคำร้องได้ในเมนู &ldquo;ประวัติ&rdquo;</p>
        </div>
      </form>
    </div>
  );
}