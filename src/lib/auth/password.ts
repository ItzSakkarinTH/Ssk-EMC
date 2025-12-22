import { pbkdf2, randomBytes } from 'crypto';
import { promisify } from 'util';
import bcrypt from 'bcryptjs';

const pbkdf2Async = promisify(pbkdf2);

// Configuration
const ITERATIONS = 10000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(32).toString('hex');
    const hash = await pbkdf2Async(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
    return `${salt}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    // Check if the hash is in bcrypt format (starts with $2a$, $2b$, or $2y$)
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
        // Use bcrypt verification
        return await bcrypt.compare(password, storedHash);
    }

    // Otherwise, use pbkdf2 verification (legacy format)
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;

    const hash = await pbkdf2Async(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
    return hash.toString('hex') === originalHash;
}

export function generateToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
}
