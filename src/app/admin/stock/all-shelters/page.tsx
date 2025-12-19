'use client';

import { useState, useEffect } from 'react';
import ShelterComparison from '../components/ShelterComparison';
import styles from './page.module.css';

export default function AllSheltersPage() {
  return (
    <div className={styles.container}>
      <h1>สต๊อกทุกศูนย์พักพิง</h1>
      <ShelterComparison />
    </div>
  );
}