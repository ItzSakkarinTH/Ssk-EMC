interface RateLimitData {
    count: number;
    resetAt: number;
}

const loginAttempts = new Map<string, RateLimitData>();

const MAX_ATTEMPTS = 100;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkLoginRateLimit(identifier: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const data = loginAttempts.get(identifier);

    if (!data || now > data.resetAt) {
        return { allowed: true, remaining: MAX_ATTEMPTS, resetIn: WINDOW_MS };
    }

    if (data.count >= MAX_ATTEMPTS) {
        const resetIn = Math.ceil((data.resetAt - now) / 1000);
        return { allowed: false, remaining: 0, resetIn };
    }

    return {
        allowed: true,
        remaining: MAX_ATTEMPTS - data.count,
        resetIn: Math.ceil((data.resetAt - now) / 1000)
    };
}

export function incrementRateLimit(identifier: string) {
    const now = Date.now();
    const data = loginAttempts.get(identifier);

    if (!data || now > data.resetAt) {
        loginAttempts.set(identifier, {
            count: 1,
            resetAt: now + WINDOW_MS
        });
    } else {
        data.count++;
    }
}

export function resetRateLimit(identifier: string, type: 'login' = 'login') {
    loginAttempts.delete(identifier);
}
