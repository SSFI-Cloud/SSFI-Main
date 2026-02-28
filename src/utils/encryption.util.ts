import crypto from 'crypto';

const ALGORITHM = process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc';
const KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 chars for aes-256

/**
 * Encrypt Aadhaar number for secure storage
 */
export const encryptAadhaar = (aadhaar: string): string => {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY), iv);
        let encrypted = cipher.update(aadhaar, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
        // If encryption fails, return masked version
        return `XXXX-XXXX-${aadhaar.slice(-4)}`;
    }
};

/**
 * Decrypt Aadhaar number
 */
export const decryptAadhaar = (encryptedAadhaar: string): string => {
    try {
        const parts = encryptedAadhaar.split(':');
        if (parts.length !== 2) {
            return encryptedAadhaar; // Not encrypted
        }
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(KEY), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        return encryptedAadhaar;
    }
};

export default {
    encryptAadhaar,
    decryptAadhaar,
};
