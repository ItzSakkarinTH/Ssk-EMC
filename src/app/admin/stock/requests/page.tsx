'use client';

import RequestApproval from '../components/RequestApproval';
import styles from './page.module.css';

export default function RequestsPage() {
  return (
    <div className={styles.container}>
      <h1>คำร้องขอสินค้า</h1>
      <RequestApproval />
    </div>
  );
}