/**
 * SSFI Certificate Service
 * Generates PDF certificates using PDFKit.
 *
 * Two-page PDF:
 *   Page 1 — Certificate front  (portrait A4, ~595 x 842 pt)
 *   Page 2 — Certificate back   (same size, logo + Bharat Skate partner)
 *
 * Four skate-category variants:
 *   ADJUSTABLE | PRO_INLINE | QUAD | RECREATIONAL
 *
 * Race slots (7):
 *   RINK_200M / ROAD_100M / RINK_400M / ROAD_2000M /
 *   RINK_1000M / POINT_TO_POINT / RELAY
 */

import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import prisma from '../config/prisma';
// ── Asset paths ────────────────────────────────────────────────────────────────
const ASSETS = path.join(__dirname, '../../uploads/signatures');

const ASSET = {
  logo:      path.join(ASSETS, 'logo.png'),
  chakra:    path.join(ASSETS, 'chakra.png'),
  president: path.join(ASSETS, 'President.png'),
  secretary: path.join(ASSETS, 'secretary.png'),
};

// ── Colours ────────────────────────────────────────────────────────────────────
const NAVY   = '#1a1f8c';
const RED    = '#cc0000';
const ORANGE = '#e8880a';
const GREEN  = '#1a9b3c';
const LIGHT_BLUE = '#dde6f7';
const GREY   = '#555555';

// ── Helpers ───────────────────────────────────────────────────────────────────

function centreText(
  doc: PDFKit.PDFDocument,
  text: string,
  y: number,
  opts?: PDFKit.Mixins.TextOptions & { color?: string; size?: number; font?: string },
) {
  const { color = NAVY, size = 10, font = 'Helvetica', ...rest } = opts || {};
  doc.font(font).fontSize(size).fillColor(color).text(text, 0, y, { align: 'center', width: 595, ...rest });
}

function ordinal(n: number): string {
  if (n === 1) return '1ST';
  if (n === 2) return '2ND';
  if (n === 3) return '3RD';
  return `${n}TH`;
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    ADJUSTABLE:   'ADJUSTABLE SKATES',
    PRO_INLINE:   'PRO-INLINE SKATES',
    QUAD:         'QUAD SKATES',
    RECREATIONAL: 'RECREATIONAL SKATES',
  };
  return map[cat?.toUpperCase()] || cat;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
}

function assetExists(p: string): boolean {
  try { return fs.existsSync(p); } catch { return false; }
}

// ── Race slot definitions ─────────────────────────────────────────────────────

const RACE_SLOTS = [
  { label: 'RINK 200M',       key: 'RINK_200M'        },
  { label: 'RINK 400M',       key: 'RINK_400M'        },
  { label: 'RINK 1000M',      key: 'RINK_1000M'       },
  { label: 'RELAY',           key: 'RELAY'             },
];
const RACE_SLOTS_RIGHT = [
  { label: 'ROAD 100M',       key: 'ROAD_100M'        },
  { label: 'ROAD 2000M',      key: 'ROAD_2000M'       },
  { label: 'POINT TO POINT',  key: 'POINT_TO_POINT'   },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export interface CertificateData {
  studentName:    string;
  membershipId:   string;   // SSFI UID
  stateName:      string;
  ageCategory:    string;   // e.g. "ABOVE 16 YEARS"
  skateCategory:  string;   // ADJUSTABLE | PRO_INLINE | QUAD | RECREATIONAL
  eventName:      string;
  eventStartDate: Date;
  eventEndDate:   Date;
  venue:          string;
  city:           string;
  certificateNo:  string;
  regNo:          string;   // e.g. "897/11"
  profilePhoto?:  string;   // Optional path to student's photo
  results: {
    raceType:  string;      // matches key in RACE_SLOTS
    position:  number | null;
    timing?:   string;
  }[];
}

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const doc = new PDFDocument({
      size: 'A4',        // 595.28 x 841.89 pt
      margin: 0,
      info: {
        Title:   `SSFI Certificate — ${data.studentName}`,
        Author:  'Speed Skating Federation of India',
        Subject: data.eventName,
      },
    });

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── PAGE 1: Front ─────────────────────────────────────────────────────────
    drawFront(doc, data);

    // ── PAGE 2: Back ──────────────────────────────────────────────────────────
    doc.addPage({ size: 'A4', margin: 0 });
    drawBack(doc);

    doc.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FRONT PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function drawFront(doc: PDFKit.PDFDocument, d: CertificateData) {
  const W = 595, H = 842;

  // ── Border ───────────────────────────────────────────────────────────────────
  doc.rect(8, 8, W - 16, H - 16).lineWidth(3).strokeColor(NAVY).stroke();
  doc.rect(12, 12, W - 24, H - 24).lineWidth(1).strokeColor(NAVY).stroke();

  // ── UID strip (rotated 90°, right side) ──────────────────────────────────────
  doc.save();
  doc.translate(W - 22, H / 2);
  doc.rotate(-90);
  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(NAVY)
    .text(`SSFI UID: ${d.membershipId}  |  ${d.studentName.toUpperCase()}  |  CERT NO: ${d.certificateNo}`, -130, 0, {
      width: 260,
      align: 'center',
    });
  doc.restore();

  // ── Reg No (top right) ────────────────────────────────────────────────────────
  doc.font('Helvetica').fontSize(7.5).fillColor(GREY)
     .text(`Reg No. ${d.regNo}`, W - 110, 24, { width: 95, align: 'right' });

  // ── Watermark chakra ─────────────────────────────────────────────────────────
  if (assetExists(ASSET.chakra)) {
    doc.save();
    doc.opacity(0.06);
    doc.image(ASSET.chakra, W / 2 - 130, 240, { width: 260 });
    doc.restore();
  }

  // ── Header Logo area ─────────────────────────────────────────────────────────
  // Chakra left
  if (assetExists(ASSET.chakra)) {
    doc.image(ASSET.chakra, 28, 26, { width: 62 });
  }

  // SSFI Logo + wordmark (right of chakra)
  if (assetExists(ASSET.logo)) {
    doc.image(ASSET.logo, 95, 24, { width: 310, height: 60 });
  } else {
    // Fallback text
    doc.font('Helvetica-Bold').fontSize(26).fillColor(NAVY)
       .text('S.S.F.I', 95, 30, { width: 310, align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor(NAVY)
       .text('SPEED SKATING FEDERATION OF INDIA', 95, 60, { width: 310, align: 'center' });
  }

  // Hindi text below logo
  let y = 92;
  centreText(doc, 'भारतिय स्पीड स्केटिंग महासंघ', y, { size: 11, color: RED, font: 'Helvetica-Bold' });
  y += 16;
  centreText(doc, 'SINCE 2001', y, { size: 7, color: NAVY });
  y += 11;

  // Sub-tagline
  const tagline = 'IN COLLABORATION WITH STAIRS FOUNDATION, A NATIONAL SPORTS PROMOTION ORGANISATION\n(NSPO) RECOGNISED BY THE MINISTRY OF YOUTH AFFAIRS AND SPORTS';
  doc.font('Helvetica').fontSize(6.5).fillColor(GREY)
     .text(tagline, 35, y, { align: 'center', width: W - 70 });
  y += 24;

  doc.font('Helvetica').fontSize(6).fillColor(GREY)
     .text('P-12 PORKUDIL NAGAR, PODUMBU-625018, MADURAI, TAMIL NADU | WWW.SSFISKATE.COM', 35, y, { align: 'center', width: W - 70 });
  y += 18;

  // ── Divider ──────────────────────────────────────────────────────────────────
  doc.moveTo(35, y).lineTo(W - 35, y).lineWidth(0.5).strokeColor('#cccccc').stroke();
  y += 10;

  // ── Certificate No ────────────────────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY)
     .text(`Certificate No. : ${d.certificateNo}`, 35, y, { width: W - 70, align: 'center' });
  y += 22;

  // ── "CERTIFICATE OF MERIT" title ──────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(28).fillColor(NAVY)
     .text('CERTIFICATE OF MERIT', 0, y, { align: 'center', width: W, characterSpacing: 1 });
  y += 40;

  // Decorative line (orange/green)
  const lineY = y;
  doc.moveTo(60, lineY).lineTo(W - 60, lineY).lineWidth(2).strokeColor(ORANGE).stroke();
  doc.moveTo(60, lineY + 4).lineTo(W - 60, lineY + 4).lineWidth(1).strokeColor(GREEN).stroke();
  y += 22;

  // ── Body text ────────────────────────────────────────────────────────────────
  // "This is to certify that" style — matches template
  doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY);

  const bodyLine1 = `REPRESENTED ${d.stateName.toUpperCase()} IN THE ${d.ageCategory.toUpperCase()} AGE GROUP AND PARTICIPATED`;
  doc.text(bodyLine1, 35, y, { align: 'center', width: W - 70 });
  y += 16;

  // Event name in RED (highlighted)
  const eventLine = `IN THE ${d.eventName.toUpperCase()} HELD AT`;
  // Split to highlight event name
  const preText  = 'IN THE ';
  const postText = ' HELD AT';
  const xStart = (W - doc.widthOfString(eventLine)) / 2;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY).text('IN THE ', xStart, y, { continued: true })
     .fillColor(RED).text(d.eventName.toUpperCase(), { continued: true })
     .fillColor(NAVY).text(' HELD AT');
  y += 16;

  doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY)
     .text(`${d.venue.toUpperCase()}, ${d.city.toUpperCase()}`, 35, y, { align: 'center', width: W - 70 });
  y += 16;

  const dateRange = `FROM ${formatDate(d.eventStartDate)} TO ${formatDate(d.eventEndDate)}`;
  doc.text(dateRange, 35, y, { align: 'center', width: W - 70 });
  y += 16;

  doc.text('AND ATTAINED THE FOLLOWING RANKING:', 35, y, { align: 'center', width: W - 70 });
  y += 24;

  // ── Skate category title ──────────────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(13).fillColor(RED)
     .text(`IN THE ${categoryLabel(d.skateCategory).toUpperCase()} CATEGORY`, 35, y, { align: 'center', width: W - 70 });
  y += 28;

  // ── Race results grid ────────────────────────────────────────────────────────
  const resultMap = new Map(d.results.map(r => [r.raceType?.toUpperCase(), r]));

  const leftX  = 50;
  const rightX = 300;
  const colW   = 220;
  const rowH   = 24;

  const renderRaceRow = (label: string, key: string, x: number, rowY: number) => {
    const res = resultMap.get(key.toUpperCase());
    const posText = res?.position ? ordinal(res.position) : (res ? 'PARTICIPATED' : '-');
    const posColor = res?.position ? RED : (res ? GREEN : GREY);

    doc.font('Helvetica-Bold').fontSize(9).fillColor(RED)
       .text(label, x, rowY, { width: 100 });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY)
       .text('—', x + 108, rowY, { width: 10 });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(posColor)
       .text(posText, x + 122, rowY, { width: 90 });
  };

  const maxRows = Math.max(RACE_SLOTS.length, RACE_SLOTS_RIGHT.length);
  for (let i = 0; i < maxRows; i++) {
    const rowY = y + i * rowH;
    if (RACE_SLOTS[i])       renderRaceRow(RACE_SLOTS[i].label,       RACE_SLOTS[i].key,       leftX,  rowY);
    if (RACE_SLOTS_RIGHT[i]) renderRaceRow(RACE_SLOTS_RIGHT[i].label, RACE_SLOTS_RIGHT[i].key, rightX, rowY);
  }

  y += maxRows * rowH + 10;

  // ── Photo box + Signatures ───────────────────────────────────────────────────
  const sigAreaY = y + 20;

  // President signature (left)
  if (assetExists(ASSET.president)) {
    doc.image(ASSET.president, 45, sigAreaY, { width: 110, height: 32 });
  }
  doc.moveTo(40, sigAreaY + 40).lineTo(195, sigAreaY + 40).lineWidth(0.5).strokeColor(NAVY).stroke();
  doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY)
     .text('KRISHNA BAISWARE', 40, sigAreaY + 44, { width: 155, align: 'center' });
  doc.font('Helvetica').fontSize(7).fillColor(GREY)
     .text('President', 40, sigAreaY + 56, { width: 155, align: 'center' });

  // Photo box (centre)
  const photoX = W / 2 - 32;
  const photoY = sigAreaY + 2;
  if (d.profilePhoto && assetExists(d.profilePhoto)) {
    doc.image(d.profilePhoto, photoX, photoY, { width: 64, height: 80, fit: [64, 80] });
    doc.rect(photoX, photoY, 64, 80).lineWidth(1).strokeColor(NAVY).stroke();
  } else {
    doc.rect(photoX, photoY, 64, 80).lineWidth(1).strokeColor(NAVY).stroke();
    doc.font('Helvetica').fontSize(6).fillColor('#aaaaaa')
       .text('Photo', photoX, photoY + 34, { width: 64, align: 'center' });
  }

  // General Secretary signature (right)
  if (assetExists(ASSET.secretary)) {
    doc.image(ASSET.secretary, 385, sigAreaY, { width: 150, height: 28 });
  }
  doc.moveTo(380, sigAreaY + 40).lineTo(555, sigAreaY + 40).lineWidth(0.5).strokeColor(NAVY).stroke();
  doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY)
     .text('SHRI. S.MURUGANANDHAM', 380, sigAreaY + 44, { width: 175, align: 'center' });
  doc.font('Helvetica').fontSize(7).fillColor(GREY)
     .text('General Secretary', 380, sigAreaY + 56, { width: 175, align: 'center' });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BACK PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function drawBack(doc: PDFKit.PDFDocument) {
  const W = 595, H = 842;

  // Border (double)
  doc.rect(8, 8, W - 16, H - 16).lineWidth(3).strokeColor(NAVY).stroke();
  doc.rect(12, 12, W - 24, H - 24).lineWidth(1).strokeColor(NAVY).stroke();

  // Centred SSFI logo
  if (assetExists(ASSET.logo)) {
    doc.image(ASSET.logo, W / 2 - 175, H / 2 - 80, { width: 350 });
  }

  // Hindi + tagline below
  const midY = H / 2 + 55;
  centreText(doc, 'भारतिय स्पीड स्केटिंग महासंघ', midY, { size: 12, color: RED, font: 'Helvetica-Bold' });
  centreText(doc, 'SINCE 2001', midY + 18, { size: 7, color: NAVY });
  centreText(doc, 'IN COLLABORATION WITH STAIRS FOUNDATION A NATIONAL SPORTS PROMOTION', midY + 30, { size: 6.5, color: GREY });
  centreText(doc, 'ORGANISATION (NSPO) RECOGNIZED BY MINISTRY OF YOUTH AFFAIRS AND SPORTS', midY + 40, { size: 6.5, color: GREY });
  centreText(doc, 'P-12 PORKUDIL NAGAR, PODUMBU - 625018, MADURAI, TAMIL NADU | WWW.SSFIBHARATSKATE.COM', midY + 52, { size: 5.8, color: GREY });

  // ── Bottom partners row ──────────────────────────────────────────────────────
  const bY = H - 105;
  doc.moveTo(40, bY - 10).lineTo(W - 40, bY - 10).lineWidth(0.5).strokeColor('#dddddd').stroke();

  // "Organising Partner" — Bharat Skate (only partner shown per requirements)
  doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY)
     .text('Organising Partner', W / 2 - 60, bY, { width: 120, align: 'center' });

  // Bharat Skate logo text (styled like original — we recreate typographically)
  const bsY = bY + 18;
  doc.font('Helvetica-Bold').fontSize(20).fillColor(NAVY)
     .text('भारत', W / 2 - 50, bsY, { width: 100, align: 'center' });
  // SKATE with Indian flag stripe under
  doc.font('Helvetica-Bold').fontSize(20).fillColor(NAVY)
     .text('SKATE', W / 2 - 50, bsY + 24, { width: 100, align: 'center' });
  // Tricolor stripe
  const tcY = bsY + 50;
  const tcX = W / 2 - 30;
  doc.rect(tcX, tcY, 20, 5).fillColor(ORANGE).fill();
  doc.rect(tcX + 20, tcY, 20, 5).fillColor('#ffffff').fill().rect(tcX + 20, tcY, 20, 5).lineWidth(0.5).strokeColor('#cccccc').stroke();
  doc.rect(tcX + 40, tcY, 20, 5).fillColor(GREEN).fill();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HIGH-LEVEL: issue certificates when results are published
// ═══════════════════════════════════════════════════════════════════════════════

export async function issueCertificatesForEvent(eventId: number): Promise<{ issued: number; skipped: number }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      state: true,
      registrations: {
        where: { status: { in: ['APPROVED', 'CONFIRMED'] } },
        include: {
          student: {
            include: { state: true, user: true },
          },
        },
      },
      raceResults: true,
    },
  });

  if (!event) throw new Error('Event not found');

  let issued = 0;
  let skipped = 0;

  for (const reg of event.registrations) {
    // Check if already issued
    const existing = await prisma.certificate.findUnique({
      where: { eventId_studentId: { eventId, studentId: reg.studentId } },
    });
    if (existing) { skipped++; continue; }

    // Generate cert number: SSFI-CERT-YYYY-NNNNN
    const year = new Date().getFullYear();
    const count = await prisma.certificate.count();
    const certNo = `SSFI-CERT-${year}-${String(count + 1).padStart(5, '0')}`;

    // Get results for this student
    const studentResults = event.raceResults.filter(r => r.studentId === reg.studentId);

    // Build results snapshot
    const allRaceKeys = [...RACE_SLOTS, ...RACE_SLOTS_RIGHT].map(s => s.key);
    const resultsPayload = allRaceKeys.map(key => {
      const match = studentResults.find(r => r.raceType.toUpperCase() === key);
      return {
        raceType: key,
        position: match?.position ?? null,
        timing:   match?.timing ?? undefined,
      };
    });

    // Derive age category from registration
    const ageCategory = reg.ageCategory || 'ALL CATEGORIES';

    // Create Certificate record with snapshot
    await prisma.certificate.create({
      data: {
        eventId,
        studentId: reg.studentId,
        certificateNumber: certNo,
        position: studentResults.length > 0
          ? `${Math.min(...studentResults.filter(r => r.position).map(r => r.position))}` // best position
          : 'Participant',
        category: reg.skateCategory,
        // Store results + meta as pdfPath field is not ideal — we use pdfPath to store a JSON snapshot
        // Better: we add extra columns. For now keep as null and regenerate on download.
        pdfPath: null,
      },
    });

    issued++;
  }

  return { issued, skipped };
}

// ── Build CertificateData from DB for PDF generation ─────────────────────────

export async function buildCertificateData(certId: number): Promise<CertificateData> {
  const cert = await prisma.certificate.findUnique({
    where: { id: certId },
    include: {
      event: { include: { state: true } },
      student: { include: { state: true, user: true } },
    },
  });

  if (!cert) throw new Error('Certificate not found');

  // Fetch results
  const results = await prisma.raceResult.findMany({
    where: { eventId: cert.eventId, studentId: cert.studentId },
  });

  // Fetch registration for skateCategory + ageCategory
  const reg = await prisma.eventRegistration.findUnique({
    where: { eventId_studentId: { eventId: cert.eventId, studentId: cert.studentId } },
  });

  const allRaceKeys = [...RACE_SLOTS, ...RACE_SLOTS_RIGHT].map(s => s.key);
  const resultsPayload = allRaceKeys.map(key => {
    const match = results.find(r => r.raceType.toUpperCase() === key);
    return {
      raceType: key,
      position: match?.position ?? null,
      timing:   match?.timing ?? undefined,
    };
  });

  const profilePhotoPath = cert.student.profilePhoto
    ? path.join(__dirname, '../../uploads', cert.student.profilePhoto)
    : undefined;

  return {
    studentName:    cert.student.name,
    membershipId:   cert.student.membershipId || cert.student.user?.uid || 'N/A',
    stateName:      cert.student.state?.name || 'INDIA',
    ageCategory:    reg?.ageCategory || cert.category || 'ALL CATEGORIES',
    skateCategory:  reg?.skateCategory || cert.category || 'ADJUSTABLE',
    eventName:      cert.event.name,
    eventStartDate: cert.event.eventDate,
    eventEndDate:   cert.event.eventEndDate || cert.event.eventDate,
    venue:          cert.event.venue || 'TBD',
    city:           cert.event.city || '',
    certificateNo:  cert.certificateNumber,
    regNo:          cert.event.associationRegNo || cert.event.regNo || '897/11',
    profilePhoto:   profilePhotoPath && fs.existsSync(profilePhotoPath) ? profilePhotoPath : undefined,
    results:        resultsPayload,
  };
}
