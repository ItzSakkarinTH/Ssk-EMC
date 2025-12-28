/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if component has mounted on client
 * Use this to prevent hydration mismatches for client-only values
 * 
 * Note: This is a standard React pattern for detecting client mount.
 * The setState in useEffect is intentional to trigger a re-render after hydration.
 */
export function useMounted(): boolean {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return mounted;
}
