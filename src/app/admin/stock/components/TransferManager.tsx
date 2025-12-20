
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
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
  const toast = useToast();
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [stockId, setStockId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [fromShelterId, setFromShelterId] = useState<string>('provincial');
  const [toShelterId, setToShelterId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

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
        setShelters(data.shelters.map((s: { shelterId: string; shelterName: string; shelterCode: string }) => ({
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

    if (!stockId || !quantity || !toShelterId) {
      toast.warning('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (fromShelterId === toShelterId) {
      toast.warning('ไม่สามารถโอนไปยังศูนย์เดียวกันได้');
      return;
    }

    const qty = parseFloat(quantity);
    if (qty <= 0) {
      toast.warning('จำนวนต้องมากกว่า 0');
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

      toast.success('โอนสต๊อกสำเร็จ! ✅');
      onSuccess();

    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'เกิดข้อผิดพลาดในการโอนสต๊อก');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.transferForm}>
        <h2 className={styles.formTitle}>โอนสต๊อกระหว่างศูนย์</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={`${styles.label} ${styles.required}`}>รหัสสินค้า</label>
              <input
                type="text"
                className={styles.input}
                value={stockId}
                onChange={(e) => setStockId(e.target.value)}
                placeholder="กรอกรหัสสินค้า"
                disabled={loading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={`${styles.label} ${styles.required}`}>จำนวน</label>
              <input
                type="number"
                className={styles.input}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                step="1"
                disabled={loading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={`${styles.label} ${styles.required}`}>จาก</label>
              <select
                className={styles.select}
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

            <div className={styles.formGroup}>
              <label className={`${styles.label} ${styles.required}`}>ไปยัง</label>
              <select
                className={styles.select}
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
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>หมายเหตุ</label>
            <textarea
              className={styles.textarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เพิ่มเติม (ถ้ามี)"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !stockId || !quantity || !toShelterId}
            >
              {loading ? 'กำลังโอน...' : 'ยืนยันโอน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
