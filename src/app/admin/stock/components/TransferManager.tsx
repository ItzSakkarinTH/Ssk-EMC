'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Package, ArrowRight } from 'lucide-react';
import styles from './TransferManager.module.css';

interface Shelter {
  shelterId: string;
  shelterName: string;
  shelterCode: string;
}

interface Stock {
  _id: string;
  itemName: string;
  unit: string;
  provincialStock: number;
  totalQuantity: number;
}

interface Props {
  onSuccess: () => void;
}

export default function TransferManager({ onSuccess }: Props) {
  const toast = useToast();
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [quantity, setQuantity] = useState('');
  const [fromShelterId, setFromShelterId] = useState<string>('provincial');
  const [toShelterId, setToShelterId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchShelters();
    fetchStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      console.error('Failed to fetch shelters', err);
    }
  };

  const fetchStocks = async () => {
    setLoadingStocks(true);
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Fetching stocks from /api/stock/admin/province-stock...');

      const res = await fetch('/api/stock/admin/province-stock', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStocks(data.stocks || []);
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลสต็อกได้');
      }
    } catch (err) {
      console.error('Failed to fetch stocks', err);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoadingStocks(false);
    }
  };

  const handleStockChange = (stockId: string) => {
    const stock = stocks.find(s => s._id === stockId);
    setSelectedStock(stock || null);
    setQuantity(''); // Reset quantity
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStock || !quantity || !toShelterId) {
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

    if (fromShelterId === 'provincial' && qty > selectedStock.provincialStock) {
      toast.error(`สต็อกกองกลางมีเพียง ${selectedStock.provincialStock} ${selectedStock.unit}`);
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
          stockId: selectedStock._id,
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
      setSelectedStock(null);
      setQuantity('');
      setFromShelterId('provincial');
      setToShelterId('');
      setNotes('');

      toast.success('โอนสต๊อกสำเร็จ! ✅');
      await fetchStocks(); // Refresh stocks
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
        <h2 className={styles.formTitle}>
          <Package size={24} style={{ color: 'var(--dash-primary)' }} />
          โอนสต๊อกระหว่างศูนย์
        </h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            {/* เลือกสินค้า */}
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={`${styles.label} ${styles.required}`}>สินค้า</label>

              <select
                className={styles.select}
                value={selectedStock?._id || ''}
                onChange={(e) => handleStockChange(e.target.value)}
                disabled={loading || loadingStocks}
                required
              >
                <option value="">
                  {loadingStocks ? '⏳ กำลังโหลด...' : stocks.length === 0 ? '❌ ไม่มีสินค้าในสต็อก' : '-- เลือกสินค้า --'}
                </option>
                {stocks.map(stock => (
                  <option key={stock._id} value={stock._id}>
                    {stock.itemName} (กองกลาง: {stock.provincialStock.toLocaleString()} {stock.unit})
                  </option>
                ))}
              </select>
              {!loadingStocks && stocks.length === 0 && (
                <div className="dash-alert dash-alert-warning" style={{ marginTop: '1rem' }}>
                  <strong>⚠️ ไม่มีสินค้าในสต็อก</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                    กรุณาเพิ่มสินค้าเข้ากองกลางก่อนที่ <a href="/admin/stock/simple" style={{ color: 'var(--dash-primary)', textDecoration: 'underline' }}>หน้าจัดการสต็อก</a>
                  </p>
                </div>
              )}
            </div>

            {/* จำนวน */}
            <div className={styles.formGroup}>
              <label className={`${styles.label} ${styles.required}`}>จำนวนที่โอน</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  className={styles.input}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  max={selectedStock?.provincialStock || undefined}
                  step="1"
                  disabled={loading || !selectedStock}
                  required
                  placeholder="0"
                  style={{ flex: 1 }}
                />
                {selectedStock && (
                  <span style={{ fontWeight: 600, minWidth: '60px' }}>
                    {selectedStock.unit}
                  </span>
                )}
              </div>
              {selectedStock && fromShelterId === 'provincial' && (
                <small style={{ color: 'var(--dash-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  สูงสุด: {selectedStock.provincialStock.toLocaleString()} {selectedStock.unit}
                </small>
              )}
            </div>

            {/* ศูนย์ต้นทาง */}
            <div className={styles.formGroup}>
              <label className={`${styles.label} ${styles.required}`}>จาก</label>
              <select
                className={styles.select}
                value={fromShelterId}
                onChange={(e) => setFromShelterId(e.target.value)}
                disabled={loading}
                required
              >
                <option value="provincial">🏛️ กองกลางจังหวัด</option>
                {shelters.map(s => (
                  <option key={s.shelterId} value={s.shelterId}>
                    {s.shelterName} ({s.shelterCode})
                  </option>
                ))}
              </select>
            </div>

            {/* ศูนย์ปลายทาง */}
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

          {/* หมายเหตุ */}
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

          {/* Summary */}
          {selectedStock && quantity && toShelterId && (
            <div className="dash-alert dash-alert-info" style={{ marginTop: '1.5rem' }}>
              <strong>สรุปการโอน:</strong>
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                โอน <strong>{selectedStock.itemName}</strong> จำนวน <strong>{quantity} {selectedStock.unit}</strong>
                <br />
                จาก <strong>{fromShelterId === 'provincial' ? 'กองกลางจังหวัด' : shelters.find(s => s.shelterId === fromShelterId)?.shelterName}</strong>
                {' '}<ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                <strong>{shelters.find(s => s.shelterId === toShelterId)?.shelterName}</strong>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !selectedStock || !quantity || !toShelterId}
            >
              {loading ? 'กำลังโอน...' : '✅ ยืนยันโอนสต๊อก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
