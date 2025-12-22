'use client';

import Link from 'next/link';
import MyShelterStock from './components/MyShelterStock';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { ArrowDownToLine, ArrowUpFromLine, FileText, ClipboardList, History } from 'lucide-react';

export default function StaffStockPage() {
  const quickActions = [
    {
      label: 'รับเข้าสต็อก',
      description: 'บันทึกการรับสินค้าเข้า',
      icon: ArrowDownToLine,
      href: '/staff/stock/receive',
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)'
    },
    {
      label: 'เบิกจ่ายสต็อก',
      description: 'บันทึกการเบิกจ่าย',
      icon: ArrowUpFromLine,
      href: '/staff/stock/dispense',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    {
      label: 'ยื่นคำขอสต็อก',
      description: 'ขอเพิ่มสินค้า',
      icon: FileText,
      href: '/staff/stock/request',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    },
    {
      label: 'คำขอของฉัน',
      description: 'ติดตามสถานะคำขอ',
      icon: ClipboardList,
      href: '/staff/stock/my-requests',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)'
    },
    {
      label: 'ประวัติการเคลื่อนไหว',
      description: 'ดูประวัติทั้งหมด',
      icon: History,
      href: '/staff/stock/history',
      color: '#64748b',
      bgColor: 'rgba(100, 116, 139, 0.1)'
    }
  ];

  return (
    <DashboardLayout
      title="จัดการสต็อกสินค้า"
      subtitle="ศูนย์พักพิงของคุณ"
    >
      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {quickActions.map(action => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="dash-card"
              style={{
                textDecoration: 'none',
                padding: '1.5rem',
                background: action.bgColor,
                border: `1px solid ${action.color}30`,
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 16px ${action.color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${action.color}30, ${action.color}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: action.color
                }}>
                  <Icon size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#f1f5f9',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    {action.label}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    margin: 0
                  }}>
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Stock List */}
      <MyShelterStock />
    </DashboardLayout>
  );
}