
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Stethoscope,
  Shirt,
  Box,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import styles from './CategoryBreakdown.module.css';

interface CategoryData {
  items: number;
  quantity: number;
}

interface OverviewData {
  byCategory: {
    food: CategoryData;
    medicine: CategoryData;
    clothing: CategoryData;
    other: CategoryData;
  };
}

export default function CategoryBreakdown() {
  const [data, setData] = useState<OverviewData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/stock/public/overview');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        console.error('Failed to fetch');
      }
    };

    fetchData();
  }, []);

  if (!data) return null;

  const categories = [
    { key: 'food', label: 'อาหารและน้ำดื่ม', icon: UtensilsCrossed, color: '#10b981', theme: styles.food },
    { key: 'medicine', label: 'เวชภัณฑ์และยารักษาโรค', icon: Stethoscope, color: '#3b82f6', theme: styles.medicine },
    { key: 'clothing', label: 'เครื่องนุ่งห่มและที่นอน', icon: Shirt, color: '#8b5cf6', theme: styles.clothing },
    { key: 'other', label: 'อุปกรณ์อำนวยความสะดวกอื่นๆ', icon: Box, color: '#f59e0b', theme: styles.other }
  ];

  // Calculate max quantity for progress bars
  const maxQty = Math.max(...Object.values(data.byCategory).map(c => c.quantity), 1);

  return (
    <div className={styles.categoryContainer}>
      <div className={styles.grid}>
        {categories.map(cat => {
          const categoryData = data.byCategory[cat.key as keyof typeof data.byCategory];
          const Icon = cat.icon;
          const percentage = (categoryData.quantity / maxQty) * 100;

          return (
            <Link
              key={cat.key}
              href={`/stock-dashboard/${cat.key}`}
              className={`${styles.categoryCard} ${cat.theme}`}
            >
              <div className={styles.cardGlow}></div>

              <div className={styles.cardTop}>
                <div className={styles.metaInfo}>
                  <div className={styles.categoryIconBox} style={{ color: cat.color }}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className={styles.categoryTitle}>{cat.label}</h3>
                    <p className={styles.itemCount}>{categoryData.items} รายการอุปกรณ์</p>
                  </div>
                </div>
                <div className={styles.externalLink}>
                  <ArrowUpRight size={18} />
                </div>
              </div>

              <div className={styles.cardMain}>
                <div className={styles.quantityDisplay}>
                  <span className={styles.quantityValue}>{categoryData.quantity.toLocaleString()}</span>
                  <span className={styles.quantityUnit}>หน่วยคงคลัง</span>
                </div>

                <div className={styles.progressSection}>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.pBar}
                      style={{ width: `${Math.max(percentage, 5)}%`, backgroundColor: cat.color }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className={styles.cardBottom}>
                <div className={styles.trendInfo}>
                  <TrendingUp size={12} />
                  <span>สถานะ: คลังพร้อมจ่าย</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
