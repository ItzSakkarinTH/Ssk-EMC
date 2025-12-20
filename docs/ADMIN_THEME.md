# Admin Theme - คู่มือการใช้งาน

## 📚 ภาพรวม

Admin Theme เป็น Design System ที่ออกแบบมาเพื่อใช้ร่วมกันทั้งระบบ Admin โดยมีธีมสีเข้ม (Dark Theme) ที่ทันสมัย พร้อม Glassmorphism และ Gradient Effects

## 🎨 สีหลัก (Color Palette)

### Primary Colors
- **Primary**: `#3b82f6` (Blue)
- **Primary Dark**: `#2563eb`
- **Primary Light**: `#60a5fa`

### Background Colors
- **BG Primary**: `#0f172a` (Dark Navy)
- **BG Secondary**: `#1e293b` (Slate)
- **BG Tertiary**: `#334155`

### Text Colors
- **Text Primary**: `#f1f5f9` (Almost White)
- **Text Secondary**: `#cbd5e1` (Light Gray)
- **Text Muted**: `#94a3b8` (Gray)
- **Text Disabled**: `#64748b` (Dark Gray)

### Status Colors
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Orange)
- **Danger**: `#ef4444` (Red)
- **Info**: `#3b82f6` (Blue)

## 🧩 Components

### 1. Layout

```tsx
import AdminLayout from '@/components/AdminLayout/AdminLayout';

export default function MyAdminPage() {
  return (
    <AdminLayout 
      title="หัวข้อหน้า"
      subtitle="คำอธิบายเพิ่มเติม (optional)"
    >
      {/* เนื้อหาของคุณ */}
    </AdminLayout>
  );
}
```

### 2. Cards

```tsx
<div className="admin-card">
  <div className="admin-card-header">
    <h3 className="admin-card-title">Card Title</h3>
  </div>
  <div className="admin-card-body">
    {/* Card content */}
  </div>
</div>
```

### 3. Buttons

```tsx
{/* Primary Button */}
<button className="admin-btn admin-btn-primary">
  บันทึก
</button>

{/* Secondary Button */}
<button className="admin-btn admin-btn-secondary">
  ยกเลิก
</button>

{/* Success Button */}
<button className="admin-btn admin-btn-success">
  อนุมัติ
</button>

{/* Danger Button */}
<button className="admin-btn admin-btn-danger">
  ลบ
</button>
```

### 4. Form Elements

```tsx
{/* Input */}
<div>
  <label className="admin-label">ชื่อ</label>
  <input type="text" className="admin-input" />
</div>

{/* Select */}
<div>
  <label className="admin-label">เลือก</label>
  <select className="admin-select">
    <option>ตัวเลือก 1</option>
    <option>ตัวเลือก 2</option>
  </select>
</div>

{/* Textarea */}
<div>
  <label className="admin-label">รายละเอียด</label>
  <textarea className="admin-textarea" rows={4}></textarea>
</div>
```

### 5. Badges

```tsx
<span className="admin-badge admin-badge-success">ปกติ</span>
<span className="admin-badge admin-badge-warning">เริ่มตึง</span>
<span className="admin-badge admin-badge-danger">วิกฤต</span>
<span className="admin-badge admin-badge-info">ข้อมูล</span>
```

### 6. Stats Cards

```tsx
<div className="admin-stat-card">
  <div className="admin-stat-icon admin-stat-icon-primary">
    {/* Icon */}
  </div>
  <div className="admin-stat-content">
    <div className="admin-stat-value">150</div>
    <div className="admin-stat-label">ศูนย์ทั้งหมด</div>
  </div>
</div>
```

### 7. Grid System

```tsx
{/* Auto Grid */}
<div className="admin-grid admin-grid-auto">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

{/* 2 Columns */}
<div className="admin-grid admin-grid-2">
  <div>Column 1</div>
  <div>Column 2</div>
</div>

{/* 3 Columns */}
<div className="admin-grid admin-grid-3">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>

{/* 4 Columns */}
<div className="admin-grid admin-grid-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
  <div>Column 4</div>
</div>
```

### 8. Table

```tsx
<div className="admin-table-container">
  <table className="admin-table">
    <thead>
      <tr>
        <th>ชื่อ</th>
        <th>สถานะ</th>
        <th>จำนวน</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>รายการ 1</td>
        <td><span className="admin-badge admin-badge-success">ปกติ</span></td>
        <td>100</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 9. Loading State

```tsx
<div className="admin-loading">
  <div className="admin-spinner"></div>
  <p>กำลังโหลด...</p>
</div>
```

## 🎯 CSS Variables

คุณสามารถใช้ CSS Variables ในไฟล์ `.module.css` ของคุณได้:

```css
.myCustomCard {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-lg);
  padding: var(--admin-spacing-lg);
  color: var(--admin-text-primary);
  transition: all var(--admin-transition-slow);
}

.myCustomCard:hover {
  border-color: var(--admin-border-hover);
  box-shadow: var(--admin-shadow-lg);
}
```

## 📱 Responsive Design

Theme รองรับ Responsive Design โดยอัตโนมัติ:

- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px

## ✨ Best Practices

1. **ใช้ AdminLayout** สำหรับทุกหน้า Admin
2. **ใช้ CSS Variables** แทนการ hard-code สี
3. **ใช้ Utility Classes** ที่มีให้แทนการสร้าง CSS ใหม่
4. **รักษา Consistency** โดยใช้ Components ที่มีให้
5. **ทดสอบ Responsive** ในทุกขนาดหน้าจอ

## 🔧 การ Customize

หากต้องการปรับแต่งสี หรือค่าต่างๆ สามารถแก้ไขใน `src/styles/admin-theme.css`:

```css
:root {
  --admin-primary: #your-color;
  --admin-spacing-lg: 2rem;
  /* ... */
}
```

## 📦 ตัวอย่างหน้าสมบูรณ์

```tsx
import AdminLayout from '@/components/AdminLayout/AdminLayout';

export default function ExamplePage() {
  return (
    <AdminLayout 
      title="ตัวอย่างหน้า Admin"
      subtitle="แสดงการใช้งาน Admin Theme"
    >
      {/* Stats Cards */}
      <div className="admin-grid admin-grid-4">
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon-primary">
            📊
          </div>
          <div className="admin-stat-content">
            <div className="admin-stat-value">150</div>
            <div className="admin-stat-label">ทั้งหมด</div>
          </div>
        </div>
        {/* More stats... */}
      </div>

      {/* Main Content */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">รายการข้อมูล</h3>
          <button className="admin-btn admin-btn-primary">
            เพิ่มใหม่
          </button>
        </div>
        <div className="admin-card-body">
          {/* Content */}
        </div>
      </div>
    </AdminLayout>
  );
}
```

## 🎨 Design Principles

1. **Dark Theme First**: ออกแบบสำหรับการใช้งานในที่มืด
2. **Glassmorphism**: ใช้ backdrop-filter และความโปร่งแสง
3. **Smooth Animations**: ทุก interaction มี transition
4. **Consistent Spacing**: ใช้ spacing system
5. **Accessible Colors**: สีที่อ่านง่ายและชัดเจน

---

**สร้างโดย**: Antigravity AI  
**เวอร์ชัน**: 1.0.0  
**อัพเดทล่าสุด**: 2025-12-20
