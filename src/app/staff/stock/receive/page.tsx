'use client';

import { useRouter } from 'next/navigation';
import QuickReceive from '../components/QuickReceive';
import styles from './page.module.css';

export default function ReceivePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/staff/stock');
  };

  return (
    <div className={styles.container}>
      <button onClick={() => router.back()} className={styles.backBtn}>
        ← กลับ
      </button>
      <QuickReceive onSuccess={handleSuccess} />
    </div>
  );
}