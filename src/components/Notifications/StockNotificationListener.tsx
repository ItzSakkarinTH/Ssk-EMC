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

export default function StockNotificationListener() {
    const { info } = useToast();
    const { user } = useAuth();
    const lastCheckRef = useRef<string>(new Date().toISOString());

    useEffect(() => {
        if (!user || user.role !== 'staff') return;

        const checkNotifications = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                const res = await fetch(`/api/stock/staff/notifications?since=${lastCheckRef.current}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    const movements: StockMovementNotification[] = data.movements || [];

                    if (movements.length > 0) {
                        movements.forEach((m) => {
                            info(`📦 มีสินค้าโอนเข้าจากกองกลาง: ${m.itemName} จำนวน ${m.quantity} ${m.unit}`);
                        });
                        // Update last check to the latest movement's date
                        lastCheckRef.current = new Date(movements[0].createdAt).toISOString();
                    } else {
                        // Just advance the time to avoid re-checking old ones if window was inactive
                        lastCheckRef.current = new Date().toISOString();
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
