/**
 * Script to create test shelters
 * Run: tsx scripts/create-test-shelters.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI ไม่ได้ตั้งค่าใน .env.local');
    process.exit(1);
}

const testShelters = [
    {
        name: 'ศูนย์พักพิงภัยหนองคาย 1',
        code: 'NK-001',
        location: {
            province: 'นครพนม',
            district: 'เมืองนครพนม',
            subdistrict: 'ในเมือง',
            address: '123 ถนนสุนทรวิจิตร'
        },
        capacity: 100,
        currentOccupancy: 45,
        status: 'active',
        contactPerson: {
            name: 'นายสมชาย ใจดี',
            phone: '081-234-5678'
        }
    },
    {
        name: 'ศูนย์พักพิงภัยหนองคาย 2',
        code: 'NK-002',
        location: {
            province: 'นครพนม',
            district: 'ธาตุพนม',
            subdistrict: 'ธาตุพนม',
            address: '456 ถนนพหลโยธิน'
        },
        capacity: 80,
        currentOccupancy: 30,
        status: 'active',
        contactPerson: {
            name: 'นางสาวสมหญิง รักษ์ดี',
            phone: '082-345-6789'
        }
    },
    {
        name: 'ศูนย์พักพิงภัยหนองคาย 3',
        code: 'NK-003',
        location: {
            province: 'นครพนม',
            district: 'รามัน',
            subdistrict: 'รามัน',
            address: '789 ถนนมิตรภาพ'
        },
        capacity: 60,
        currentOccupancy: 20,
        status: 'active',
        contactPerson: {
            name: 'นายสมศักดิ์ พัฒนา',
            phone: '083-456-7890'
        }
    }
];

async function createShelters() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ เชื่อมต่อ MongoDB สำเร็จ');

        const Shelter = mongoose.model('Shelter');

        // เช็คว่ามีศูนย์อยู่แล้วหรือไม่
        const existingCount = await Shelter.countDocuments();

        if (existingCount > 0) {
            console.log(`⚠️  มีศูนย์พักพิงอยู่แล้ว ${existingCount} แห่ง`);
            console.log('คุณต้องการลบและสร้างใหม่หรือไม่? (ยกเลิกสคริปต์และรันด้วย --force)');
            process.exit(0);
        }

        console.log('\n📍 กำลังสร้างศูนย์พักพิงทดสอบ...\n');

        for (const shelterData of testShelters) {
            const shelter = await Shelter.create(shelterData);
            console.log(`✅ สร้าง ${shelter.name} (${shelter.code})`);
        }

        console.log(`\n🎉 สร้างศูนย์พักพิงเสร็จสิ้น ${testShelters.length} แห่ง!`);

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createShelters();
