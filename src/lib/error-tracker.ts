// Error tracking utility
// ใช้ console.error สำหรับตอนนี้ แต่สามารถเปลี่ยนเป็น Sentry ได้

interface ErrorLog {
    message: string;
    stack?: string;
    context?: Record<string, unknown>;
    timestamp: string;
    level: 'error' | 'warning' | 'info';
}

class ErrorTracker {
    private static instance: ErrorTracker;

    private constructor() { }

    static getInstance(): ErrorTracker {
        if (!ErrorTracker.instance) {
            ErrorTracker.instance = new ErrorTracker();
        }
        return ErrorTracker.instance;
    }

    logError(error: Error | unknown, context?: Record<string, unknown>): void {
        const errorLog: ErrorLog = {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            context,
            timestamp: new Date().toISOString(),
            level: 'error'
        };

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('🔴 Error:', errorLog);
        }

        // TODO: Send to Sentry in production
        // if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        //   Sentry.captureException(error, { contexts: { custom: context } });
        // }

        // TODO: Save to database for audit trail
        this.saveToDatabase(errorLog);
    }

    logWarning(message: string, context?: Record<string, unknown>): void {
        const warningLog: ErrorLog = {
            message,
            context,
            timestamp: new Date().toISOString(),
            level: 'warning'
        };

        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Warning:', warningLog);
        }

        // TODO: Send to monitoring service
    }

    logInfo(message: string, context?: Record<string, unknown>): void {
        const infoLog: ErrorLog = {
            message,
            context,
            timestamp: new Date().toISOString(),
            level: 'info'
        };

        if (process.env.NODE_ENV === 'development') {
            console.info('ℹ️ Info:', infoLog);
        }
    }

    private async saveToDatabase(_log: ErrorLog): Promise<void> {
        // TODO: Implement database logging
        // This would save error logs to MongoDB for audit trail
    }
}

export const errorTracker = ErrorTracker.getInstance();

// Helper function for API error responses
export function createErrorResponse(
    error: unknown,
    defaultMessage: string = 'เกิดข้อผิดพลาด'
): { error: string; details?: unknown } {
    if (error instanceof Error) {
        return {
            error: error.message || defaultMessage,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
    }

    return { error: defaultMessage };
}

// Validation error formatter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatValidationErrors(issues: any[]): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
}
