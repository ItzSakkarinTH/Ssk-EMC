'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Package, ArrowRight, Search, CheckCircle2, Check, X, Minus, Plus, Trash2 } from 'lucide-react';
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

interface SelectedItem {
  stock: Stock;
  quantity: number;
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
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [fromShelterId] = useState<string>('provincial');
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

  // Check if item is selected
  const isItemSelected = useCallback((stockId: string) => {
    return selectedItems.some(item => item.stock._id === stockId);
  }, [selectedItems]);

  // Toggle item selection
  const toggleItemSelection = (stock: Stock) => {
    if (isItemSelected(stock._id)) {
      setSelectedItems(prev => prev.filter(item => item.stock._id !== stock._id));
    } else {
      // Default quantity = 1 หรือ max ถ้าน้อยกว่า 1
      const defaultQty = Math.min(1, stock.provincialStock);
      setSelectedItems(prev => [...prev, { stock, quantity: defaultQty }]);
    }
  };

  // Select all visible items
  const selectAll = () => {
    const newItems: SelectedItem[] = filteredStocks
      .filter(stock => !isItemSelected(stock._id) && stock.provincialStock > 0)
      .map(stock => ({
        stock,
        quantity: Math.min(1, stock.provincialStock)
      }));
    setSelectedItems(prev => [...prev, ...newItems]);
  };

  // Deselect all items
  const deselectAll = () => {
    setSelectedItems([]);
  };

  // Update quantity for an item
  const updateItemQuantity = (stockId: string, newQuantity: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.stock._id === stockId) {
        const clampedQty = Math.max(1, Math.min(newQuantity, item.stock.provincialStock));
        return { ...item, quantity: clampedQty };
      }
      return item;
    }));
  };

  // Remove item from selection
  const removeItem = (stockId: string) => {
    setSelectedItems(prev => prev.filter(item => item.stock._id !== stockId));
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0 || !toShelterId) {
      toast.warning('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (fromShelterId === toShelterId) {
      toast.warning('ไม่สามารถโอนไปยังศูนย์เดียวกันได้');
      return;
    }

    // Validate all quantities
    for (const item of selectedItems) {
      if (item.quantity <= 0) {
        toast.warning(`จำนวนของ ${item.stock.itemName} ต้องมากกว่า 0`);
        return;
      }
      if (item.quantity > item.stock.provincialStock) {
        toast.error(`สต็อก ${item.stock.itemName} มีเพียง ${item.stock.provincialStock} ${item.stock.unit}`);
        return;
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');

      // ส่ง request ทีละ item (หรือจะทำเป็น batch ก็ได้ถ้า API รองรับ)
      let successCount = 0;
      let errorCount = 0;

      for (const item of selectedItems) {
        try {
          const res = await fetch('/api/stock/admin/transfer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              stockId: item.stock._id,
              quantity: item.quantity,
              fromShelterId,
              toShelterId,
              notes
            })
          });

          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
            const err = await res.json();
            console.error(`Failed to transfer ${item.stock.itemName}:`, err.error);
          }
        } catch (err) {
          errorCount++;
          console.error(`Error transferring ${item.stock.itemName}:`, err);
        }
      }

      // รีเซ็ตฟอร์ม
      setSelectedItems([]);
      setToShelterId('');
      setNotes('');
      setCurrentStep(1);

      if (errorCount === 0) {
        toast.success(`โอนสต๊อกสำเร็จ ${successCount} รายการ! ✅`);
      } else if (successCount > 0) {
        toast.warning(`โอนสำเร็จ ${successCount} รายการ, ล้มเหลว ${errorCount} รายการ`);
      } else {
        toast.error('ไม่สามารถโอนสต๊อกได้');
      }

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

  // Calculate total items being transferred
  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

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

      {/* Step 1: Select Multiple Stocks */}
      {currentStep === 1 && (
        <div className={styles.stepContent}>
          <div className={styles.stepHeader}>
            <h2 className={styles.stepTitle}>
              <Package size={28} />
              เลือกสินค้าที่ต้องการโอน
            </h2>
            <p className={styles.stepSubtitle}>คลิกที่การ์ดเพื่อเลือกหลายรายการได้พร้อมกัน</p>
          </div>

          {/* Selection Summary Bar */}
          <div className={styles.selectionBar}>
            <div className={styles.selectionInfo}>
              <span className={styles.selectionCount}>
                <Check size={18} />
                เลือกแล้ว {selectedItems.length} รายการ
              </span>
              {selectedItems.length > 0 && (
                <span className={styles.selectionTotal}>
                  รวม {totalItems.toLocaleString()} หน่วย
                </span>
              )}
            </div>
            <div className={styles.selectionActions}>
              <button
                type="button"
                className={styles.selectionBtn}
                onClick={selectAll}
                disabled={filteredStocks.every(s => isItemSelected(s._id) || s.provincialStock === 0)}
              >
                เลือกทั้งหมด
              </button>
              {selectedItems.length > 0 && (
                <button
                  type="button"
                  className={`${styles.selectionBtn} ${styles.selectionBtnDanger}`}
                  onClick={deselectAll}
                >
                  <X size={16} />
                  ล้างการเลือก
                </button>
              )}
            </div>
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
                const selected = isItemSelected(stock._id);
                const disabled = stock.provincialStock === 0;

                return (
                  <button
                    key={stock._id}
                    className={`${styles.stockCard} ${selected ? styles.stockCardSelected : ''} ${disabled ? styles.stockCardDisabled : ''}`}
                    onClick={() => !disabled && toggleItemSelection(stock)}
                    type="button"
                    disabled={disabled}
                  >
                    {/* Selection Checkbox */}
                    <div className={`${styles.checkbox} ${selected ? styles.checkboxChecked : ''}`}>
                      {selected && <Check size={16} />}
                    </div>

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
                      <div className={`${styles.stockQtyValue} ${disabled ? styles.stockQtyEmpty : ''}`}>
                        {stock.provincialStock.toLocaleString()} <span>{stock.unit}</span>
                      </div>
                    </div>
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

          {/* Next Button */}
          <div className={styles.stepActions}>
            <div className={styles.actionInfo}>
              {selectedItems.length > 0 && (
                <span>✅ เลือกแล้ว {selectedItems.length} รายการ</span>
              )}
            </div>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => {
                if (selectedItems.length === 0) {
                  toast.warning('กรุณาเลือกอย่างน้อย 1 รายการ');
                  return;
                }
                setCurrentStep(2);
              }}
              disabled={selectedItems.length === 0}
            >
              ถัดไป →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Enter Quantities */}
      {currentStep === 2 && (
        <div className={styles.stepContent}>
          <div className={styles.stepHeader}>
            <h2 className={styles.stepTitle}>
              📦 ระบุจำนวนสินค้า
            </h2>
            <p className={styles.stepSubtitle}>กำหนดจำนวนสินค้าที่ต้องการโอนแต่ละรายการ</p>
          </div>

          {/* Selected Items List */}
          <div className={styles.selectedItemsList}>
            {selectedItems.map((item, index) => {
              const emoji = getItemEmoji(item.stock.itemName, item.stock.category);
              return (
                <div key={item.stock._id} className={styles.selectedItemRow}>
                  <div className={styles.itemNumber}>{index + 1}</div>
                  <div className={styles.itemEmoji}>{emoji}</div>
                  <div className={styles.itemDetails}>
                    <div className={styles.itemName}>{item.stock.itemName}</div>
                    <div className={styles.itemAvailable}>
                      คงเหลือ: {item.stock.provincialStock.toLocaleString()} {item.stock.unit}
                    </div>
                  </div>
                  <div className={styles.quantityControls}>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => updateItemQuantity(item.stock._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      className={styles.qtyInput}
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(item.stock._id, parseInt(e.target.value) || 1)}
                      min={1}
                      max={item.stock.provincialStock}
                    />
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => updateItemQuantity(item.stock._id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock.provincialStock}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className={styles.itemUnit}>{item.stock.unit}</span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.stock._id)}
                    title="ลบรายการนี้"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className={styles.quantitySummary}>
            <span>รวมทั้งหมด</span>
            <span className={styles.summaryHighlight}>
              {selectedItems.length} รายการ / {totalItems.toLocaleString()} หน่วย
            </span>
          </div>

          <div className={styles.stepActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setCurrentStep(1)}
            >
              ← ย้อนกลับ
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => {
                if (selectedItems.length === 0) {
                  toast.warning('กรุณาเลือกอย่างน้อย 1 รายการ');
                  return;
                }
                setCurrentStep(3);
              }}
              disabled={selectedItems.length === 0}
            >
              ถัดไป →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Destination */}
      {currentStep === 3 && (
        <div className={styles.stepContent}>
          <div className={styles.stepHeader}>
            <h2 className={styles.stepTitle}>
              🎯 เลือกจุดหมายปลายทาง
            </h2>
            <p className={styles.stepSubtitle}>เลือกศูนย์พักพิงที่ต้องการโอนไป</p>
          </div>

          {/* Transfer Summary */}
          <div className={styles.transferSummaryMulti}>
            <div className={styles.summaryHeader}>
              <span>📋 รายการที่จะโอน ({selectedItems.length} รายการ)</span>
            </div>
            <div className={styles.summaryList}>
              {selectedItems.map((item) => {
                const emoji = getItemEmoji(item.stock.itemName, item.stock.category);
                return (
                  <div key={item.stock._id} className={styles.summaryRow}>
                    <span className={styles.summaryEmoji}>{emoji}</span>
                    <span className={styles.summaryItemName}>{item.stock.itemName}</span>
                    <span className={styles.summaryQty}>
                      {item.quantity.toLocaleString()} {item.stock.unit}
                    </span>
                  </div>
                );
              })}
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
                โอน <strong>{selectedItems.length} รายการ</strong> รวม{' '}
                <strong>{totalItems.toLocaleString()} หน่วย</strong>
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
              {loading ? '⏳ กำลังโอน...' : `✅ ยืนยันโอน ${selectedItems.length} รายการ`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
