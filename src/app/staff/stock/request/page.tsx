'use client';

import { useRouter } from 'next/navigation';
import RequestForm from '../components/RequestForm';
import styles from './page.module.css';

export default function RequestPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/staff/stock');
  };

  return (
    <div className={styles.container}>
      <button onClick={() => router.back()} className={styles.backBtn}>
        ← กลับ
      </button>
      <RequestForm onSuccess={handleSuccess} />
    </div>
  );
}
