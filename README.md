# 📖 README - Sisaket Emergency Management System

## 🎯 ภาพรวมโครงการ

**Sisaket EMS** เป็นระบบบริหารจัดการสภาวะวิกฤติสำหรับจังหวัดศรีสะเกษ ช่วยในการจัดการสต๊อกสินค้าช่วยเหลือผู้ประสบภัย การจัดการศูนย์พักพิง และการประสานงานระหว่างหน่วยงาน

---

## ✨ ฟีเจอร์หลัก

### 👨‍💼 สำหรับ Admin
- 📊 **ภาพรวมสต๊อกจังหวัด** - ดูสถานะสต๊อกทั้งหมด
- 🏢 **จัดการศูนย์พักพิง** - เพิ่ม/แก้ไข/ลบศูนย์พักพิง
- 📦 **จัดการรายการสินค้า** - กำหนดรายการสินค้าในระบบ
- 👥 **จัดการผู้ใช้งาน** - สร้างบัญชี Admin/Staff
- 🔄 **โอนสต๊อก** - โอนสินค้าระหว่างศูนย์
- 📋 **อนุมัติคำร้อง** - พิจารณาคำร้องขอสินค้า
- 📊 **วิเคราะห์ข้อมูล** - สถิติและรายงาน
- 📢 **ประกาศ** - แจ้งข่าวสารและเตือนภัย

### 👨‍💼 สำหรับ Staff
- 📦 **จัดการสต๊อกศูนย์** - ดูสต๊อกของศูนย์ตัวเอง
- 📥 **รับเข้าสินค้า** - บันทึกการรับสินค้า
- 📤 **เบิกจ่ายสินค้า** - บันทึกการจ่ายสินค้า
- 📋 **ยื่นคำร้อง** - ขอสินค้าเพิ่มเติม
- 📜 **ประวัติการเคลื่อนไหว** - ดูประวัติทั้งหมด

---

## 🛠️ เทคโนโลยีที่ใช้

### Frontend
- **Next.js 15** - React Framework
- **TypeScript** - Type Safety
- **CSS Modules** - Styling
- **Lucide React** - Icons

### Backend
- **Next.js API Routes** - RESTful API
- **MongoDB** - Database
- **JWT** - Authentication
- **bcryptjs** - Password Hashing

### Tools & Libraries
- **Context API** - State Management
- **Toast Notifications** - User Feedback
- **Responsive Design** - Mobile Support

---

## 📋 ข้อกำหนดระบบ

- **Node.js**: 18.0.0 หรือสูงกว่า
- **npm**: 9.0.0 หรือสูงกว่า
- **MongoDB**: 6.0 หรือสูงกว่า

---

## 🚀 การติดตั้งและรัน

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/sisaket-ems.git
cd sisaket-ems
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/sisaket-ems
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. รัน Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

### 5. Build สำหรับ Production

```bash
npm run build
npm start
```

---

## 👤 บัญชีทดสอบ

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`

### Staff Account
- **Username**: `staff`
- **Password**: `staff123`

---

## 📁 โครงสร้างโปรเจค

```
sisaket-ems/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin Pages
│   │   │   ├── stock/         # Stock Management
│   │   │   ├── shelters/      # Shelters Management
│   │   │   ├── items/         # Items Management
│   │   │   ├── users/         # Users Management
│   │   │   └── announcements/ # Announcements
│   │   ├── staff/             # Staff Pages
│   │   ├── api/               # API Routes
│   │   └── login/             # Login Page
│   ├── components/            # Reusable Components
│   │   ├── Sidebar/           # Navigation Sidebar
│   │   ├── AdminLayout/       # Admin Layout Wrapper
│   │   └── ToastContainer/    # Toast Notifications
│   ├── contexts/              # React Contexts
│   │   ├── AuthContext.tsx    # Authentication
│   │   └── ToastContext.tsx   # Toast Notifications
│   ├── lib/                   # Utilities
│   │   ├── auth.ts            # JWT Functions
│   │   └── db/                # Database Models
│   └── styles/                # Global Styles
│       └── admin-theme.css    # Admin Theme
├── docs/                      # Documentation
│   ├── ADMIN_THEME.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── PRODUCTION_CHECKLIST.md
│   └── TOAST_NOTIFICATION.md
└── public/                    # Static Files
```

---

## 🎨 Design System

### สีหลัก (Admin Theme)
- **Background**: `#0f172a` → `#1e293b` (Dark Gradient)
- **Primary**: `#3b82f6` (Blue)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Orange)
- **Danger**: `#ef4444` (Red)
- **Text**: `#f1f5f9` (White)

### Typography
- **Font Family**: Geist Sans, system-ui
- **Headings**: 700 weight
- **Body**: 400-600 weight

---

## 📚 เอกสารเพิ่มเติม

- [Admin Theme Guide](./docs/ADMIN_THEME.md)
- [Toast Notification Guide](./docs/TOAST_NOTIFICATION.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Production Checklist](./docs/PRODUCTION_CHECKLIST.md)

---

## 🔐 Security

- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt)
- ✅ Role-Based Access Control
- ✅ Secure HTTP Headers
- ✅ Input Validation
- ✅ CORS Protection

---

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

---

## 📦 Deployment

### Vercel (แนะนำ)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

ดูรายละเอียดเพิ่มเติมใน [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Authors

- **Sisaket Provincial Office** - Initial work
- **Antigravity AI** - Development assistance

---

## 🙏 Acknowledgments

- Next.js Team
- MongoDB Team
- Lucide Icons
- All contributors

---

## 📞 Contact

**Sisaket Provincial Office**
- Website: https://sisaket.go.th
- Email: info@sisaket.go.th
- Tel: 045-XXX-XXXX

---

## 🔄 Version History

- **v1.0.0** (2025-12-20)
  - Initial release
  - Admin & Staff features
  - Stock management
  - Toast notifications
  - Admin theme

---

**Made with ❤️ for Sisaket Province**