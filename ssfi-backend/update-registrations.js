/**
 * SSFI Registration Migration Script
 * - Sets all state/district secretary registrationDate = 2025-03-05
 * - Sets expiryDate = 2026-03-05 on their User accounts
 * - Generates proper UIDs: SSFI-SS-KA-001, SSFI-DS-KA-001, SSFI-CL-KA-MYS-001
 * - Skips Gowtham M (GLOBAL_ADMIN)
 *
 * Run: node update-registrations.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REG_DATE = new Date('2025-03-05T00:00:00.000Z');
const EXP_DATE = new Date('2026-03-05T00:00:00.000Z');
const SKIP_NAME = 'Gowtham M'; // global admin — skip

async function run() {
  console.log('=== SSFI Registration Migration ===\n');

  // ── 1. Update State Secretaries ───────────────────────────────────────────
  console.log('1. Updating State Secretaries...');

  // Get all state secretaries with their state code
  const stateSecretaries = await prisma.stateSecretary.findMany({
    include: { state: { select: { code: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  // Group by stateId for sequential numbering
  const stateSeqMap = {};

  for (const ss of stateSecretaries) {
    if (ss.name === SKIP_NAME) {
      console.log(`  ⏭  Skipping ${ss.name} (Global Admin)`);
      continue;
    }

    const stateCode = ss.state.code.toUpperCase();
    stateSeqMap[stateCode] = (stateSeqMap[stateCode] || 0) + 1;
    const seq = String(stateSeqMap[stateCode]).padStart(3, '0');
    const newUid = `SSFI-SS-${stateCode}-${seq}`;

    // Update StateSecretary record
    await prisma.stateSecretary.update({
      where: { id: ss.id },
      data: {
        createdAt: REG_DATE,
        uid: newUid,
      },
    });

    // Find the User account by email or phone and update
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: ss.email },
          { phone: ss.phone },
        ],
        role: 'STATE_SECRETARY',
      },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          uid: newUid,
          registrationDate: REG_DATE,
          expiryDate: EXP_DATE,
          accountStatus: 'ACTIVE',
        },
      });
      console.log(`  ✅ ${ss.state.name} | ${ss.name} → ${newUid} | User updated`);
    } else {
      console.log(`  ✅ ${ss.state.name} | ${ss.name} → ${newUid} | (no user account found)`);
    }
  }

  // ── 2. Update District Secretaries ────────────────────────────────────────
  console.log('\n2. Updating District Secretaries...');

  const districtSecretaries = await prisma.districtSecretary.findMany({
    include: {
      state: { select: { code: true, name: true } },
      district: { select: { code: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const districtSeqMap = {};

  for (const ds of districtSecretaries) {
    if (ds.name === SKIP_NAME) {
      console.log(`  ⏭  Skipping ${ds.name}`);
      continue;
    }

    const stateCode = ds.state.code.toUpperCase();
    const key = stateCode;
    districtSeqMap[key] = (districtSeqMap[key] || 0) + 1;
    const seq = String(districtSeqMap[key]).padStart(3, '0');
    const newUid = `SSFI-DS-${stateCode}-${seq}`;

    await prisma.districtSecretary.update({
      where: { id: ds.id },
      data: {
        createdAt: REG_DATE,
        uid: newUid,
      },
    });

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: ds.email }, { phone: ds.phone }],
        role: 'DISTRICT_SECRETARY',
      },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          uid: newUid,
          registrationDate: REG_DATE,
          expiryDate: EXP_DATE,
          accountStatus: 'ACTIVE',
        },
      });
      console.log(`  ✅ ${ds.state.name}/${ds.district.name} | ${ds.name} → ${newUid} | User updated`);
    } else {
      console.log(`  ✅ ${ds.state.name}/${ds.district.name} | ${ds.name} → ${newUid} | (no user account)`);
    }
  }

  // ── 3. Update Club UIDs ────────────────────────────────────────────────────
  console.log('\n3. Updating Club UIDs...');

  const clubs = await prisma.club.findMany({
    include: {
      state: { select: { code: true } },
      district: { select: { code: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const clubSeqMap = {};

  for (const club of clubs) {
    const stateCode = (club.state?.code || 'XX').toUpperCase();
    const districtCode = (club.district?.code || 'XX').toUpperCase();
    const key = `${stateCode}-${districtCode}`;
    clubSeqMap[key] = (clubSeqMap[key] || 0) + 1;
    const seq = String(clubSeqMap[key]).padStart(3, '0');
    const newUid = `SSFI-CL-${stateCode}-${districtCode}-${seq}`;

    await prisma.club.update({
      where: { id: club.id },
      data: { uid: newUid },
    });

    // Update club owner's user account if exists
    const clubOwner = await prisma.clubOwner.findFirst({
      where: { clubId: club.id },
      include: { user: true },
    });

    if (clubOwner) {
      await prisma.user.update({
        where: { id: clubOwner.userId },
        data: {
          uid: newUid,
          registrationDate: REG_DATE,
          expiryDate: EXP_DATE,
          accountStatus: 'ACTIVE',
        },
      });
    }

    console.log(`  ✅ ${club.name} → ${newUid}`);
  }

  console.log('\n=== Migration Complete ===');
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error('Migration failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
