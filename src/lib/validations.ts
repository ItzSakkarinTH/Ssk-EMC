import { z } from 'zod';

// Shelter Validation Schema
export const shelterSchema = z.object({
    name: z.string().min(3, 'ชื่อศูนย์พักพิงต้องมีอย่างน้อย 3 ตัวอักษร').max(100),
    code: z.string().min(3).max(20).regex(/^[A-Z0-9-]+$/, 'รหัสต้องเป็นตัวพิมพ์ใหญ่และตัวเลขเท่านั้น'),
    location: z.object({
        province: z.string().min(2),
        district: z.string().min(2),
        subdistrict: z.string().min(2).nullable().optional().transform(val => val || ''),
        address: z.string().optional()
    }),
    capacity: z.number().int().nonnegative('จำนวนรองรับต้องไม่ติดลบ'),
    contactPerson: z.object({
        name: z.string().min(3),
        phone: z.string().regex(/^[0-9-]+$/, 'เบอร์โทรศัพท์ไม่ถูกต้อง').min(9).max(12)
    }).optional(),
    status: z.enum(['active', 'inactive', 'full', 'closed']).optional()
});

export const shelterUpdateSchema = shelterSchema.partial();

// Item Validation Schema
export const itemSchema = z.object({
    name: z.string().min(2, 'ชื่อสินค้าต้องมีอย่างน้อย 2 ตัวอักษร').max(100),
    category: z.string().min(2).max(50),
    unit: z.string().min(1).max(20),
    description: z.string().max(500).optional(),
    minStock: z.number().int().min(0, 'สต๊อกต่ำสุดต้องไม่ติดลบ').optional().default(0),
    maxStock: z.number().int().positive('สต๊อกสูงสุดต้องมากกว่า 0').optional().nullable()
}).refine(data => {
    // ถ้าไม่มี maxStock หรือ minStock ให้ผ่าน validation
    if (data.maxStock === null || data.maxStock === undefined) return true;
    if (data.minStock === undefined) return true;
    return data.maxStock > data.minStock;
}, {
    message: 'สต๊อกสูงสุดต้องมากกว่าสต๊อกต่ำสุด',
    path: ['maxStock']
});

export const itemUpdateSchema = itemSchema.partial();

// User Validation Schema
export const userCreateSchema = z.object({
    username: z.string().min(3, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร').max(50)
        .regex(/^[a-zA-Z0-9_]+$/, 'ชื่อผู้ใช้ต้องเป็นตัวอักษรและตัวเลขเท่านั้น'),
    name: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร').max(100),
    email: z.string().email('อีเมลไม่ถูกต้อง'),
    password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
    role: z.enum(['admin', 'staff']),
    assignedShelterId: z.string().optional()
});

export const userUpdateSchema = z.object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/).optional(),
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['admin', 'staff']).optional(),
    assignedShelterId: z.string().optional()
});

// Announcement Validation Schema
export const announcementSchema = z.object({
    title: z.string().min(5, 'หัวข้อต้องมีอย่างน้อย 5 ตัวอักษร').max(200),
    content: z.string().min(10, 'เนื้อหาต้องมีอย่างน้อย 10 ตัวอักษร').max(2000),
    type: z.enum(['info', 'warning', 'urgent']),
    isActive: z.boolean().optional().default(true)
});

export const announcementUpdateSchema = announcementSchema.partial();

// Stock Transfer Validation Schema
export const stockTransferSchema = z.object({
    stockId: z.string().min(1, 'กรุณาระบุรหัสสินค้า'),
    quantity: z.number().positive('จำนวนต้องมากกว่า 0'),
    fromShelterId: z.string().min(1, 'กรุณาระบุศูนย์ต้นทาง'),
    toShelterId: z.string().min(1, 'กรุณาระบุศูนย์ปลายทาง'),
    notes: z.string().max(500).optional()
}).refine(data => data.fromShelterId !== data.toShelterId, {
    message: 'ไม่สามารถโอนไปยังศูนย์เดียวกันได้',
    path: ['toShelterId']
});

// Stock Request Validation Schema
export const stockRequestSchema = z.object({
    items: z.array(z.object({
        stockId: z.string().min(1),
        requestedQuantity: z.number().positive(),
        reason: z.string().min(5).max(500)
    })).min(1, 'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ'),
    urgency: z.enum(['normal', 'high']).optional().default('normal')
});

export type ShelterInput = z.infer<typeof shelterSchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type AnnouncementInput = z.infer<typeof announcementSchema>;
export type StockTransferInput = z.infer<typeof stockTransferSchema>;
export type StockRequestInput = z.infer<typeof stockRequestSchema>;
