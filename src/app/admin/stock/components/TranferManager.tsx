// src/app/(admin)/admin/stock/components/TransferManager.tsx
'use client';

import { useState, useEffect } from 'react';
import styles from './TransferManager.module.css';

interface Shelter {
  shelterId: string;
  shelterName: string;
  shelterCode: string;
}

interface Props {
  onSuccess: () => void;
}

export default function TransferManager({ onSuccess }: Props) {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [stockId, setStockId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [fromShelterId, setFromShelterId] = useState<string>('provincial');
  const [toShelterId, setToShelterId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShelters();
  }, []);

  const fetchShelters = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/admin/all-shelters', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setShelters(data.shelters.map((s: any) => ({
          shelterId: s.shelterId,
          shelterName: s.shelterName,
          shelterCode: s.shelterCode
        })));
      }
    } catch (err) {
      console.error('Failed to fetch shelters');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!stockId || !quantity || !toShelterId) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (fromShelterId === toShelterId) {
      setError('ไม่สามารถโอนไปยังศูนย์เดียวกันได้');
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
      const res = await fetch('/api/stock/admin/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stockId,
          quantity: qty,
          fromShelterId,
          toShelterId,
          notes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'เกิดข้อผิดพลาด');
      }

      // รีเซ็ตฟอร์ม
      setStockId('');
      setQuantity('');
      setFromShelterId('provincial');
      setToShelterId('');
      setNotes('');

      alert('โอนสต๊อกสำเร็จ');
      onSuccess();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>โอนสต๊อกระหว่างศูนย์</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label>รหัสสินค้า *</label>
          <input
            type="text"
            value={stockId}
            onChange={(e) => setStockId(e.target.value)}
            placeholder="กรอกรหัสสินค้า"
            disabled={loading}
            required
          />
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
          <label>จาก *</label>
          <select
            value={fromShelterId}
            onChange={(e) => setFromShelterId(e.target.value)}
            disabled={loading}
            required
          >
            <option value="provincial">กองกลางจังหวัด</option>
            {shelters.map(s => (
              <option key={s.shelterId} value={s.shelterId}>
                {s.shelterName} ({s.shelterCode})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.transferArrow}>↓</div>

        <div className={styles.field}>
          <label>ไปยัง *</label>
          <select
            value={toShelterId}
            onChange={(e) => setToShelterId(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">-- เลือกศูนย์ปลายทาง --</option>
            {shelters
              .filter(s => s.shelterId !== fromShelterId)
              .map(s => (
                <option key={s.shelterId} value={s.shelterId}>
                  {s.shelterName} ({s.shelterCode})
                </option>
              ))}
          </select>
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
          disabled={loading || !stockId || !quantity || !toShelterId}
        >
          {loading ? 'กำลังโอน...' : 'ยืนยันโอน'}
        </button>
      </form>
    </div>
  );
}