'use client';

import ShelterComparison from '../components/ShelterComparison';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';

export default function AllSheltersPage() {
  return (
    <DashboardLayout
      title="สต๊อกทุกศูนย์พักพิง"
      subtitle="ภาพรวมและเปรียบเทียบสต๊อกของทุกศูนย์พักพิงในระบบ"
    >
      <ShelterComparison />
    </DashboardLayout>
  );
}