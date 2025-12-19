// Script to help fix TypeScript any types
// This file contains the patterns and replacements needed

export const ERROR_HANDLING_PATTERN = {
    from: `catch (error: any) {
  console.error`,
    to: `catch (error: unknown) {
  const err = error as Error;
  console.error`
};

export const ERROR_HANDLING_PATTERN_2 = {
    from: `catch (err: any) {`,
    to: `catch (err: unknown) {`
};

export const QUERY_ANY_PATTERN = {
    from: `const query: any = {`,
    to: `const query: Record<string, unknown> = {`
};

export const FILES_TO_FIX = {
    apiRoutes: [
        'src/app/api/stock/staff/receive/route.ts',
        'src/app/api/stock/staff/dispense/route.ts',
        'src/app/api/stock/staff/my-shelter/route.ts',
        'src/app/api/stock/staff/history/route.ts',
        'src/app/api/stock/public/overview/route.ts',
        'src/app/api/stock/public/by-category/route.ts',
        'src/app/api/stock/public/alerts/route.ts',
        'src/app/api/stock/admin/transfer/route.ts',
        'src/app/api/stock/admin/request/route.ts',
        'src/app/api/stock/admin/request/[id]/route.ts',
        'src/app/api/stock/admin/province-stock/route.ts',
        'src/app/api/stock/admin/analytics/route.ts',
        'src/app/api/stock/admin/all-shelters/route.ts',
    ],
    components: [
        'src/app/stock-dashboard/components/StockOverview.tsx',
        'src/app/staff/stock/components/MyShelterStock.tsx',
        'src/app/staff/stock/components/QuickReceive.tsx',
        'src/app/staff/stock/components/RequestForm.tsx',
        'src/app/staff/stock/components/QuickDispense.tsx',
        'src/app/admin/stock/components/TranferManager.tsx',
        'src/app/admin/stock/components/RequestAppoval.tsx',
        'src/app/admin/stock/components/ProvinceStockOverview.tsx',
    ]
};

// Manual fixes needed (complex cases):
export const MANUAL_FIXES = {
    'src/app/staff/stock/history/page.tsx': {
        fixes: [
            { line: 9, from: 'stockId: any;', to: 'stockId: string | { itemName: string };' },
            { line: 13, from: 'from: any;', to: 'from: { id?: string; name?: string };' },
            { line: 14, from: 'to: any;', to: 'to: { id?: string; name?: string };' },
            { line: 15, from: 'performedBy: any;', to: 'performedBy: { name?: string };' },
        ]
    },
    'src/app/staff/stock/components/RequestForm.tsx': {
        fixes: [
            { line: 34, from: 'value: any', to: 'value: string | number' }
        ]
    },
    'src/app/admin/stock/requests/[id]/page.tsx': {
        fixes: [
            { line: 10, from: 'useState<any>(null)', to: 'useState<RequestDetail | null>(null)' },
            { note: 'Need to create RequestDetail interface' }
        ]
    }
};
