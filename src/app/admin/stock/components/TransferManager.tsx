'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Package, ArrowRight, Search, CheckCircle2 } from 'lucide-react';
import styles from './TransferManager.module.css';

interface Shelter {
  shelterId: string;
  shelterName: string;
  shelterCode: string;
}

interface Stock {
  _id: string;
  itemName: string;
  category: string;
  unit: string;
  provincialStock: number;
  totalQuantity: number;
}

interface Props {
  onSuccess: () => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  // Stock Model มี 4 หมวดหลัก
  'food': '🍚',          // อาหารและเครื่องดื่ม
  'medicine': '💊',      // ยาและเวชภัณฑ์
  'clothing': '👕',      // เสื้อผ้าและผ้าห่ม
  'other': '📦',         // อุปกรณ์อื่นๆ
  // สำหรับกรณีที่ส่งเป็นภาษาไทยมาตรงๆ (จาก StockItem)
  'อาหาร': '🍚',
  'เครื่องดื่ม': '🥤',
  'ยา': '💊',
  'เวชภัณฑ์': '🩺',
  'เสื้อผ้า': '👕',
  'ผ้าห่ม': '🛏️',
  'อุปกรณ์อาบน้ำ': '🚿',
  'อุปกรณ์ทำความสะอาด': '🧹',
  'อื่นๆ': '📦'
};

// ฟังก์ชันเลือกอิโมจิตามชื่อสินค้าและหมวดหมู่
const getItemEmoji = (itemName: string, category: string): string => {
  const name = itemName.toLowerCase();

  // ตรวจสอบจากชื่อสินค้าก่อน (เฉพาะเจาะจง)
  if (name.includes('น้ำ') || name.includes('เครื่องดื่ม') ||
    name.includes('นม') || name.includes('ชา') ||
    name.includes('กาแฟ') || name.includes('โค้ก') ||
    name.includes('เป๊ปซี่') || name.includes('น้ำผลไม้')) {
    return '🍶'; // เครื่องดื่ม
  }

  if (name.includes('ข้าว') || name.includes('ก๋วยเตี๋ยว') ||
    name.includes('มาม่า') || name.includes('บะหมี่')) {
    return '🍚'; // อาหาร
  }

  if (name.includes('ผ้าห่ม') || name.includes('ผ้าปู')) {
    return '🛏️'; // ผ้าห่ม
  }

  if (name.includes('สบู่') || name.includes('ยาสีฟัน') || name.includes('แปรงสีฟัน')) {
    return '🪥'; // อุปกรณ์อาบน้ำ
  }

  if (name.includes('ผงซักฟอก') || name.includes('น้ำยา') ||
    name.includes('ไม้กวาด') || name.includes('ถังขยะ')) {
    return '🧹'; // อุปกรณ์ทำความสะอาด
  }

  if (name.includes('ยา') || name.includes('พาร') || name.includes('แอสไพริน')) {
    return '💊'; // ยา
  }

  if (name.includes('ผ้าพัน') || name.includes('ก๊อซ') ||
    name.includes('เทอร์โม') || name.includes('หน้ากาก')) {
    return '🩺'; // เวชภัณฑ์
  }

  // ถ้าไม่เจอจากชื่อ ใช้ตาม category
  const categoryDisplay = getCategoryDisplay(category);
  return CATEGORY_EMOJI[categoryDisplay] || CATEGORY_EMOJI[category] || '📦';
};

const getCategoryDisplay = (category: string): string => {
  // ถ้ามีใน CATEGORY_EMOJI แล้วแสดงว่าเป็นภาษาไทยอยู่แล้ว หรือเป็น English enum
  if (CATEGORY_EMOJI[category]) {
    // ถ้าเป็น English enum แปลงเป็นภาษาไทยแบบเต็ม (ครอบคลุม)
    const thaiCategoryMap: Record<string, string> = {
      'food': 'อาหารและเครื่องดื่ม',
      'medicine': 'ยาและเวชภัณฑ์',
      'clothing': 'เสื้อผ้าและผ้าห่ม',
      'other': 'อุปกรณ์และอื่นๆ'
    };
    return thaiCategoryMap[category] || category;
  }

  // ถ้าไม่เจอเลย ส่งกลับค่าเดิม
  return category;
};

export default function TransferManager({ onSuccess }: Props) {
  const toast = useToast();
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Step states
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
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

  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock);
    setCurrentStep(2);
    setQuantity('');
  };

  const handleSubmit = async () => {
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
      setCurrentStep(1);

      toast.success('โอนสต๊อกสำเร็จ! ✅');
      await fetchStocks();
      onSuccess();

    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'เกิดข้อผิดพลาดในการโอนสต๊อก');
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocks.filter(stock =>
    stock.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fromShelterName = fromShelterId === 'provincial'
    ? 'กองกลางจังหวัด'
    : shelters.find(s => s.shelterId === fromShelterId)?.shelterName || '';

  const toShelterName = shelters.find(s => s.shelterId === toShelterId)?.shelterName || '';

  return (
    <div className={styles.container}>
      {/* Progress Steps */}
      <div className={styles.stepsContainer}>
        <div className={`${styles.step} ${currentStep >= 1 ? styles.stepActive : ''}`}>
          <div className={styles.stepNumber}>
            {currentStep > 1 ? <CheckCircle2 size={24} /> : '1'}
          </div>
          <div className={styles.stepLabel}>เลือกสินค้า</div>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.step} ${currentStep >= 2 ? styles.stepActive : ''}`}>
          <div className={styles.stepNumber}>
            {currentStep > 2 ? <CheckCircle2 size={24} /> : '2'}
          </div>
          <div className={styles.stepLabel}>ระบุจำนวน</div>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.step} ${currentStep >= 3 ? styles.stepActive : ''}`}>
          <div className={styles.stepNumber}>3</div>
          <div className={styles.stepLabel}>เลือกจุดหมาย</div>
        </div>
      </div>

      {/* Step 1: Select Stock */}
      {currentStep === 1 && (
        <div className={styles.stepContent}>
          <div className={styles.stepHeader}>
            <h2 className={styles.stepTitle}>
              <Package size={28} />
              เลือกสินค้าที่ต้องการโอน
            </h2>
            <p className={styles.stepSubtitle}>คลิกที่การ์ดเพื่อเลือกสินค้า</p>
          </div>

          {/* Search */}
          <div className={styles.searchBox}>
            <Search size={20} />
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Stock Grid */}
          {loadingStocks ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredStocks.length > 0 ? (
            <div className={styles.stockGrid}>
              {filteredStocks.map((stock) => {
                const categoryDisplay = getCategoryDisplay(stock.category);
                const emoji = getItemEmoji(stock.itemName, stock.category);
                return (
                  <button
                    key={stock._id}
                    className={styles.stockCard}
                    onClick={() => handleSelectStock(stock)}
                    type="button"
                  >
                    <div className={styles.stockEmoji}>
                      {emoji}
                    </div>
                    <div className={styles.stockInfo}>
                      <div className={styles.stockName}>{stock.itemName}</div>
                      <div className={styles.stockMeta}>
                        <span className={styles.stockCategory}>
                          {categoryDisplay}
                        </span>
                      </div>
                    </div>
                    <div className={styles.stockQuantity}>
                      <div className={styles.stockQtyLabel}>กองกลาง</div>
                      <div className={styles.stockQtyValue}>
                        {stock.provincialStock.toLocaleString()} <span>{stock.unit}</span>
                      </div>
                    </div>
                    <ArrowRight className={styles.stockArrow} size={20} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Package size={64} style={{ opacity: 0.3 }} />
              <p>ไม่พบสินค้า</p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Enter Quantity */}
      {currentStep === 2 && selectedStock && (
        <div className={styles.stepContent}>
          <div className={styles.stepHeader}>
            <h2 className={styles.stepTitle}>
              📦 {selectedStock.itemName}
            </h2>
            <p className={styles.stepSubtitle}>ระบุจำนวนที่ต้องการโอน</p>
          </div>

          <div className={styles.selectedStockInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>สต็อกกองกลาง</span>
              <span className={styles.infoValue}>
                {selectedStock.provincialStock.toLocaleString()} {selectedStock.unit}
              </span>
            </div>
          </div>

          <div className={styles.quantityInput}>
            <label className={styles.label}>จำนวนที่โอน</label>
            <div className={styles.inputWithUnit}>
              <input
                type="number"
                className={styles.input}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                max={selectedStock.provincialStock}
                placeholder="0"
                autoFocus
              />
              <span className={styles.unitBadge}>{selectedStock.unit}</span>
            </div>
            <small className={styles.hint}>
              สูงสุด: {selectedStock.provincialStock.toLocaleString()} {selectedStock.unit}
            </small>
          </div>

          <div className={styles.stepActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => {
                setCurrentStep(1);
                setSelectedStock(null);
                setQuantity('');
              }}
            >
              ← ย้อนกลับ
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => {
                if (!quantity || parseFloat(quantity) <= 0) {
                  toast.warning('กรุณาระบุจำนวน');
                  return;
                }
                setCurrentStep(3);
              }}
              disabled={!quantity || parseFloat(quantity) <= 0}
            >
              ถัดไป →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Destination */}
      {currentStep === 3 && selectedStock && (
        <div className={styles.stepContent}>
          <div className={styles.stepHeader}>
            <h2 className={styles.stepTitle}>
              🎯 เลือกจุดหมายปลายทาง
            </h2>
            <p className={styles.stepSubtitle}>เลือกศูนย์พักพิงที่ต้องการโอนไป</p>
          </div>

          {/* Transfer Summary */}
          <div className={styles.transferSummary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>สินค้า</span>
              <span className={styles.summaryValue}>{selectedStock.itemName}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>จำนวน</span>
              <span className={styles.summaryValue}>
                {quantity} {selectedStock.unit}
              </span>
            </div>
          </div>

          {/* From/To Selection */}
          <div className={styles.routeSelection}>
            <div className={styles.formGroup}>
              <label className={styles.label}>จาก</label>
              <div className={styles.staticSource}>
                <div className={styles.sourceIcon}>🏛️</div>
                <div className={styles.sourceInfo}>
                  <div className={styles.sourceName}>กองกลางจังหวัด</div>
                </div>
              </div>
            </div>

            <div className={styles.arrowIcon}>
              <ArrowRight size={24} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>ไปยัง</label>
              <select
                className={styles.select}
                value={toShelterId}
                onChange={(e) => setToShelterId(e.target.value)}
              >
                <option value="">-- เลือกศูนย์ปลายทาง --</option>
                {shelters
                  .filter(s => s.shelterId !== fromShelterId)
                  .map(s => (
                    <option key={s.shelterId} value={s.shelterId}>
                      🏠 {s.shelterName}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className={styles.formGroup}>
            <label className={styles.label}>หมายเหตุ (ถ้ามี)</label>
            <textarea
              className={styles.textarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ระบุข้อมูลเพิ่มเติม..."
              rows={3}
            />
          </div>

          {/* Final Summary */}
          {toShelterId && (
            <div className="dash-alert dash-alert-info" style={{ marginTop: '1.5rem' }}>
              <strong>📋 สรุปการโอน</strong>
              <div style={{ marginTop: '0.75rem', fontSize: '0.9375rem', lineHeight: '1.6' }}>
                โอน <strong>{selectedStock.itemName}</strong> จำนวน{' '}
                <strong>{quantity} {selectedStock.unit}</strong>
                <br />
                จาก <strong>{fromShelterName}</strong> → <strong>{toShelterName}</strong>
              </div>
            </div>
          )}

          <div className={styles.stepActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setCurrentStep(2)}
              disabled={loading}
            >
              ← ย้อนกลับ
            </button>
            <button
              type="button"
              className={styles.btnSuccess}
              onClick={handleSubmit}
              disabled={loading || !toShelterId}
            >
              {loading ? '⏳ กำลังโอน...' : '✅ ยืนยันโอนสต๊อก'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
