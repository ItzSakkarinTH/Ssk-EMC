'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

interface ToastContextType {
    toasts: Toast[];
    removeToast: (id: string) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        options: ConfirmOptions;
        resolve: (value: boolean) => void;
    } | null>(null);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, type, message }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmDialog({
                isOpen: true,
                options,
                resolve
            });
        });
    }, []);

    const handleConfirm = (result: boolean) => {
        if (confirmDialog) {
            confirmDialog.resolve(result);
            setConfirmDialog(null);
        }
    };

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return CheckCircle2;
            case 'error':
                return XCircle;
            case 'warning':
                return AlertCircle;
            case 'info':
                return Info;
        }
    };

    const getColors = (type: ToastType) => {
        switch (type) {
            case 'success':
                return {
                    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: '#34d399',
                    shadow: 'rgba(16, 185, 129, 0.4)'
                };
            case 'error':
                return {
                    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: '#f87171',
                    shadow: 'rgba(239, 68, 68, 0.4)'
                };
            case 'warning':
                return {
                    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: '#fbbf24',
                    shadow: 'rgba(245, 158, 11, 0.4)'
                };
            case 'info':
                return {
                    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: '#60a5fa',
                    shadow: 'rgba(59, 130, 246, 0.4)'
                };
        }
    };

    const getConfirmColors = (type: 'danger' | 'warning' | 'info' = 'danger') => {
        switch (type) {
            case 'danger':
                return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
            case 'warning':
                return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
            case 'info':
                return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
        }
    };

    const value: ToastContextType = {
        toasts,
        removeToast,
        success: (message: string) => addToast('success', message),
        error: (message: string) => addToast('error', message),
        warning: (message: string) => addToast('warning', message),
        info: (message: string) => addToast('info', message),
        confirm
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Toast Container */}
            <div style={{
                position: 'fixed',
                top: '1.5rem',
                right: '1.5rem',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                maxWidth: '400px',
                pointerEvents: 'none'
            }}>
                {toasts.map(toast => {
                    const Icon = getIcon(toast.type);
                    const colors = getColors(toast.type);

                    return (
                        <div
                            key={toast.id}
                            style={{
                                background: colors.gradient,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '12px',
                                padding: '1rem 1.25rem',
                                color: 'white',
                                boxShadow: `0 8px 16px ${colors.shadow}, 0 0 0 1px rgba(255,255,255,0.1) inset`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                minWidth: '300px',
                                animation: 'slideInRight 0.3s ease-out',
                                pointerEvents: 'auto',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <Icon size={20} style={{ flexShrink: 0 }} />
                            <div style={{ flex: 1, fontSize: '0.9375rem', fontWeight: 500 }}>
                                {toast.message}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Confirm Dialog */}
            {confirmDialog?.isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 99998,
                        padding: '1rem',
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                    onClick={() => handleConfirm(false)}
                >
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '16px',
                            padding: '2rem',
                            maxWidth: '450px',
                            width: '100%',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
                            animation: 'slideInUp 0.3s ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: getConfirmColors(confirmDialog.options.type).bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `2px solid ${getConfirmColors(confirmDialog.options.type).color}40`
                            }}>
                                <AlertCircle size={32} style={{ color: getConfirmColors(confirmDialog.options.type).color }} />
                            </div>
                        </div>

                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: '#f1f5f9',
                            marginBottom: '0.75rem',
                            textAlign: 'center'
                        }}>
                            {confirmDialog.options.title}
                        </h3>

                        <p style={{
                            fontSize: '1rem',
                            color: '#cbd5e1',
                            marginBottom: '2rem',
                            textAlign: 'center',
                            lineHeight: 1.6
                        }}>
                            {confirmDialog.options.message}
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1rem'
                        }}>
                            <button
                                onClick={() => handleConfirm(false)}
                                style={{
                                    padding: '0.875rem 1.5rem',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(148, 163, 184, 0.3)',
                                    background: 'rgba(100, 116, 139, 0.1)',
                                    color: '#cbd5e1',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(100, 116, 139, 0.2)';
                                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(100, 116, 139, 0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                                }}
                            >
                                {confirmDialog.options.cancelText || 'ยกเลิก'}
                            </button>
                            <button
                                onClick={() => handleConfirm(true)}
                                style={{
                                    padding: '0.875rem 1.5rem',
                                    borderRadius: '10px',
                                    border: `1px solid ${getConfirmColors(confirmDialog.options.type).color}`,
                                    background: `linear-gradient(135deg, ${getConfirmColors(confirmDialog.options.type).color} 0%, ${getConfirmColors(confirmDialog.options.type).color}dd 100%)`,
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: `0 4px 12px ${getConfirmColors(confirmDialog.options.type).color}40`
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = `0 6px 16px ${getConfirmColors(confirmDialog.options.type).color}60`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = `0 4px 12px ${getConfirmColors(confirmDialog.options.type).color}40`;
                                }}
                            >
                                {confirmDialog.options.confirmText || 'ยืนยัน'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
