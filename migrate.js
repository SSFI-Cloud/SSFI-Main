'use strict';
/**
 * SSFI MIGRATION SCRIPT — v4 FINAL (column-verified)
 * node migrate.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const prisma = new PrismaClient();
const LOG = fs.createWriteStream('migration.log', { flags: 'w' });
let HASHED_PW;

function log(m)  { const l=`[${new Date().toISOString()}] ${m}`;  console.log(l);   LOG.write(l+'\n'); }
function warn(m) { const l=`[WARN] ${m}`;                         console.warn(l);  LOG.write(l+'\n'); }

const Q = (sql, p=[]) => prisma.$queryRawUnsafe(sql, ...p);
const X = (sql, p=[]) => prisma.$executeRawUnsafe(sql, ...p);
const lastId = async () => Number((await Q('SELECT LAST_INSERT_ID() as id'))[0].id);

// helpers
function genderVal(v) {
  if (!v) return 'OTHER';
  return v.toLowerCase().startsWith('m') ? 'MALE' : v.toLowerCase().startsWith('f') ? 'FEMALE' : 'OTHER';
}
function bloodVal(v) {
  if (!v) return null;
  const m = {
    'A Positive(+)':'A_POSITIVE','A+':'A_POSITIVE','A Negative(-)':'A_NEGATIVE','A-':'A_NEGATIVE',
    'B Positive(+)':'B_POSITIVE','B+':'B_POSITIVE','B Negative(-)':'B_NEGATIVE','B-':'B_NEGATIVE',
    'AB Positive(+)':'AB_POSITIVE','AB+':'AB_POSITIVE','AB Negative(-)':'AB_NEGATIVE','AB-':'AB_NEGATIVE',
    'O Positive(+)':'O_POSITIVE','O+':'O_POSITIVE','O Negative(-)':'O_NEGATIVE','O-':'O_NEGATIVE'
  };
  return m[String(v).trim()] || null;
}
function boardVal(v) {
  if (!v) return 'STATE_BOARD';
  const s = v.toLowerCase();
  if (s.includes('cbse')) return 'CBSE';
  if (s.includes('icse') || s.includes('isc')) return 'ICSE';
  if (s.includes(' ib')) return 'IB';
  return 'STATE_BOARD';
}
function parseYear(v) { const m = String(v||'').match(/(\d{4})/); return m ? parseInt(m[1]) : null; }
function makeUid(pre) { return `${pre}-${uuidv4().replace(/-/g,'').slice(0,8).toUpperCase()}`; }
function ageCat(dob, evDate) {
  if (!dob || !evDate) return 'OPEN';
  const age = Math.floor((new Date(evDate) - new Date(dob)) / (365.25 * 864e5));
  return age<=10?'U-10':age<=14?'U-14':age<=17?'U-17':age<=19?'U-19':'SENIOR';
}
function skateCat(id) { return {1:'QUAD',2:'PRO_INLINE',3:'RECREATIONAL',4:'BEGINNER'}[id]||'BEGINNER'; }

// ── 1. States ─────────────────────────────────────────────────────────────────
async function step1_states() {
  const cnt = Number((await Q('SELECT COUNT(*) as c FROM states'))[0].c);
  if (cnt > 0) { log(`States: ${cnt} already, skipping`); return; }
  const rows = await Q('SELECT id,state_name,code FROM ssfi_old.tbl_states ORDER BY id');
  let ok = 0;
  for (const r of rows) {
    try { await X('INSERT INTO states(id,name,code,isActive,createdAt,updatedAt) VALUES(?,?,?,1,NOW(),NOW())', [r.id, r.state_name, r.code]); ok++; }
    catch(e) { warn(`state ${r.id}: ${e.message}`); }
  }
  await X('ALTER TABLE states AUTO_INCREMENT=100');
  log(`States: ${ok} inserted`);
}

// ── 2. Districts ──────────────────────────────────────────────────────────────
async function step2_districts() {
  const cnt = Number((await Q('SELECT COUNT(*) as c FROM districts'))[0].c);
  if (cnt > 0) { log(`Districts: ${cnt} already, skipping`); return; }
  const rows = await Q(`SELECT d.id,d.state_id,d.district_name,s.code sc
    FROM ssfi_old.tbl_districts d JOIN ssfi_old.tbl_states s ON s.id=d.state_id ORDER BY d.id`);
  let ok = 0;
  for (const r of rows) {
    const code = `${r.sc}-${r.id}`;  // e.g. TN-12 — globally unique
    try { await X('INSERT INTO districts(id,stateId,name,code,isActive,createdAt,updatedAt) VALUES(?,?,?,?,1,NOW(),NOW())', [r.id, r.state_id, r.district_name, code]); ok++; }
    catch(e) { warn(`district ${r.id}: ${e.message}`); }
  }
  await X('ALTER TABLE districts AUTO_INCREMENT=2000');
  log(`Districts: ${ok} inserted`);
}

// ── 3. Lookup tables ──────────────────────────────────────────────────────────
async function step3_lookups() {
  if (Number((await Q('SELECT COUNT(*) as c FROM tbl_category_type'))[0].c) === 0) {
    const rows = await Q('SELECT id,cat_name FROM ssfi_old.tbl_category_type');
    for (const r of rows) { try { await X('INSERT INTO tbl_category_type(id,cat_name) VALUES(?,?)',[r.id,r.cat_name]); } catch(e) { warn(`cat_type ${r.id}: ${e.message}`); } }
    log(`tbl_category_type: ${rows.length}`);
  } else log('tbl_category_type: skip');

  if (Number((await Q('SELECT COUNT(*) as c FROM tbl_event_level_type'))[0].c) === 0) {
    const rows = await Q('SELECT id,event_level FROM ssfi_old.tbl_event_level_type');
    for (const r of rows) { try { await X('INSERT INTO tbl_event_level_type(id,event_level) VALUES(?,?)',[r.id,r.event_level]); } catch(e) { warn(`evt_lvl_type ${r.id}: ${e.message}`); } }
    log(`tbl_event_level_type: ${rows.length}`);
  } else log('tbl_event_level_type: skip');

  if (Number((await Q('SELECT COUNT(*) as c FROM tbl_eligible_event_level'))[0].c) === 0) {
    const cols = (await Q('DESCRIBE ssfi_old.tbl_eligible_event_level')).map(c=>c.Field);
    const nc = cols.includes('event_level_name') ? 'event_level_name' : 'event_level';
    const rows = await Q(`SELECT id,category_type_id,event_level_type_id,${nc} eln FROM ssfi_old.tbl_eligible_event_level`);
    for (const r of rows) { try { await X('INSERT INTO tbl_eligible_event_level(id,category_type_id,event_level_type_id,event_level_name) VALUES(?,?,?,?)',[r.id,r.category_type_id,r.event_level_type_id,r.eln]); } catch(e) { warn(`eel ${r.id}: ${e.message}`); } }
    log(`tbl_eligible_event_level: ${rows.length}`);
  } else log('tbl_eligible_event_level: skip');

  if (Number((await Q('SELECT COUNT(*) as c FROM tbl_session'))[0].c) === 0) {
    const cols = (await Q('DESCRIBE ssfi_old.tbl_session')).map(c=>c.Field);
    const nc = cols.includes('session_name') ? 'session_name' : 'name';
    const hs = cols.includes('start_date');
    const rows = await Q(`SELECT id,${nc} sname,is_active FROM ssfi_old.tbl_session`);
    for (const r of rows) {
      const ym = String(r.sname).match(/(\d{4})/); const yr = ym ? parseInt(ym[1]) : 2024;
      const sd = hs ? r.start_date : new Date(`${yr}-04-01`);
      const ed = hs ? r.end_date   : new Date(`${yr+1}-03-31`);
      try { await X('INSERT INTO tbl_session(id,session_name,start_date,end_date,is_active) VALUES(?,?,?,?,?)',[r.id,r.sname,sd,ed,r.is_active?1:0]); } catch(e) { warn(`session ${r.id}: ${e.message}`); }
    }
    log(`tbl_session: ${rows.length}`);
  } else log('tbl_session: skip');
}

// ── 4. Clubs ──────────────────────────────────────────────────────────────────
// Real cols: uid,districtId,stateId,name,code,registrationNo,establishedYear,
//            contactPerson,phone,email,logo,logoPath,passport,proof,certificate,
//            membershipId,aadhaarNumber,clubAddress,verified,isActive,status,createdAt,updatedAt
async function step4_clubs() {
  const cnt = Number((await Q('SELECT COUNT(*) as c FROM clubs'))[0].c);
  if (cnt > 0) {
    log(`Clubs: ${cnt} already, rebuilding map...`);
    const rows = await Q('SELECT id,uid FROM clubs WHERE uid IS NOT NULL');
    const map = {};
    for (const r of rows) { const m = String(r.uid).match(/CLB-0*(\d+)/); if (m) map[parseInt(m[1])] = r.id; }
    return map;
  }

  const rows = await Q(`SELECT id,club_name,registration_number,contact_person,mobile_number,
    email_address,district_id,state_id,club_address,established_year,
    logo_path,passport,proof,certificate,verified,membership_id,aadhar_number
    FROM ssfi_old.tbl_clubs ORDER BY id`);

  const usedRegNos = new Set();
  const map = {};
  let ok = 0, sk = 0;

  for (const c of rows) {
    const codeVal = String(c.id);  // old id = always unique
    const uidVal  = `CLB-${String(c.id).padStart(5,'0')}`;
    const yr      = parseYear(c.established_year);
    const status  = c.verified === 1 ? 'APPROVED' : 'PENDING';

    let regNo = c.registration_number || null;
    if (regNo && usedRegNos.has(regNo)) regNo = null;
    if (regNo) usedRegNos.add(regNo);

    try {
      // Using exact column names from DESCRIBE
      await X(`INSERT INTO clubs
        (uid,districtId,stateId,name,code,registrationNo,establishedYear,
         contactPerson,phone,email,logoPath,passport,proof,certificate,
         membershipId,aadhaarNumber,clubAddress,verified,isActive,status,createdAt,updatedAt)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,NOW(),NOW())`,
        [uidVal, c.district_id||1, c.state_id||1, c.club_name||'Unknown', codeVal,
         regNo, yr,
         c.contact_person||'Unknown', c.mobile_number||null, c.email_address||null,
         c.logo_path||null, c.passport||null, c.proof||null, c.certificate||null,
         c.membership_id||null, c.aadhar_number||null, c.club_address||null,
         c.verified||0, status]);
      map[c.id] = await lastId();
      ok++;
    } catch(e) { warn(`Club ${c.id} (${c.club_name}): ${e.message}`); sk++; }
  }
  log(`Clubs: ${ok} inserted, ${sk} skipped`);
  return map;
}

// ── 5. Admin user ─────────────────────────────────────────────────────────────
async function step5_adminUser() {
  const ex = await Q("SELECT id FROM users WHERE role='GLOBAL_ADMIN' LIMIT 1");
  if (ex.length > 0) { log(`Admin: already exists id=${ex[0].id}`); return ex[0].id; }
  const u = makeUid('ADMIN');
  await X(`INSERT INTO users(uid,email,phone,password,role,isActive,isApproved,approvalStatus,registrationDate,accountStatus,createdAt,updatedAt)
           VALUES(?,?,?,?,'GLOBAL_ADMIN',1,1,'APPROVED',NOW(),'ACTIVE',NOW(),NOW())`,
    [u, 'admin@ssfi.in', 'ADMIN-000', HASHED_PW]);
  const id = await lastId();
  log(`Admin created: id=${id}`);
  return id;
}

// ── 6. Users (secretaries + club owners) ─────────────────────────────────────
async function step6_users(clubMap) {
  const roleMap = {1:'GLOBAL_ADMIN',2:'DISTRICT_SECRETARY',3:'STATE_SECRETARY',4:'CLUB_OWNER'};
  const rows = await Q(`SELECT id,role_id,club_id,full_name,gender,email_address,mobile_number,
    aadhar_number,residential_address,state_id,district_id,identity_proof,profile_photo,verified,created_at
    FROM ssfi_old.tbl_user ORDER BY id`);

  const usedPhones = new Set((await Q('SELECT phone FROM users WHERE phone IS NOT NULL')).map(r=>r.phone));
  const usedEmails = new Set((await Q('SELECT email FROM users WHERE email IS NOT NULL')).map(r=>r.email));
  const usedAadhaar = new Set();

  const map = {};
  let ok = 0, sk = 0;

  for (const u of rows) {
    const role = roleMap[u.role_id] || 'GLOBAL_ADMIN';
    if (role === 'GLOBAL_ADMIN') continue; // already inserted

    const name = u.full_name || 'Unknown';
    const g    = genderVal(u.gender);
    const isApproved = u.verified === 1;
    const addr = u.residential_address || 'To be updated';

    let phone = String(u.mobile_number||'').trim() || `PH-USR-${u.id}`;
    if (usedPhones.has(phone)) phone = `PH-USR-${u.id}`;
    usedPhones.add(phone);

    let email = (u.email_address && u.email_address.includes('@')) ? u.email_address.trim().toLowerCase() : null;
    if (email && usedEmails.has(email)) email = null;
    if (email) usedEmails.add(email);

    let aadhaar = String(u.aadhar_number||'').replace(/\D/g,'');
    if (aadhaar.length !== 12) aadhaar = `PH-AA-USR-${u.id}`;
    if (usedAadhaar.has(aadhaar)) aadhaar = `PH-AA-USR-${u.id}-${Date.now()}`;
    usedAadhaar.add(aadhaar);

    const u2 = makeUid('USR');

    try {
      await X(`INSERT INTO users(uid,email,phone,password,role,isActive,isApproved,approvalStatus,registrationDate,accountStatus,createdAt,updatedAt)
               VALUES(?,?,?,?,?,1,?,?,?,?,?,NOW())`,
        [u2, email, phone, HASHED_PW, role, isApproved, isApproved?'APPROVED':'PENDING',
         u.created_at||new Date(), 'ACTIVE', u.created_at||new Date()]);
      const newId = await lastId();
      map[u.id] = newId;

      if (role === 'STATE_SECRETARY') {
        try {
          await X(`INSERT INTO state_secretaries(id,uid,name,gender,email,phone,aadhaarNumber,stateId,residentialAddress,identityProof,profilePhoto,registrationWindowId,status,createdAt,updatedAt)
                   VALUES(UUID(),?,?,?,?,?,?,?,?,?,?,'LEGACY',?,NOW(),NOW())`,
            [u2, name, g, email||`noemail-${u.id}@ssfi.placeholder`, phone,
             aadhaar, u.state_id||1, addr, u.identity_proof||'placeholder', u.profile_photo||null,
             isApproved?'APPROVED':'PENDING']);
        } catch(e) { warn(`state_sec ${u.id}: ${e.message}`); }
      } else if (role === 'DISTRICT_SECRETARY') {
        try {
          await X(`INSERT INTO district_secretaries(id,uid,name,gender,email,phone,aadhaarNumber,stateId,districtId,residentialAddress,identityProof,profilePhoto,registrationWindowId,status,createdAt,updatedAt)
                   VALUES(UUID(),?,?,?,?,?,?,?,?,?,?,?,'LEGACY',?,NOW(),NOW())`,
            [u2, name, g, email||`noemail-${u.id}@ssfi.placeholder`, phone,
             aadhaar, u.state_id||1, u.district_id||1, addr,
             u.identity_proof||'placeholder', u.profile_photo||null,
             isApproved?'APPROVED':'PENDING']);
        } catch(e) { warn(`district_sec ${u.id}: ${e.message}`); }
      } else if (role === 'CLUB_OWNER') {
        const cid = clubMap[u.club_id];
        if (cid) {
          try {
            await X(`INSERT INTO club_owners(userId,clubId,name,gender,aadhaarNumber,addressLine1,city,pincode,identityProof,profilePhoto,createdAt,updatedAt)
                     VALUES(?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
              [newId, cid, name, g, aadhaar, addr, 'To be updated', '000000',
               u.identity_proof||'placeholder', u.profile_photo||null]);
          } catch(e) { warn(`club_owner ${u.id}: ${e.message}`); }
        }
      }
      ok++;
    } catch(e) { warn(`User ${u.id} (${u.full_name}): ${e.message}`); sk++; }
  }
  log(`Users (sec+owners): ${ok} inserted, ${sk} skipped`);
  return map;
}

// ── 7. Skaters → Students ─────────────────────────────────────────────────────
async function step7_skaters(clubMap) {
  const cnt = Number((await Q('SELECT COUNT(*) as c FROM students'))[0].c);
  if (cnt > 0) {
    log(`Students: ${cnt} already, rebuilding map...`);
    const rows = await Q(`SELECT sk.id oldId, st.id newId
      FROM ssfi_old.tbl_skaters sk
      JOIN users u ON u.phone = sk.mobile_number AND u.role = 'STUDENT'
      JOIN students st ON st.userId = u.id`);
    const map = {};
    for (const r of rows) map[r.oldId] = r.newId;
    return map;
  }

  const rows = await Q(`SELECT id,membership_id,verified,full_name,father_name,mobile_number,
    date_of_birth,category_type_id,gender,blood_group,school_name,aadhar_number,email_address,
    club_id,coach_name,coach_mobile_number,state_id,district_id,residential_address,
    identity_proof,profile_photo,nominee_name,nominee_age,nominee_relation,i_am,created_at
    FROM ssfi_old.tbl_skaters ORDER BY id`);

  const usedPhones  = new Set((await Q('SELECT phone FROM users WHERE phone IS NOT NULL')).map(r=>r.phone));
  const usedEmails  = new Set((await Q('SELECT email FROM users WHERE email IS NOT NULL')).map(r=>r.email));
  const usedAadhaar = new Set();

  const firstClub = (await Q('SELECT id FROM clubs LIMIT 1'))[0];
  if (!firstClub) { warn('No clubs exist! Cannot migrate students.'); return {}; }
  const fallbackClubId = firstClub.id;

  const map = {};
  let ok = 0, sk = 0;

  for (const s of rows) {
    let phone = String(s.mobile_number||'').trim() || `PH-SKT-${s.id}`;
    if (usedPhones.has(phone)) phone = `PH-SKT-${s.id}`;
    usedPhones.add(phone);

    let email = (s.email_address && s.email_address.includes('@')) ? s.email_address.trim().toLowerCase() : null;
    if (email && usedEmails.has(email)) email = null;
    if (email) usedEmails.add(email);

    let aadhaar = String(s.aadhar_number||'').replace(/\D/g,'');
    if (aadhaar.length !== 12) aadhaar = `PH-AA-SKT-${s.id}`;
    if (usedAadhaar.has(aadhaar)) aadhaar = `PH-AA-SKT-${s.id}-${Date.now()}`;
    usedAadhaar.add(aadhaar);

    const u2 = makeUid('STU');
    const isApproved = s.verified === 1;
    const clubId = clubMap[s.club_id] || fallbackClubId;
    const dob = s.date_of_birth ? new Date(s.date_of_birth) : new Date('2000-01-01');

    try {
      await X(`INSERT INTO users(uid,email,phone,password,role,isActive,isApproved,approvalStatus,registrationDate,accountStatus,createdAt,updatedAt)
               VALUES(?,?,?,?,'STUDENT',1,?,?,?,?,?,NOW())`,
        [u2, email, phone, HASHED_PW, isApproved, isApproved?'APPROVED':'PENDING',
         s.created_at||new Date(), 'ACTIVE', s.created_at||new Date()]);
      const newUserId = await lastId();

      await X(`INSERT INTO students
        (userId,stateId,districtId,clubId,name,dateOfBirth,gender,bloodGroup,
         aadhaarNumber,fatherName,motherName,schoolName,academicBoard,
         nomineeName,nomineeAge,nomineeRelation,coachName,coachPhone,
         addressLine1,city,pincode,aadhaarCard,profilePhoto,
         membershipId,categoryTypeId,verified,iAm,coachMobileNumber,
         identityProof,residentialAddress,createdAt,updatedAt)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
        [newUserId, s.state_id||1, s.district_id||1, clubId,
         s.full_name||'Unknown', dob, genderVal(s.gender), bloodVal(s.blood_group), aadhaar,
         s.father_name||'To be updated', null, s.school_name||'To be updated', boardVal(s.i_am),
         s.nominee_name||'To be updated', parseInt(s.nominee_age)||0, s.nominee_relation||'To be updated',
         s.coach_name||'To be updated', s.coach_mobile_number||'0000000000',
         s.residential_address||'To be updated', 'To be updated', '000000',
         s.identity_proof||null, s.profile_photo||null,
         s.membership_id||null, s.category_type_id||null, s.verified||0,
         s.i_am||null, s.coach_mobile_number||null,
         s.identity_proof||null, s.residential_address||null]);

      map[s.id] = await lastId();
      ok++;
    } catch(e) {
      warn(`Skater ${s.id} (${s.full_name}): ${e.message}`);
      sk++;
    }
  }
  log(`Skaters→Students: ${ok} inserted, ${sk} skipped`);
  return map;
}

// ── 8. Events ─────────────────────────────────────────────────────────────────
async function step8_events(adminId) {
  const cnt = Number((await Q('SELECT COUNT(*) as c FROM events'))[0].c);
  if (cnt > 0) {
    log(`Events: ${cnt} already, rebuilding map...`);
    const rows = await Q('SELECT id,code FROM events');
    const map = {};
    for (const r of rows) { const m = String(r.code).match(/-(\d+)$/); if(m) map[parseInt(m[1])] = r.id; }
    return map;
  }

  const catMap = {1:'DISTRICT',2:'STATE',3:'NATIONAL'};
  const rows = await Q(`SELECT id,event_level_type_id,state_id,district_id,session_id,
    event_name,event_image,event_date,reg_start_date,reg_end_date,event_description,
    event_fees,title_of_championship,association_name,reg_no,venue,secretory_sign,president_sign
    FROM ssfi_old.tbl_events ORDER BY id`);

  const usedCodes = new Set();
  const map = {};
  let ok = 0, sk = 0;

  for (const e of rows) {
    const cat = catMap[e.event_level_type_id] || 'NATIONAL';
    let slug = String(e.event_name||'EVT').replace(/[^a-zA-Z0-9]/g,'').slice(0,8).toUpperCase();
    let code = `EVT-${slug}-${String(e.id).padStart(4,'0')}`;
    while (usedCodes.has(code)) code += 'X';
    usedCodes.add(code);

    const evDate = e.event_date     ? new Date(e.event_date)     : new Date();
    const rsDate = e.reg_start_date ? new Date(e.reg_start_date) : new Date();
    const reDate = e.reg_end_date   ? new Date(e.reg_end_date)   : new Date();
    const fee    = parseFloat(e.event_fees) || 0;

    try {
      // Using exact column names from DESCRIBE events
      await X(`INSERT INTO events
        (creatorId,code,name,description,category,eventType,eventLevel,status,
         stateId,districtId,eventDate,registrationStartDate,registrationEndDate,
         venue,entryFee,lateFee,associationName,associationRegNo,certificateTitle,
         secretarySignature,presidentSignature,bannerImage,
         sessionId,eventLevelTypeId,eventFees,eventImage,regNo,titleOfChampionship,
         createdAt,updatedAt)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
        [adminId, code, e.event_name||'Unnamed', e.event_description||null,
         cat, 'COMPETITION', cat, 'COMPLETED',
         e.state_id||null, e.district_id||null,
         evDate, rsDate, reDate,
         e.venue||null, fee,
         e.association_name||null, e.reg_no||null, e.title_of_championship||null,
         e.secretory_sign||null, e.president_sign||null, e.event_image||null,
         e.session_id||4, e.event_level_type_id||null,
         fee, e.event_image||null, e.reg_no||null, e.title_of_championship||null]);
      map[e.id] = await lastId();
      ok++;
    } catch(e2) { warn(`Event ${e.id}: ${e2.message}`); sk++; }
  }
  log(`Events: ${ok} inserted, ${sk} skipped`);
  return map;
}

// ── 9. Event Registrations ────────────────────────────────────────────────────
async function step9_regs(eventMap, skaterMap, clubMap) {
  const cnt = Number((await Q('SELECT COUNT(*) as c FROM event_registrations'))[0].c);
  if (cnt > 0) { log(`Event registrations: ${cnt} already, skipping`); return; }

  let rows;
  try {
    rows = await Q(`SELECT er.id,er.skater_id,er.event_id,er.eligible_event_level_id,
      er.event_level_type_id,er.session_id,er.suit_size,er.payment_id,er.order_id,
      s.date_of_birth,s.club_id old_club_id,s.state_id,s.district_id,
      ev.event_date,ev.event_fees
      FROM ssfi_old.tbl_event_registration er
      LEFT JOIN ssfi_old.tbl_skaters s ON s.id=er.skater_id
      LEFT JOIN ssfi_old.tbl_events ev ON ev.id=er.event_id`);
  } catch(e) { warn(`No tbl_event_registration: ${e.message}`); return; }

  const eelMap = {};
  const eelRows = await Q('SELECT id,category_type_id,event_level_name FROM tbl_eligible_event_level');
  for (const r of eelRows) eelMap[r.id] = { catId: r.category_type_id, race: r.event_level_name };

  const usedConf = new Set();
  const usedEvStu = new Set(); // track (eventId,studentId) to avoid unique constraint
  let ok = 0, sk = 0;

  for (const r of rows) {
    const newEvId  = eventMap[r.event_id];
    const newStuId = skaterMap[r.skater_id];
    if (!newEvId || !newStuId) { sk++; continue; }
    const evStuKey = `${newEvId}-${newStuId}`;
    if (usedEvStu.has(evStuKey)) { sk++; continue; } // skip duplicate registration
    usedEvStu.add(evStuKey);

    const newClubId = clubMap[r.old_club_id] || null;
    const eel  = eelMap[r.eligible_event_level_id] || {};
    const cat  = skateCat(eel.catId || r.event_level_type_id);
    const age  = ageCat(r.date_of_birth, r.event_date);
    const races = JSON.stringify(eel.race ? [eel.race] : []);
    const paid  = !!(r.payment_id && String(r.payment_id).trim());
    const fee   = parseFloat(r.event_fees) || 0;

    let conf = `CNF-${String(newEvId).padStart(4,'0')}-${String(newStuId).padStart(5,'0')}-${Date.now().toString(36).toUpperCase()}`;
    while (usedConf.has(conf)) conf += Math.random().toString(36).slice(2,4);
    usedConf.add(conf);

    try {
      await X(`INSERT INTO event_registrations
        (eventId,studentId,clubId,districtId,stateId,confirmationNumber,
         suitSize,skateCategory,ageCategory,selectedRaces,
         entryFee,lateFee,totalFee,amountPaid,status,paymentStatus,
         paymentId,orderId,eligibleEventLevelId,eventLevelTypeId,sessionId,
         registrationDate,confirmedAt,paidAt,createdAt,updatedAt)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,?,?,?,?,NOW(),?,?,NOW(),NOW())`,
        [newEvId, newStuId, newClubId, r.district_id||null, r.state_id||null,
         conf, r.suit_size||'M', cat, age, races,
         fee, fee, paid?fee:0,
         paid?'CONFIRMED':'PENDING', paid?'PAID':'PENDING',
         r.payment_id||null, r.order_id||null,
         r.eligible_event_level_id||null, r.event_level_type_id||null, r.session_id||null,
         paid?new Date():null, paid?new Date():null]);
      ok++;
    } catch(e) { warn(`Reg ${r.id}: ${e.message}`); sk++; }
  }
  log(`Event registrations: ${ok} inserted, ${sk} skipped`);
}

// ── 10. Session Renewals ──────────────────────────────────────────────────────
async function step10_renewals(skaterMap) {
  const cnt = Number((await Q('SELECT COUNT(*) as c FROM tbl_session_renewal'))[0].c);
  if (cnt > 0) { log(`Session renewals: ${cnt} already, skipping`); return; }

  // Real cols confirmed: id,skater_id,session_id,payment_id,order_id,amount,status,created_at,updated_at
  let rows;
  try {
    rows = await Q('SELECT id,user_id,skater_id,session_id,payment_id,order_id,payment_status,created_at FROM ssfi_old.tbl_session_renewal');
  } catch(e) { warn(`tbl_session_renewal: ${e.message}`); return; }

  let ok = 0, sk = 0;
  for (const r of rows) {
      // skater_id is often 0 in renewals � fallback to user_id lookup
    let newStuId = skaterMap[r.skater_id];
    if (!newStuId && r.user_id) {
      // find student via old user's mobile_number
      const uRow = await Q('SELECT mobile_number FROM ssfi_old.tbl_user WHERE id=? LIMIT 1', [r.user_id]);
      if (uRow.length > 0 && uRow[0].mobile_number) {
        const sRow = await Q('SELECT st.id FROM users u JOIN students st ON st.userId=u.id WHERE u.phone=? AND u.role=\'STUDENT\' LIMIT 1', [uRow[0].mobile_number]);
        if (sRow.length > 0) newStuId = sRow[0].id;
      }
    }
    if (!newStuId) { sk++; continue; }
    try {
      await X(`INSERT INTO tbl_session_renewal(id,skater_id,session_id,payment_id,order_id,amount,status,created_at,updated_at)
               VALUES(?,?,?,?,?,?,?,?,NOW())`,
        [r.id, newStuId, r.session_id, r.payment_id||null, r.order_id||null,
         0, r.payment_status||'migrated', r.created_at||new Date()]);
      ok++;
    } catch(e) { warn(`Renewal ${r.id}: ${e.message}`); sk++; }
  }
  log(`Session renewals: ${ok} inserted, ${sk} skipped`);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  log('═══════════════════════════════════════════');
  log(' SSFI MIGRATION v4 — ' + new Date().toLocaleString());
  log('═══════════════════════════════════════════');
  HASHED_PW = await bcrypt.hash('SSFI@Migrate2025!', 12);

  try { await Q('SELECT COUNT(*) as c FROM ssfi_old.tbl_skaters'); }
  catch(e) { log('ERROR: ssfi_old not accessible. Import ssfi_db_fixed.sql first.'); process.exit(1); }

  await step1_states();
  await step2_districts();
  await step3_lookups();

  const clubMap   = await step4_clubs();
  log(`Club map: ${Object.keys(clubMap).length} entries`);

  const adminId   = await step5_adminUser();
  const _userMap  = await step6_users(clubMap);
  const skaterMap = await step7_skaters(clubMap);
  log(`Skater map: ${Object.keys(skaterMap).length} entries`);

  const eventMap  = await step8_events(adminId);
  log(`Event map: ${Object.keys(eventMap).length} entries`);

  await step9_regs(eventMap, skaterMap, clubMap);
  await step10_renewals(skaterMap);

  log('\n══════════════ FINAL SUMMARY ══════════════');
  for (const t of ['states','districts','clubs','users','students','events','event_registrations','tbl_session_renewal']) {
    const r = await Q(`SELECT COUNT(*) as c FROM ${t}`);
    log(`  ${t.padEnd(26)} ${r[0].c}`);
  }
  log('═══════════════════════════════════════════');
  log('✓  Migration complete!  Password: SSFI@Migrate2025!');
}

main()
  .catch(e => { log('FATAL: ' + e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
