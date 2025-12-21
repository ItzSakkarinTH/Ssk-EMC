/**
 * สร้างเลข Reference ID แบบอัตโนมัติ
 * รูปแบบ: {prefix}-YYYYMMDD-XXXXX
 * @param prefix - คำนำหน้า เช่น RCV, INIT, TRF
 * @returns Reference ID เช่น RCV-20241221-00001
 */
export function generateReferenceId(prefix: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = String(Date.now()).slice(-5); // 5 หลักท้าย

    return `${prefix}-${year}${month}${day}-${timestamp}`;
}
