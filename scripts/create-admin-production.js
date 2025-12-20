/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const { pbkdf2, randomBytes } = require('crypto');
const { promisify } = require('util');

const pbkdf2Async = promisify(pbkdf2);

// Config ให้ตรงกับ password.ts
const ITERATIONS = 10000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

async function hashPassword(password) {
    const salt = randomBytes(32).toString('hex');
    const hash = await pbkdf2Async(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
    return `${salt}:${hash.toString('hex')}`;
}

async function createUsers() {
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI not found in .env.local');
        process.exit(1);
    }

    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db();
        const users = db.collection('users');

        // Clear old users
        await users.deleteMany({ username: { $in: ['admin', 'staff01'] } });

        // Create Admin
        const adminPassword = await hashPassword('Admin@2024');
        await users.insertOne({
            username: 'admin',
            email: 'admin@sisaket-ems.com',
            password: adminPassword,
            fullName: 'System Admin',
            role: 'admin',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('✅ Created Admin user: admin / Admin@2024');

        // Create Staff
        const staffPassword = await hashPassword('Staff@2024');
        await users.insertOne({
            username: 'staff01',
            email: 'staff01@sisaket-ems.com',
            password: staffPassword,
            fullName: 'Staff User',
            role: 'staff',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('✅ Created Staff user: staff01 / Staff@2024');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

createUsers();
