'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

interface StockMovementNotification {
    id: string;
    itemName: string;
    quantity: number;
    unit: string;
    from: string;
    createdAt: string;
}

interface AdminNotification {
    id: string;
    type: 'request' | 'movement';
    title: string;
    message: string;
    createdAt: string;
}

export default function StockNotificationListener() {
    const { info } = useToast();
    const { user } = useAuth();
    const lastCheckRef = useRef<string>(new Date().toISOString());

    useEffect(() => {
        if (!user) return;
        if (user.role !== 'staff' && user.role !== 'admin') return;

        const checkNotifications = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                const endpoint = user.role === 'admin'
                    ? `/api/stock/admin/notifications?since=${lastCheckRef.current}`
                    : `/api/stock/staff/notifications?since=${lastCheckRef.current}`;

                const res = await fetch(endpoint, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();

                    if (user.role === 'admin') {
                        const notifications: AdminNotification[] = data.notifications || [];
                        if (notifications.length > 0) {
                            notifications.forEach((n) => {
                                info(
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{n.title}</div>
                                        <div style={{ fontSize: '0.875rem' }}>{n.message}</div>
                                    </div>
                                );
                            });
                            lastCheckRef.current = new Date(notifications[0].createdAt).toISOString();
                        } else {
                            lastCheckRef.current = new Date().toISOString();
                        }
                    } else {
                        const movements: StockMovementNotification[] = data.movements || [];
                        if (movements.length > 0) {
                            movements.forEach((m) => {
                                info(`📦 มีสินค้าโอนเข้าจากกองกลาง: ${m.itemName} จำนวน ${m.quantity} ${m.unit}`);
                            });
                            lastCheckRef.current = new Date(movements[0].createdAt).toISOString();
                        } else {
                            lastCheckRef.current = new Date().toISOString();
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch notifications', err);
            }
        };

        // Check every 30 seconds
        const interval = setInterval(() => {
            void checkNotifications();
        }, 30000);

        // Initial check
        void checkNotifications();

        return () => clearInterval(interval);
    }, [user, info]);

    return null;
}
