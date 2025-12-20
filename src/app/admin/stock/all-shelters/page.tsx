'use client';

import ShelterComparison from '../components/ShelterComparison';
import AdminLayout from '@/components/AdminLayout/AdminLayout';

export default function AllSheltersPage() {
  return (
    <AdminLayout
      title="สต๊อกทุกศูนย์พักพิง"
      subtitle="ภาพรวมและเปรียบเทียบสต๊อกของทุกศูนย์พักพิงในระบบ"
    >
      <ShelterComparison />
    </AdminLayout>
  );
}