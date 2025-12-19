'use client';

import { useState } from 'react';
import TransferManager from '../components/TransferManager';
import styles from './page.module.css';

export default function TransfersPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className={styles.container}>
      <h1>โอนสต๊อกระหว่างศูนย์</h1>
      <TransferManager 
        key={refreshKey}
        onSuccess={() => setRefreshKey(prev => prev + 1)} 
      />
    </div>
  );
}