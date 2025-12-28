'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if component has mounted on client
 * Use this to prevent hydration mismatches for client-only values
 * 
 * Note: Calling setState in useEffect is intentional here for mount detection
 */
export function useMounted(): boolean {
    const [mounted, setMounted] = useState(false);

    // biome-ignore lint: intentional pattern for mount detection
    // eslint-disable-next-line
    useEffect(() => {
        setMounted(true);
    }, []);

    return mounted;
}
