/**
 * Script to assign shelter to staff users
 * Run: tsx scripts/assign-shelter-to-staff.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI ไม่ได้ตั้งค่าใน .env.local');
    process.exit(1);
}

async function assignShelters() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ เชื่อมต่อ MongoDB สำเร็จ');

        const User = mongoose.model('User');
        const Shelter = mongoose.model('Shelter');

        // หาศูนย์พักพิงทั้งหมด
        const shelters = await Shelter.find();

        if (shelters.length === 0) {
            console.log('⚠️  ไม่พบศูนย์พักพิงในระบบ กรุณาสร้างศูนย์ก่อน');
            process.exit(1);
        }

        console.log(`\n📍 พบศูนย์พักพิง ${shelters.length} แห่ง:`);
        shelters.forEach((shelter, idx) => {
            console.log(`  ${idx + 1}. ${shelter.name} (${shelter.code}) - ID: ${shelter._id}`);
        });

        // หา staff users ที่ยังไม่มี shelter
        const staffWithoutShelter = await User.find({
            role: 'staff',
            $or: [
                { assignedShelterId: null },
                { assignedShelterId: { $exists: false } }
            ]
        });

        if (staffWithoutShelter.length === 0) {
            console.log('\n✅ ทุก staff มี shelter แล้ว');
            process.exit(0);
        }

        console.log(`\n👤 พบ staff ที่ยังไม่มี shelter: ${staffWithoutShelter.length} คน`);

        // มอบหมายศูนย์ให้แต่ละ staff (แบบสลับกัน)
        for (let i = 0; i < staffWithoutShelter.length; i++) {
            const staff = staffWithoutShelter[i];
            const shelter = shelters[i % shelters.length]; // แบ่งกันแบบ round-robin

            staff.assignedShelterId = shelter._id;
            await staff.save();

            console.log(`  ✅ มอบหมาย ${staff.name} (${staff.email}) -> ${shelter.name}`);
        }

        console.log('\n🎉 เสร็จสิ้น!');

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error);
    } finally {
        await mongoose.disconnect();
    }
}

assignShelters();
