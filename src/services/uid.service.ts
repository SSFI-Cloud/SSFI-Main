// @ts-nocheck
import { PrismaClient, UserRole } from '@prisma/client';
import { AppError } from '../utils/errors';

import prisma from '../config/prisma';
/**
 * UID Format following SSFI Nomenclature:
 * 
 * Student:           SSFI/BS/{StateCode}/{Year}/{Serial}  -> SSFI/BS/TN/25/S0001
 * State Secretary:   SSFI/{StateCode}/{Serial}            -> SSFI/TN/A0001
 * District Secretary: SSFI/{StateCode}/{DistrictCode}/{Serial} -> SSFI/TN/CH/D0001
 * Club:              SSFI/{StateCode}/{DistrictCode}/{Serial}  -> SSFI/TN/CH/C0001
 * 
 * Where:
 * - BS = "Basic Studies" (constant prefix for students)
 * - TN, KA, MH = State codes
 * - CH, BLR = District codes
 * - 25 = Year (2025)
 * - S0001, A0001, D0001, C0001 = Sequential numbers with prefix
 */

class UIDService {
  /**
   * Get current year (last 2 digits)
   */
  private getCurrentYear(): string {
    return new Date().getFullYear().toString().slice(-2);
  }

  /**
   * Generate UID for Student
   * Format: SSFI/BS/{StateCode}/{Year}/{Serial}
   * Example: SSFI/BS/TN/25/S0001
   */
  async generateStudentUID(stateId: number): Promise<string> {
    const state = await prisma.state.findUnique({
      where: { id: stateId }
    });

    if (!state) {
      throw new AppError('State not found', 404);
    }

    const stateCode = state.code || state.name.substring(0, 2).toUpperCase();
    const year = this.getCurrentYear();
    const prefix = `SSFI/BS/${stateCode}/`;

    // Find the highest serial number across ALL years for this state
    // membershipId format: SSFI/BS/TN/25/S0001 — serial is after the last 'S'
    const allStudents = await prisma.student.findMany({
      where: {
        stateId,
        membershipId: { startsWith: prefix }
      },
      select: { membershipId: true },
    });

    let maxSerial = 0;
    for (const s of allStudents) {
      if (!s.membershipId) continue;
      // Extract the numeric part after the last 'S' in the serial segment
      const parts = s.membershipId.split('/');
      const serialPart = parts[parts.length - 1]; // e.g. "S0978"
      if (serialPart && serialPart.startsWith('S')) {
        const num = parseInt(serialPart.substring(1), 10);
        if (!isNaN(num) && num > maxSerial) {
          maxSerial = num;
        }
      }
    }

    const nextSerial = maxSerial + 1;
    const serial = `S${String(nextSerial).padStart(4, '0')}`;

    // Check for collision in Student table
    let uid = `${prefix}${year}/${serial}`;
    let existing = await prisma.student.findFirst({ where: { membershipId: uid } });
    let attempt = nextSerial;
    while (existing) {
      attempt++;
      uid = `${prefix}${year}/S${String(attempt).padStart(4, '0')}`;
      existing = await prisma.student.findFirst({ where: { membershipId: uid } });
    }

    return uid;
  }

  /**
   * Generate UID for State Secretary
   * Format: SSFI/{StateCode}/{Serial}
   * Example: SSFI/TN/A0001
   */
  async generateStateSecretaryUID(stateId: number): Promise<string> {
    const state = await prisma.state.findUnique({
      where: { id: stateId }
    });

    if (!state) {
      throw new AppError('State not found', 404);
    }

    const stateCode = state.code || state.name.substring(0, 2).toUpperCase();

    // Count state secretaries for this state
    const count = await prisma.stateSecretary.count({
      where: { stateId }
    });

    const serial = `A${String(count + 1).padStart(4, '0')}`;
    return `SSFI/${stateCode}/${serial}`;
  }

  /**
   * Generate UID for District Secretary
   * Format: SSFI/{StateCode}/{DistrictCode}/{Serial}
   * Example: SSFI/TN/CH/D0001
   */
  async generateDistrictSecretaryUID(stateId: number, districtId: number): Promise<string> {
    const state = await prisma.state.findUnique({ where: { id: stateId } });
    const district = await prisma.district.findUnique({ where: { id: districtId } });

    if (!state || !district) {
      throw new AppError('State or District not found', 404);
    }

    const stateCode = state.code || state.name.substring(0, 2).toUpperCase();
    const districtCode = district.code || district.name.substring(0, 2).toUpperCase();

    // Count district secretaries for this district
    // Improved logic: Find the latest serial number instead of just counting
    const lastSecretary = await prisma.districtSecretary.findFirst({
      where: { districtId },
      orderBy: { createdAt: 'desc' }, // or uid if it was sortable, but serial is inside string
    });

    let nextSerial = 1;
    if (lastSecretary && lastSecretary.uid) {
      // Try to parse the last serial
      const parts = lastSecretary.uid.split('/');
      const lastSerialStr = parts.length === 4 ? parts[3] : '';
      if (lastSerialStr.startsWith('D')) {
        const num = parseInt(lastSerialStr.substring(1));
        if (!isNaN(num)) {
          nextSerial = num + 1;
        }
      }
    } else {
      // Fallback to count if no previous record (or parsing failed)
      const count = await prisma.districtSecretary.count({
        where: { districtId }
      });
      nextSerial = count + 1;
    }

    let uid = `SSFI/${stateCode}/${districtCode}/D${String(nextSerial).padStart(4, '0')}`;

    // Check for collision in User table (since User.uid must be unique)
    let isUnique = false;
    while (!isUnique) {
      const existingUser = await prisma.user.findUnique({ where: { uid } });
      if (!existingUser) {
        isUnique = true;
      } else {
        nextSerial++;
        uid = `SSFI/${stateCode}/${districtCode}/D${String(nextSerial).padStart(4, '0')}`;
      }
    }

    return uid;
  }

  /**
   * Generate UID for Club
   * Format: SSFI/{StateCode}/{DistrictCode}/{Serial}
   * Example: SSFI/TN/CH/C0001
   */
  async generateClubUID(stateId: number, districtId: number): Promise<string> {
    const state = await prisma.state.findUnique({ where: { id: stateId } });
    const district = await prisma.district.findUnique({ where: { id: districtId } });

    if (!state || !district) {
      throw new AppError('State or District not found', 404);
    }

    const stateCode = state.code || state.name.substring(0, 2).toUpperCase();
    const districtCode = district.code || district.name.substring(0, 2).toUpperCase();

    // Count clubs in this district
    const count = await prisma.club.count({
      where: { districtId }
    });

    const serial = `C${String(count + 1).padStart(4, '0')}`;
    return `SSFI/${stateCode}/${districtCode}/${serial}`;
  }

  /**
   * Generate UID based on role and IDs
   */
  async generateUID(
    role: 'STUDENT' | 'STATE_SECRETARY' | 'DISTRICT_SECRETARY' | 'CLUB',
    context: {
      stateId?: number;
      districtId?: number;
    }
  ): Promise<string> {
    switch (role) {
      case 'STUDENT':
        if (!context.stateId) {
          throw new AppError('State ID is required for Student UID', 400);
        }
        return this.generateStudentUID(context.stateId);

      case 'STATE_SECRETARY':
        if (!context.stateId) {
          throw new AppError('State ID is required for State Secretary UID', 400);
        }
        return this.generateStateSecretaryUID(context.stateId);

      case 'DISTRICT_SECRETARY':
        if (!context.stateId || !context.districtId) {
          throw new AppError('State and District IDs are required for District Secretary UID', 400);
        }
        return this.generateDistrictSecretaryUID(context.stateId, context.districtId);

      case 'CLUB':
        if (!context.stateId || !context.districtId) {
          throw new AppError('State and District IDs are required for Club UID', 400);
        }
        return this.generateClubUID(context.stateId, context.districtId);

      default:
        throw new AppError('Invalid role for UID generation', 400);
    }
  }

  /**
   * Validate UID format
   */
  validateUID(uid: string): boolean {
    // Student: SSFI/BS/XX/YY/S0000
    const studentPattern = /^SSFI\/BS\/[A-Z]{2,3}\/\d{2}\/S\d{4}$/;
    // State Secretary: SSFI/XX/A0000
    const statePattern = /^SSFI\/[A-Z]{2,3}\/A\d{4}$/;
    // District Secretary: SSFI/XX/YY/D0000
    const districtPattern = /^SSFI\/[A-Z]{2,3}\/[A-Z]{2,3}\/D\d{4}$/;
    // Club: SSFI/XX/YY/C0000
    const clubPattern = /^SSFI\/[A-Z]{2,3}\/[A-Z]{2,3}\/C\d{4}$/;

    return studentPattern.test(uid) ||
      statePattern.test(uid) ||
      districtPattern.test(uid) ||
      clubPattern.test(uid);
  }

  /**
   * Parse UID to extract components
   */
  parseUID(uid: string): {
    type: 'STUDENT' | 'STATE_SECRETARY' | 'DISTRICT_SECRETARY' | 'CLUB';
    stateCode?: string;
    districtCode?: string;
    year?: string;
    serial: string;
  } | null {
    if (!uid.startsWith('SSFI/')) return null;

    const parts = uid.split('/');

    // Student: SSFI/BS/TN/25/S0001
    if (parts.length === 5 && parts[1] === 'BS') {
      return {
        type: 'STUDENT',
        stateCode: parts[2],
        year: parts[3],
        serial: parts[4],
      };
    }

    // State Secretary: SSFI/TN/A0001
    if (parts.length === 3 && parts[2].startsWith('A')) {
      return {
        type: 'STATE_SECRETARY',
        stateCode: parts[1],
        serial: parts[2],
      };
    }

    // District Secretary: SSFI/TN/CH/D0001
    if (parts.length === 4 && parts[3].startsWith('D')) {
      return {
        type: 'DISTRICT_SECRETARY',
        stateCode: parts[1],
        districtCode: parts[2],
        serial: parts[3],
      };
    }

    // Club: SSFI/TN/CH/C0001
    if (parts.length === 4 && parts[3].startsWith('C')) {
      return {
        type: 'CLUB',
        stateCode: parts[1],
        districtCode: parts[2],
        serial: parts[3],
      };
    }

    return null;
  }

  /**
   * Check if UID exists (for students)
   */
  async studentUidExists(uid: string): Promise<boolean> {
    const count = await prisma.students.count({
      where: { membershipId: uid }
    });
    return count > 0;
  }
}

// Export function for backward compatibility
export const generateUID = async (
  role: 'STUDENT' | 'STATE_SECRETARY' | 'DISTRICT_SECRETARY' | 'CLUB',
  context: {
    stateId?: number;
    districtId?: number;
  }
): Promise<string> => {
  const service = new UIDService();
  return service.generateUID(role, context);
};

export default new UIDService();
