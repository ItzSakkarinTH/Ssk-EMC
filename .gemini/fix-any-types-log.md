# Log การแก้ไข TypeScript `any` Types

**วันที่:** 2025-12-19
**เป้าหมาย:** แก้ไขปัญหา `@typescript-eslint/no-explicit-any` ในทุกไฟล์

## ✅ ไฟล์ที่แก้ไขสำเร็จแล้ว

### 1. `src/types/api.ts`
- ✅ เปลี่ยน `ApiResponse<T = any>` → `ApiResponse<T = unknown>`
- ✅ เปลี่ยน `PaginatedResponse<T = any>` → `PaginatedResponse<T = unknown>`
- ✅ เปลี่ยน `location: any` → specific object type with province, district, etc.
- ✅ เปลี่ยน `provincialStock: any[]` → typed array with stockId, itemName, category, etc.

### 2. `src/lib/auth/jwt.ts`
- ✅ แก้ไข `jwt.verify(...) as any` → `as { tokenId: string; userId: string; sessionId: string }`
- ✅ แก้ไข `catch (error: any)` → `catch (error: unknown)` with proper type assertion

### 3. `src/lib/auth/rbac.ts`
- ✅ สร้าง `StockWithShelters` interface สำหรับ stock object
- ✅ แก้ไข `filterStockByRole(stock: any, ...)` → `filterStockByRole(stock: StockWithShelters, ...)`
- ✅ แก้ไข `(s: any) => ...` → `(s) => ...` (type inference)

### 4. `src/lib/stock/rbac-filter.ts`
- ✅ สร้าง `StockWithShelters` interface
- ✅ สร้าง `Movement` interface สำหรับ movement objects
- ✅ แก้ไข `filterStock(stock: any, ...)` → typed parameter
- ✅ แก้ไข `filterMovements(movements: any[], ...)` → `Movement[]`

### 5. `src/lib/stock/calculator.ts`
- ✅ แก้ไข `Record<string, any>` → `Record<string, { items: number; quantity: number }>`

### 6. `src/app/api/stock/staff/request/route.ts` (บางส่วน)
- ✅ แก้ไข `items.map(async (item: any) => ...)` → typed parameter
- ✅ แก้ไข `.filter((item: any) => ...)` → typed parameter
- ✅ แก้ไข `query: any` → `query: { shelterId: string; status?: string }`
- ⚠️ ยังต้องแก้ไข error handling ให้สมบูรณ์

## ⏳ ไฟล์ที่ยังต้องแก้ไข

### API Routes - Error Handling Pattern
**Pattern ที่ต้องแก้:**
```typescript
// ❌ Before
catch (error: any) {
  console.error('Error:', error);
  // ...
}

// ✅ After
catch (error: unknown) {
  const err = error as Error;
  console.error('Error:', err);
  // ...
}
```

**ไฟล์ที่ต้องแก้ไข:**
1. ✅ `src/app/api/stock/staff/request/route.ts` (2 ตำแหน่ง)
2. ⏳ `src/app/api/stock/staff/receive/route.ts` (1 ตำแหน่ง)
3. ⏳ `src/app/api/stock/staff/dispense/route.ts` (1 ตำแหน่ง)
4. ⏳ `src/app/api/stock/staff/my-shelter/route.ts` (1 ตำแหน่ง)
5. ⏳ `src/app/api/stock/staff/history/route.ts` (1 ตำแหน่ง + query type)
6. ⏳ `src/app/api/stock/public/overview/route.ts` (1 ตำแหน่ง)
7. ⏳ `src/app/api/stock/public/by-category/route.ts` (1 ตำแหน่ง)
8. ⏳ `src/app/api/stock/public/alerts/route.ts` (1 ตำแหน่ง)
9. ⏳ `src/app/api/stock/admin/transfer/route.ts` (1 ตำแหน่ง)
10. ⏳ `src/app/api/stock/admin/request/route.ts` (1 ตำแหน่ง + query type)
11. ⏳ `src/app/api/stock/admin/request/[id]/route.ts` (2 ตำแหน่ง)
12. ⏳ `src/app/api/stock/admin/province-stock/route.ts` (1 ตำแหน่ง + provincialStockList type)
13. ⏳ `src/app/api/stock/admin/analytics/route.ts` (1 ตำแหน่ง + type assertions)
14. ⏳ `src/app/api/stock/admin/all-shelters/route.ts` (1 ตำแหน่ง)

### Component Files - Error Handling & Types

**ไฟล์ที่ต้องแก้ไข:**
1. ⏳ `src/app/stock-dashboard/components/StockOverview.tsx`
   - `catch (err: any)` → `catch (err: unknown)`

2. ⏳ `src/app/staff/stock/history/page.tsx`
   - `stockId: any` → `stockId: string`
   - `from: any` → `from: { id?: string; name?: string }`
   - `to: any` → `to: { id?: string; name?: string }`
   - `performedBy: any` → `performedBy: { name?: string }`

3. ⏳ `src/app/staff/stock/components/MyShelterStock.tsx`
   - `catch (err: any)` → `catch (err: unknown)`

4. ⏳ `src/app/staff/stock/components/QuickReceive.tsx`
   - `catch (err: any)` → `catch (err: unknown)`

5. ⏳ `src/app/staff/stock/components/RequestForm.tsx`
   - `updateItem(..., value: any)` → `value: string | number`
   - `catch (err: any)` → `catch (err: unknown)`

6. ⏳ `src/app/staff/stock/components/QuickDispense.tsx`
   - `catch (err: any)` → `catch (err: unknown)`

7. ⏳ `src/app/admin/stock/requests/[id]/page.tsx`
   - `const [request, setRequest] = useState<any>(null)` → create proper interface
   - `{request.items.map((item: any, idx: number) => ...)}` → type the items

8. ⏳ `src/app/admin/stock/components/TranferManager.tsx`
   - `setShelters(data.shelters.map((s: any) => ...))` → type the shelter object
   - `catch (err: any)` → `catch (err: unknown)`

9. ⏳ `src/app/admin/stock/components/RequestAppoval.tsx`
   - `catch (err: any)` → `catch (err: unknown)` (2 ตำแหน่ง)

10. ⏳ `src/app/admin/stock/components/ProvinceStockOverview.tsx`
    - `catch (err: any)` → `catch (err: unknown)`

11. ⏳ `src/app/admin/stock/components/ShelterComparison.tsx`
    - `setSortBy(e.target.value as any)` → proper type assertion

### Other Files

1. ⏳ `src/lib/stock/alerts.ts`
   - `status: status as any` → `status: status as 'low' | 'critical' | 'outOfStock'`

## 📝 หมายเหตุ

- ไฟล์ที่มี ✅ = แก้ไขสำเร็จแล้ว
- ไฟล์ที่มี ⚠️ = แก้ไขบางส่วน ยังไม่สมบูรณ์
- ไฟล์ที่มี ⏳ = ยังไม่ได้แก้ไข

## 🎯 สถิติ

- **แก้ไขสำเร็จ:** 5 ไฟล์
- **แก้ไขบางส่วน:** 1 ไฟล์
- **ยังไม่ได้แก้ไข:** 41+ ไฟล์
- **รวมทั้งหมด:** ~47 ไฟล์

## 🔧 คำแนะนำในการแก้ไขต่อ

1. แก้ไข error handling ใน API routes ทั้งหมด (pattern เดียวกัน)
2. แก้ไข component error handling
3. แก้ไข type assertions และ parameter types
4. ตรวจสอบและทดสอบว่าโค้ดยังทำงานได้ปกติ

## ⚠️ ข้อควรระวัง

- **ห้าม** เปลี่ยนแปลง logic ของโค้ด
- **ห้าม** ลบ functionality ที่มีอยู่
- เปลี่ยนแค่ type annotations เท่านั้น
- ทดสอบให้แน่ใจว่าโค้ดยังทำงานได้เหมือนเดิม
