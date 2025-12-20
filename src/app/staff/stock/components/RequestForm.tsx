
'use client';

import { useState } from 'react';
import styles from './RequestForm.module.css';

interface RequestItem {
  stockId: string;
  itemName: string;
  quantity: number;
  reason: string;
}

interface Props {
  onSuccess: () => void;
}

export default function RequestForm({ onSuccess }: Props) {
  const [items, setItems] = useState<RequestItem[]>([
    { stockId: '', itemName: '', quantity: 0, reason: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => {
    setItems([...items, { stockId: '', itemName: '', quantity: 0, reason: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof RequestItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
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
      setItems([{ stockId: '', itemName: '', quantity: 0, reason: '' }]);
      onSuccess();

    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.itemsList}>
          {items.map((item, index) => (
            <div key={index} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <span>รายการที่ {index + 1}</span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className={styles.removeBtn}
                    disabled={loading}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className={styles.field}>
                <label>รหัสสินค้า *</label>
                <input
                  type="text"
                  value={item.stockId}
                  onChange={(e) => updateItem(index, 'stockId', e.target.value)}
                  placeholder="กรอกรหัสสินค้า"
                  disabled={loading}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>จำนวน *</label>
                <input
                  type="number"
                  value={item.quantity || ''}
                  onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                  min="1"
                  step="1"
                  disabled={loading}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>เหตุผล *</label>
                <textarea
                  value={item.reason}
                  onChange={(e) => updateItem(index, 'reason', e.target.value)}
                  placeholder="ระบุเหตุผลที่ขอ (เช่น: มีผู้ประสบภัยเพิ่ม, สต๊อกหมด)"
                  rows={2}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className={styles.addBtn}
          disabled={loading}
        >
          + เพิ่มรายการ
        </button>

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'กำลังส่งคำร้อง...' : 'ยืนยันส่งคำร้อง'}
          </button>
        </div>
      </form>
    </div>
  );
}