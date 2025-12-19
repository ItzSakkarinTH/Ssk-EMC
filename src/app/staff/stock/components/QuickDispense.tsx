// src/app/(staff)/staff/stock/components/QuickDispense.tsx
'use client';

import { useState } from 'react';
import styles from './QuickDispense.module.css';

interface StockItem {
  stockId: string;
  itemName: string;
  quantity: number;
  unit: string;
  status: string;
}

interface Props {
  shelterStock: StockItem[];
  onSuccess: () => void;
}

export default function QuickDispense({ shelterStock, onSuccess }: Props) {
  const [selectedStock, setSelectedStock] = useState('');
  const [quantity, setQuantity] = useState('');
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = shelterStock.find(s => s.stockId === selectedStock);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedStock || !quantity || !recipient) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const qty = parseFloat(quantity);
    if (qty <= 0) {
      setError('จำนวนต้องมากกว่า 0');
      return;
    }

    if (selectedItem && qty > selectedItem.quantity) {
      setError(`สต๊อกไม่เพียงพอ (มีเพียง ${selectedItem.quantity} ${selectedItem.unit})`);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/staff/dispense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stockId: selectedStock,
          quantity: qty,
          recipient,
          notes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'เกิดข้อผิดพลาด');
      }

      const result = await res.json();

      // รีเซ็ตฟอร์ม
      setSelectedStock('');
      setQuantity('');
      setRecipient('');
      setNotes('');

      // แจ้งเตือนถ้าสต๊อกต่ำ
      if (result.alert) {
        alert(`เบิกจ่ายสำเร็จ\n${result.alert}`);
      } else {
        alert('เบิกจ่ายสำเร็จ');
      }

      onSuccess();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>เบิกจ่ายสินค้า</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label>เลือกสินค้า *</label>
          <select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">-- เลือกสินค้า --</option>
            {shelterStock
              .filter(s => s.quantity > 0)
              .map(s => (
                <option key={s.stockId} value={s.stockId}>
                  {s.itemName} (คงเหลือ {s.quantity} {s.unit})
                  {s.status === 'critical' && ' ⚠️'}
                </option>
              ))}
          </select>
        </div>

        {selectedItem && (
          <div className={styles.stockInfo}>
            <div>สต๊อกคงเหลือ: <strong>{selectedItem.quantity} {selectedItem.unit}</strong></div>
            {selectedItem.status === 'critical' && (
              <div className={styles.warning}>⚠️ สต๊อกอยู่ในระดับวิกฤต</div>
            )}
          </div>
        )}

        <div className={styles.field}>
          <label>จำนวน *</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            step="1"
            disabled={loading || !selectedStock}
            required
          />
        </div>

        <div className={styles.field}>
          <label>ผู้รับ *</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="ชื่อผู้รับ / ครอบครัว / หมายเลข"
            disabled={loading}
            required
          />
        </div>

        <div className={styles.field}>
          <label>หมายเหตุ</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="เพิ่มเติม (ถ้ามี)"
            rows={3}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading || !selectedStock || !quantity || !recipient}
        >
          {loading ? 'กำลังเบิกจ่าย...' : 'ยืนยันเบิกจ่าย'}
        </button>
      </form>
    </div>
  );
}