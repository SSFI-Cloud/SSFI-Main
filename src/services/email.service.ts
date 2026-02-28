import nodemailer from 'nodemailer';
import logger from '../utils/logger.util';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED LAYOUT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const BRAND_NAVY   = '#0B1F3A';
const BRAND_BLUE   = '#1A4BAF';
const BRAND_LIGHT  = '#E8F0FE';

/** Wraps every email in the master shell (header + footer) */
function layout(opts: {
    title: string;
    subtitle?: string;
    bannerColor: string;
    bannerIcon: string;
    bannerText: string;
    body: string;
}): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F0F4F8;padding:32px 0;">
  <tr><td align="center">
    <table width="620" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- ── HEADER ── -->
      <tr>
        <td style="background:linear-gradient(135deg,${BRAND_NAVY} 0%,#162d50 100%);padding:32px 40px;text-align:center;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <!-- Logo mark -->
                <div style="display:inline-block;background:rgba(255,255,255,0.12);border:2px solid rgba(255,255,255,0.25);border-radius:14px;padding:10px 22px;margin-bottom:14px;">
                  <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:3px;font-family:Georgia,serif;">SSFI</span>
                </div>
                <p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Skating Sports Federation of India</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── BANNER ── -->
      <tr>
        <td style="background:${opts.bannerColor};padding:16px 40px;text-align:center;">
          <p style="margin:0;color:#ffffff;font-size:15px;font-weight:700;letter-spacing:0.3px;">${opts.bannerIcon}&nbsp;&nbsp;${opts.bannerText}</p>
        </td>
      </tr>

      <!-- ── BODY ── -->
      <tr>
        <td style="padding:36px 40px;">
          ${opts.body}
        </td>
      </tr>

      <!-- ── FOOTER ── -->
      <tr>
        <td style="background:#F8FAFC;border-top:1px solid #E5E7EB;padding:20px 40px;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#9CA3AF;">Skating Sports Federation of India</p>
          <p style="margin:0;font-size:11px;color:#D1D5DB;">This is a system-generated email. Please do not reply directly to this message.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** Reusable labelled detail row for tables */
function row(label: string, value: string, bold = false): string {
    return `<tr>
      <td style="padding:9px 0;border-bottom:1px solid #F3F4F6;color:#6B7280;font-size:13px;width:42%;vertical-align:top;">${label}</td>
      <td style="padding:9px 0;border-bottom:1px solid #F3F4F6;color:#111827;font-size:13px;${bold ? 'font-weight:700;' : ''}vertical-align:top;">${value}</td>
    </tr>`;
}

/** Highlighted UID / reference number pill */
function uidBox(label: string, value: string, color = BRAND_BLUE): string {
    return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td align="center" style="background:${BRAND_LIGHT};border:1.5px solid ${color}33;border-radius:12px;padding:18px 24px;">
          <p style="margin:0 0 5px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#6B7280;">${label}</p>
          <p style="margin:0;font-size:22px;font-weight:800;color:${color};font-family:'Courier New',monospace;letter-spacing:2px;">${value}</p>
        </td>
      </tr>
    </table>`;
}

/** Info / warning / danger alert box */
function alertBox(type: 'info' | 'success' | 'warning' | 'danger', content: string): string {
    const styles: Record<string, { bg: string; border: string; color: string; icon: string }> = {
        info:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF', icon: 'ℹ️' },
        success: { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D', icon: '✅' },
        warning: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', icon: '⚠️' },
        danger:  { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B', icon: '❌' },
    };
    const s = styles[type];
    return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:${s.bg};border:1.5px solid ${s.border};border-radius:10px;padding:16px 20px;color:${s.color};font-size:13px;line-height:1.65;">
          ${s.icon}&nbsp;&nbsp;${content}
        </td>
      </tr>
    </table>`;
}

/** Credential card for login details */
function credentialCard(uid: string, password: string, role: string): string {
    return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#FFFBEB;border:1.5px solid #FDE68A;border-radius:12px;padding:22px 24px;">
          <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:0.5px;">🔐 Your Login Credentials</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${row('Login UID', `<span style="font-family:'Courier New',monospace;font-weight:700;font-size:14px;">${uid}</span>`, false)}
            ${row('Password', `<span style="font-family:'Courier New',monospace;">${password}</span>`, false)}
            ${row('Role', role, false)}
          </table>
          <p style="margin:14px 0 0;font-size:12px;color:#B45309;line-height:1.5;">⚠️ Your default password is your registered mobile number. Please log in and change it immediately to secure your account.</p>
        </td>
      </tr>
    </table>`;
}

/** Section card with title + content */
function sectionCard(title: string, content: string): string {
    return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:22px 24px;">
          <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">${title}</p>
          ${content}
        </td>
      </tr>
    </table>`;
}

/** Standard greeting block */
function greeting(name: string, message: string): string {
    return `<p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Dear ${name},</p>
    <p style="margin:0 0 28px;font-size:14px;color:#6B7280;line-height:1.7;">${message}</p>`;
}

/** Divider */
const divider = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;"><tr><td style="border-top:1px solid #E5E7EB;"></td></tr></table>`;

/** Payment status badge */
function payBadge(status: string): string {
    const paid = status === 'PAID' || status === 'COMPLETED';
    return `<span style="background:${paid ? '#D1FAE5' : '#FEF3C7'};color:${paid ? '#065F46' : '#92400E'};padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:0.3px;">${status}</span>`;
}

// ─────────────────────────────────────────────────────────────────────────────

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    private async send(to: string, subject: string, html: string, tag: string): Promise<void> {
        if (!process.env.SMTP_HOST) {
            logger.warn(`SMTP not configured — skipping ${tag} email`, { to });
            return;
        }
        try {
            await this.transporter.sendMail({
                from: `"${process.env.SMTP_FROM_NAME || 'SSFI'}" <${process.env.SMTP_USER}>`,
                to,
                subject,
                html,
            });
            logger.info(`[email:${tag}] sent → ${to}`);
        } catch (err) {
            logger.error(`[email:${tag}] failed → ${to}`, err);
            throw err;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. OTP EMAIL
    // ─────────────────────────────────────────────────────────────────────────
    async sendOTPEmail(to: string, otp: string, expiryMinutes = 10): Promise<void> {
        const subject = `${otp} is your SSFI verification code`;

        const body = `
          ${greeting('there', 'We received a request to verify your identity. Use the one-time password below to proceed.')}

          <!-- OTP Display -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
            <tr>
              <td align="center" style="background:linear-gradient(135deg,#0B1F3A,#1A4BAF);border-radius:14px;padding:32px 24px;">
                <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.6);">One-Time Password</p>
                <p style="margin:0;font-size:46px;font-weight:900;color:#ffffff;font-family:'Courier New',monospace;letter-spacing:14px;">${otp}</p>
                <p style="margin:12px 0 0;font-size:12px;color:rgba(255,255,255,0.5);">Valid for ${expiryMinutes} minutes</p>
              </td>
            </tr>
          </table>

          ${alertBox('warning', 'Never share this code with anyone. SSFI staff will never ask for your OTP. If you did not request this, please ignore this email — your account remains secure.')}

          <p style="margin:0;font-size:13px;color:#9CA3AF;text-align:center;">This code will expire at <strong>${new Date(Date.now() + expiryMinutes * 60 * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong></p>
        `;

        const html = layout({
            title: 'SSFI Verification Code',
            bannerColor: `linear-gradient(135deg,#1A4BAF,#6366F1)`,
            bannerIcon: '🔐',
            bannerText: 'Identity Verification',
            body,
        });

        await this.send(to, subject, html, 'otp');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. WELCOME / CREDENTIALS
    // ─────────────────────────────────────────────────────────────────────────
    async sendCredentials(to: string, name: string, details: { uid: string; password: string; role: string }): Promise<void> {
        const subject = `Welcome to SSFI — Your Login Credentials`;

        const roleLabel: Record<string, string> = {
            STATE_SECRETARY: 'State Secretary',
            DISTRICT_SECRETARY: 'District Secretary',
            CLUB_OWNER: 'Club Owner',
            STUDENT: 'Student',
            GLOBAL_ADMIN: 'Administrator',
        };

        const body = `
          ${greeting(name, `Welcome to the Skating Sports Federation of India! Your account has been successfully created. Below are your login credentials to access the SSFI portal.`)}

          ${credentialCard(details.uid, details.password, roleLabel[details.role] || details.role)}

          ${alertBox('info', `Login at <strong>ssfiskate.com</strong> using your UID and password. You will be prompted to change your password on first login.`)}

          ${sectionCard('NEXT STEPS', `
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">1.&nbsp;&nbsp;Log in with the credentials above</td></tr>
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">2.&nbsp;&nbsp;Change your password immediately</td></tr>
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">3.&nbsp;&nbsp;Complete your profile information</td></tr>
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">4.&nbsp;&nbsp;Explore your ${roleLabel[details.role] || details.role} dashboard</td></tr>
            </table>
          `)}
        `;

        const html = layout({
            title: 'Welcome to SSFI',
            bannerColor: `linear-gradient(135deg,${BRAND_BLUE},#6366F1)`,
            bannerIcon: '👋',
            bannerText: `Welcome to SSFI, ${name}!`,
            body,
        });

        await this.send(to, subject, html, 'credentials');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. AFFILIATION CONFIRMATION (Registration submitted / Renewal)
    // ─────────────────────────────────────────────────────────────────────────
    async sendAffiliationConfirmation(to: string, data: {
        type: 'STATE_SECRETARY' | 'DISTRICT_SECRETARY' | 'CLUB' | 'STUDENT';
        name: string;
        uid: string;
        defaultPassword?: string;
        stateName?: string;
        districtName?: string;
        clubName?: string;
        expiryDate?: string;
        isRenewal?: boolean;
    }): Promise<void> {
        const typeLabels: Record<string, string> = {
            STATE_SECRETARY: 'State Secretary',
            DISTRICT_SECRETARY: 'District Secretary',
            CLUB: 'Club Affiliation',
            STUDENT: 'Student Membership',
        };
        const typeLabel = typeLabels[data.type] || data.type;
        const isRenewal = data.isRenewal || false;

        const subject = isRenewal
            ? `SSFI Membership Renewed — ${typeLabel}`
            : `SSFI Registration Received — ${typeLabel}`;

        const detailRows = [
            data.stateName    ? row('State',       data.stateName)    : '',
            data.districtName ? row('District',    data.districtName) : '',
            data.clubName     ? row('Club',        data.clubName)     : '',
            data.expiryDate   ? row('Valid Until', `<strong>${data.expiryDate}</strong>`) : '',
            row('Registration Type', typeLabel),
            row('Status', isRenewal
                ? `<span style="color:#15803D;font-weight:700;">Renewed</span>`
                : `<span style="color:#D97706;font-weight:700;">Pending Review</span>`),
        ].filter(Boolean).join('');

        const body = `
          ${greeting(data.name, isRenewal
            ? `Your SSFI <strong>${typeLabel}</strong> membership has been renewed successfully. Thank you for continuing to be part of the Skating Sports Federation of India.`
            : `Thank you for registering with the Skating Sports Federation of India. Your <strong>${typeLabel}</strong> application has been received and is currently under review by our team.`
          )}

          ${uidBox('Your SSFI UID', data.uid)}

          ${sectionCard('APPLICATION DETAILS', `<table width="100%" cellpadding="0" cellspacing="0" border="0">${detailRows}</table>`)}

          ${data.defaultPassword && !isRenewal ? credentialCard(data.uid, data.defaultPassword, typeLabel) : ''}

          ${!isRenewal ? alertBox('info', `Your application is <strong>pending admin review</strong>. You will receive a separate email notification once it has been approved or if any action is required. Please save your SSFI UID for future reference.`) : ''}

          ${isRenewal ? alertBox('success', `Your membership is now active ${data.expiryDate ? `and valid until <strong>${data.expiryDate}</strong>` : ''}. You can continue to access all SSFI services and events.`) : ''}
        `;

        const bannerColor = isRenewal
            ? 'linear-gradient(135deg,#0891B2,#0E7490)'
            : 'linear-gradient(135deg,#16A34A,#15803D)';

        const html = layout({
            title: subject,
            bannerColor,
            bannerIcon: isRenewal ? '🔄' : '✅',
            bannerText: isRenewal ? 'Membership Renewed Successfully' : 'Registration Received',
            body,
        });

        await this.send(to, subject, html, `affiliation:${data.type}:${isRenewal ? 'renewal' : 'new'}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. APPROVAL NOTIFICATION
    // ─────────────────────────────────────────────────────────────────────────
    async sendApprovalNotification(to: string, data: {
        name: string;
        type: 'STATE_SECRETARY' | 'DISTRICT_SECRETARY' | 'CLUB' | 'STUDENT';
        uid: string;
        loginPassword?: string;
        stateName?: string;
        districtName?: string;
        clubName?: string;
        expiryDate?: string;
    }): Promise<void> {
        const typeLabels: Record<string, string> = {
            STATE_SECRETARY: 'State Secretary',
            DISTRICT_SECRETARY: 'District Secretary',
            CLUB: 'Club',
            STUDENT: 'Student',
        };
        const typeLabel = typeLabels[data.type] || data.type;
        const subject = `SSFI Application Approved — ${typeLabel}`;

        const detailRows = [
            data.stateName    ? row('State',       data.stateName)    : '',
            data.districtName ? row('District',    data.districtName) : '',
            data.clubName     ? row('Club',        data.clubName)     : '',
            row('Role', typeLabel, true),
            data.expiryDate ? row('Membership Valid Until', `<strong style="color:#15803D;">${data.expiryDate}</strong>`) : '',
        ].filter(Boolean).join('');

        const body = `
          ${greeting(data.name, `We are pleased to inform you that your <strong>${typeLabel}</strong> application with the Skating Sports Federation of India has been <strong style="color:#15803D;">approved</strong>. Welcome to the SSFI family!`)}

          <!-- Approved badge -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr>
              <td align="center" style="background:linear-gradient(135deg,#15803D,#166534);border-radius:12px;padding:24px;">
                <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;">Application Status</p>
                <p style="margin:0 0 10px;font-size:28px;font-weight:800;color:#ffffff;">APPROVED ✓</p>
                <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.6);">SSFI UID: <strong style="color:#fff;font-family:'Courier New',monospace;">${data.uid}</strong></p>
              </td>
            </tr>
          </table>

          ${sectionCard('MEMBERSHIP DETAILS', `<table width="100%" cellpadding="0" cellspacing="0" border="0">${detailRows}</table>`)}

          ${data.loginPassword ? credentialCard(data.uid, data.loginPassword, typeLabel) : ''}

          ${alertBox('success', `You now have full access to the SSFI portal and all services associated with your <strong>${typeLabel}</strong> role. Log in to your dashboard to get started.`)}
        `;

        const html = layout({
            title: subject,
            bannerColor: 'linear-gradient(135deg,#15803D,#166534)',
            bannerIcon: '🎉',
            bannerText: `Congratulations — Your Application is Approved!`,
            body,
        });

        await this.send(to, subject, html, `approval:${data.type}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. REJECTION NOTIFICATION
    // ─────────────────────────────────────────────────────────────────────────
    async sendRejectionNotification(to: string, data: {
        name: string;
        type: 'STATE_SECRETARY' | 'DISTRICT_SECRETARY' | 'CLUB' | 'STUDENT';
        uid: string;
        reason?: string;
    }): Promise<void> {
        const typeLabels: Record<string, string> = {
            STATE_SECRETARY: 'State Secretary',
            DISTRICT_SECRETARY: 'District Secretary',
            CLUB: 'Club',
            STUDENT: 'Student',
        };
        const typeLabel = typeLabels[data.type] || data.type;
        const subject = `SSFI Application Update — ${typeLabel}`;

        const body = `
          ${greeting(data.name, `We regret to inform you that your <strong>${typeLabel}</strong> application with the Skating Sports Federation of India could not be approved at this time.`)}

          <!-- UID reference -->
          ${uidBox('Application Reference', data.uid, '#DC2626')}

          ${data.reason ? sectionCard('REASON FOR REJECTION', `<p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">${data.reason}</p>`) : ''}

          ${alertBox('warning', `If you believe this decision was made in error, or if you would like to reapply after addressing the concerns raised, please contact the SSFI office at <a href="mailto:${process.env.SMTP_USER || 'info@ssfiskate.com'}" style="color:#92400E;font-weight:700;">${process.env.SMTP_USER || 'info@ssfiskate.com'}</a>.`)}

          ${sectionCard('WHAT YOU CAN DO', `
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">1.&nbsp;&nbsp;Review the reason provided above carefully</td></tr>
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">2.&nbsp;&nbsp;Gather any missing documents or correct the information</td></tr>
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">3.&nbsp;&nbsp;Contact us if you need clarification</td></tr>
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">4.&nbsp;&nbsp;Reapply once the issues have been resolved</td></tr>
            </table>
          `)}

          <p style="margin:0;font-size:13px;color:#6B7280;text-align:center;line-height:1.6;">We appreciate your interest in SSFI and hope to welcome you into our community soon.</p>
        `;

        const html = layout({
            title: subject,
            bannerColor: 'linear-gradient(135deg,#B91C1C,#991B1B)',
            bannerIcon: '📋',
            bannerText: 'Application Status Update',
            body,
        });

        await this.send(to, subject, html, `rejection:${data.type}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. EVENT REGISTRATION CONFIRMATION
    // ─────────────────────────────────────────────────────────────────────────
    async sendEventRegistrationConfirmation(to: string, data: {
        studentName: string;
        ssfiUid: string;
        confirmationNumber: string;
        eventName: string;
        eventDate: string;
        eventEndDate?: string;
        venue: string;
        city: string;
        ageCategory: string;
        skateCategory: string;
        selectedRaces: string[];
        totalFee: number;
        paymentStatus: string;
    }): Promise<void> {
        const subject = `Event Registration Confirmed — ${data.confirmationNumber}`;

        const racesFormatted = data.selectedRaces.length > 0
            ? data.selectedRaces.map(r =>
                `<tr><td style="padding:5px 0;color:#374151;font-size:13px;">⛸&nbsp;&nbsp;${r.replace(/_/g, ' ')}</td></tr>`
              ).join('')
            : `<tr><td style="padding:5px 0;color:#9CA3AF;font-size:13px;font-style:italic;">No specific races selected</td></tr>`;

        const body = `
          ${greeting(data.studentName, `Your registration for <strong>${data.eventName}</strong> has been received successfully. Please find your registration details below.`)}

          ${uidBox('Confirmation Number', data.confirmationNumber)}

          ${sectionCard('EVENT DETAILS', `
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${row('Event Name', `<strong>${data.eventName}</strong>`)}
              ${row('Date', data.eventDate + (data.eventEndDate ? ` &ndash; ${data.eventEndDate}` : ''))}
              ${row('Venue', `${data.venue}, ${data.city}`)}
              ${row('Athlete UID', `<span style="font-family:'Courier New',monospace;">${data.ssfiUid}</span>`)}
              ${row('Age Category', data.ageCategory)}
              ${row('Skate Category', data.skateCategory.replace(/_/g, ' '))}
              ${row('Entry Fee', `<strong>₹${data.totalFee.toLocaleString('en-IN')}</strong>`)}
              ${row('Payment Status', payBadge(data.paymentStatus))}
            </table>
          `)}

          ${sectionCard('SELECTED RACES', `<table width="100%" cellpadding="0" cellspacing="0" border="0">${racesFormatted}</table>`)}

          ${data.paymentStatus !== 'PAID' && data.paymentStatus !== 'COMPLETED'
            ? alertBox('warning', `Your registration is confirmed but <strong>payment is pending</strong>. Please complete payment before the deadline to secure your spot. Unpaid registrations may be cancelled.`)
            : alertBox('success', `Payment received. Your spot is confirmed. Please carry your Confirmation Number <strong>${data.confirmationNumber}</strong> on the event day.`)
          }

          ${alertBox('info', `Please arrive at the venue at least <strong>30 minutes before</strong> your scheduled race. Carry a valid ID proof and your SSFI UID card.`)}
        `;

        const html = layout({
            title: subject,
            bannerColor: 'linear-gradient(135deg,#1A4BAF,#6366F1)',
            bannerIcon: '🏅',
            bannerText: 'Event Registration Confirmed',
            body,
        });

        await this.send(to, subject, html, 'event-registration');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. BEGINNER CERT REGISTRATION CONFIRMATION
    // ─────────────────────────────────────────────────────────────────────────
    async sendBeginnerCertConfirmation(to: string, data: {
        studentName: string;
        registrationNumber: string;
        programTitle: string;
        programCategory: string;
        startDate: string;
        endDate: string;
        venue: string;
        city: string;
        state: string;
        amount: string | number | { toString(): string };
        paymentStatus: string;
    }): Promise<void> {
        const subject = `Beginner Certification Registered — ${data.registrationNumber}`;

        const categoryLabel: Record<string, string> = {
            SPEED_SKATING:  'Speed Skating',
            ARTISTIC:       'Artistic Skating',
            INLINE_HOCKEY:  'Inline Hockey',
            GENERAL:        'General Skating',
        };
        const catDisplay = categoryLabel[data.programCategory] || data.programCategory;

        const categoryIcon: Record<string, string> = {
            SPEED_SKATING: '⚡',
            ARTISTIC:      '🎨',
            INLINE_HOCKEY: '🏒',
            GENERAL:       '⛸️',
        };
        const catIcon = categoryIcon[data.programCategory] || '⛸️';

        const body = `
          ${greeting(data.studentName, `Congratulations! Your registration for the <strong>${data.programTitle}</strong> beginner certification program has been received. Here are your details.`)}

          ${uidBox('Registration Number', data.registrationNumber, '#7C3AED')}

          <!-- Category badge -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr>
              <td align="center" style="background:linear-gradient(135deg,#7C3AED,#6D28D9);border-radius:10px;padding:14px 24px;">
                <p style="margin:0;font-size:16px;font-weight:700;color:#fff;">${catIcon}&nbsp;&nbsp;${catDisplay}</p>
              </td>
            </tr>
          </table>

          ${sectionCard('PROGRAM DETAILS', `
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${row('Program', `<strong>${data.programTitle}</strong>`)}
              ${row('Category', catDisplay)}
              ${row('Start Date', data.startDate)}
              ${row('End Date', data.endDate)}
              ${row('Venue', data.venue)}
              ${row('Location', `${data.city}, ${data.state}`)}
              ${row('Program Fee', `<strong>₹${Number(data.amount).toLocaleString('en-IN')}</strong>`)}
              ${row('Payment Status', payBadge(data.paymentStatus))}
            </table>
          `)}

          ${data.paymentStatus !== 'PAID'
            ? alertBox('warning', `Payment for this program is <strong>pending</strong>. Please complete your payment to confirm your enrollment. Your registration number is <strong>${data.registrationNumber}</strong>.`)
            : alertBox('success', `You are successfully enrolled in the program. Please report to the venue on <strong>${data.startDate}</strong> with your registration number and a valid photo ID.`)
          }

          ${alertBox('info', `Please carry your registration number <strong>${data.registrationNumber}</strong> and a government-issued photo ID on the day of the program. Contact us at <a href="mailto:${process.env.SMTP_USER || 'info@ssfiskate.com'}" style="color:#1E40AF;">${process.env.SMTP_USER || 'info@ssfiskate.com'}</a> for any queries.`)}
        `;

        const html = layout({
            title: subject,
            bannerColor: 'linear-gradient(135deg,#7C3AED,#6D28D9)',
            bannerIcon: '🎓',
            bannerText: 'Beginner Certification Program — Registration Confirmed',
            body,
        });

        await this.send(to, subject, html, 'beginner-cert');
    }
}

export const emailService = new EmailService();
