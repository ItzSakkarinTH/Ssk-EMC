'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import './AnnouncementBanner.css';

interface Announcement {
    _id: string;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'urgent';
}

export default function AnnouncementBanner() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        // Fetch announcements on mount
        const fetchAnnouncements = async () => {
            try {
                console.log('🔄 Fetching announcements...');
                const res = await fetch('/api/announcements/active');
                console.log('📡 API Response status:', res.status);
                if (res.ok) {
                    const data = await res.json();
                    console.log('✅ Announcements data:', data);
                    setAnnouncements(data.announcements || []);
                } else {
                    console.error('❌ Failed to fetch announcements:', res.statusText);
                }
            } catch (error) {
                console.error('💥 Error fetching announcements:', error);
            }
        };

        void fetchAnnouncements();
    }, []);

    useEffect(() => {
        if (announcements.length <= 1 || !isVisible || isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % announcements.length);
        }, 5000); // เปลี่ยนทุก 5 วินาที

        return () => clearInterval(interval);
    }, [announcements.length, isVisible, isPaused]);

    const handleClose = () => {
        setIsVisible(false);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'urgent':
                return <AlertCircle size={24} />;
            case 'warning':
                return <AlertTriangle size={24} />;
            default:
                return <Info size={24} />;
        }
    };

    const getTypeClass = (type: string) => {
        switch (type) {
            case 'urgent':
                return 'announcement-banner-urgent';
            case 'warning':
                return 'announcement-banner-warning';
            default:
                return 'announcement-banner-info';
        }
    };

    if (!isVisible || announcements.length === 0) {
        console.log('❌ Announcement banner hidden:', {
            isVisible,
            announcementsCount: announcements.length,
            announcements
        });
        return null;
    }

    console.log('✅ Rendering announcement banner:', announcements[currentIndex]);

    const currentAnnouncement = announcements[currentIndex];

    return (
        <div
            className={`announcement-banner ${getTypeClass(currentAnnouncement.type)}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="announcement-banner-content">
                <div className="announcement-banner-icon">
                    {getIcon(currentAnnouncement.type)}
                </div>
                <div className="announcement-banner-text">
                    <h4 className="announcement-banner-title">{currentAnnouncement.title}</h4>
                    <p className="announcement-banner-message">{currentAnnouncement.content}</p>
                </div>
                <button
                    className="announcement-banner-close"
                    onClick={handleClose}
                    aria-label="ปิดประกาศ"
                >
                    <X size={20} />
                </button>
            </div>
            {announcements.length > 1 && (
                <div className="announcement-banner-dots">
                    {announcements.map((_, index) => (
                        <button
                            key={index}
                            className={`announcement-banner-dot ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => setCurrentIndex(index)}
                            aria-label={`ไปยังประกาศที่ ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
