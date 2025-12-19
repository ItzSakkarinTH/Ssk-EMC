
'use client';

import { useState, useEffect } from 'react';
import styles from './QuickReceive.module.css';

interface StockOption {
  stockId: string;
  itemName: string;
  category: string;
}

interface Props {
  onSuccess: () => void;
}

export default function QuickReceive({ onSuccess }: Props) {
  const [allStocks, setAllStocks] = useState<StockOption[]>([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [quantity, setQuantity] = useState('');
  const [from, setFrom] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllStocks();
  }, []);

  const fetchAllStocks = async () => {
    try {
      const res = await fetch('/api/stock/public/overview');
      if (res.ok) {
        // ใช้ public API เพื่อดูรายการสินค้าทั้งหมด
        // หรือสร้าง API เฉพาะสำหรับดึงรายชื่อสินค้า
        const data = await res.json();
        // ตัวอย่าง: ในระบบจริงต้องมี API ที่ return รายการสินค้าทั้งหมด
        setAllStocks([]);
      }
    } catch (err) {
      console.error('Failed to fetch stocks');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedStock || !quantity || !from) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const qty = parseFloat(quantity);
    if (qty <= 0) {
      setError('จำนวนต้องมากกว่า 0');
      return;
    }

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
          stockId: selectedStock,
          quantity: qty,
          from,
          referenceId,
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
      setFrom('');
      setReferenceId('');
      setNotes('');

      alert(`รับเข้าสำเร็จ\nสต๊อกใหม่: ${result.newQuantity}`);
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
      <h2>รับเข้าสต๊อก</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label>รหัสสินค้า / ชื่อสินค้า *</label>
          <input
            type="text"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            placeholder="กรอกรหัสหรือชื่อสินค้า"
            disabled={loading}
            required
          />
          <small>หรือเลือกจากระบบถ้ามี dropdown</small>
        </div>

        <div className={styles.field}>
          <label>จำนวน *</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            step="1"
            disabled={loading}
            required
          />
        </div>

        <div className={styles.field}>
          <label>แหล่งที่มา *</label>
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="เช่น: บริจาคจาก ..., โอนจากจังหวัด"
            disabled={loading}
            required
          />
        </div>

        <div className={styles.field}>
          <label>เลขที่ใบรับ</label>
          <input
            type="text"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            placeholder="เช่น: RCV-20250101-001"
            disabled={loading}
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
          disabled={loading || !selectedStock || !quantity || !from}
        >
          {loading ? 'กำลังบันทึก...' : 'ยืนยันรับเข้า'}
        </button>
      </form>
    </div>
  );
}