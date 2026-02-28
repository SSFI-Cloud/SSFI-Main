
// Re-export from jwt.ts (Edge compatible)
// Note: These are now Async!
export { signToken, verifyToken } from "./jwt";

import bcrypt from "bcryptjs";

export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
};

export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const checkMembershipExpiry = (expiryDate: Date | null): boolean => {
    if (!expiryDate) return true; // No expiry set, consider valid
    return new Date() < new Date(expiryDate);
};
