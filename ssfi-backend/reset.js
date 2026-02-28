'use strict';
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  console.log('Resetting all tables...');
  await p.$executeRaw`SET FOREIGN_KEY_CHECKS=0`;
  const tables = [
    'tbl_session_renewal','event_registrations','race_results','certificates',
    'students','club_owners','clubs','events',
    'state_persons','district_persons','state_secretaries','district_secretaries',
    'users','districts','states',
    'tbl_session','tbl_eligible_event_level','tbl_event_level_type','tbl_category_type'
  ];
  for (const t of tables) {
    try { await p.$executeRawUnsafe(`TRUNCATE TABLE ${t}`); console.log(`  ✓ ${t}`); }
    catch(e) { console.log(`  - ${t}: ${e.message.split('\n')[0]}`); }
  }
  await p.$executeRaw`SET FOREIGN_KEY_CHECKS=1`;
  console.log('\nVerifying counts:');
  for (const t of ['states','districts','users','clubs','students','events']) {
    const r = await p.$queryRawUnsafe(`SELECT COUNT(*) as c FROM ${t}`);
    console.log(`  ${t}: ${r[0].c}`);
  }
  console.log('\nDone! Now run: node migrate.js');
}
main().catch(e => console.error('ERROR:', e.message)).finally(() => p.$disconnect());
