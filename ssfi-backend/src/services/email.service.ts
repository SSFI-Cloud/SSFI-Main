import nodemailer from 'nodemailer';
import logger from '../utils/logger.util';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED LAYOUT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const BRAND_NAVY   = '#0B1F3A';
const BRAND_BLUE   = '#1A4BAF';
const BRAND_LIGHT  = '#E8F0FE';
const LOGO_URL     = `${process.env.FRONTEND_URL || 'https://www.ssfiskate.com'}/images/logo/ssfi-email-logo.png`;

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
        <td style="background:#ffffff;padding:28px 40px 20px;text-align:center;border-bottom:3px solid ${BRAND_NAVY};">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <!-- SSFI Logo -->
                <img src="${LOGO_URL}" alt="SSFI — Speed Skating Federation of India" width="220" style="display:block;margin:0 auto 8px;max-width:220px;height:auto;" />
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
          <p style="margin:0 0 6px;font-size:12px;color:#9CA3AF;">Speed Skating Federation of India</p>
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

    private async send(
        to: string,
        subject: string,
        html: string,
        tag: string,
        opts?: { replyTo?: string; text?: string },
    ): Promise<void> {
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
                ...(opts?.replyTo ? { replyTo: opts.replyTo } : {}),
                ...(opts?.text ? { text: opts.text } : {}),
            });
            logger.info(`[email:${tag}] sent → ${to}`);
        } catch (err) {
            logger.error(`[email:${tag}] failed → ${to}`, err);
            // Don't throw — email failure should not break the request
        }
    }

    /**
     * Fire-and-forget email — does NOT block the caller.
     * Use this from controllers so the HTTP response returns immediately.
     */
    sendInBackground(to: string, subject: string, html: string, tag: string): void {
        this.send(to, subject, html, tag).catch(() => {
            // Already logged inside send()
        });
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
        const esc = EmailService.escapeHtml;
        const subject = `Welcome to SSFI — Your Login Credentials`;

        const roleLabel: Record<string, string> = {
            STATE_SECRETARY: 'State Secretary',
            DISTRICT_SECRETARY: 'District Secretary',
            CLUB_OWNER: 'Club Owner',
            STUDENT: 'Student',
            GLOBAL_ADMIN: 'Administrator',
        };

        const safeName = esc(name);
        const safeUid = esc(details.uid);
        const safePassword = esc(details.password);
        const safeRole = roleLabel[details.role] || esc(details.role);

        const body = `
          ${greeting(safeName, `Welcome to the Speed Skating Federation of India! Your account has been successfully created. Below are your login credentials to access the SSFI portal.`)}

          ${credentialCard(safeUid, safePassword, safeRole)}

          ${alertBox('info', `Login at <strong>ssfiskate.com</strong> using your UID and password. You will be prompted to change your password on first login.`)}

          ${sectionCard('NEXT STEPS', `
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">1.&nbsp;&nbsp;Log in with the credentials above</td></tr>
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">2.&nbsp;&nbsp;Change your password immediately</td></tr>
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">3.&nbsp;&nbsp;Complete your profile information</td></tr>
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">4.&nbsp;&nbsp;Explore your ${safeRole} dashboard</td></tr>
            </table>
          `)}
        `;

        const html = layout({
            title: 'Welcome to SSFI',
            bannerColor: `linear-gradient(135deg,${BRAND_BLUE},#6366F1)`,
            bannerIcon: '👋',
            bannerText: `Welcome to SSFI, ${safeName}!`,
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
        const esc = EmailService.escapeHtml;
        const typeLabel = typeLabels[data.type] || data.type;
        const isRenewal = data.isRenewal || false;

        const safeName = esc(data.name);
        const safeUid = esc(data.uid);
        const safeStateName = data.stateName ? esc(data.stateName) : '';
        const safeDistrictName = data.districtName ? esc(data.districtName) : '';
        const safeClubName = data.clubName ? esc(data.clubName) : '';
        const safeExpiryDate = data.expiryDate ? esc(data.expiryDate) : '';
        const safeDefaultPassword = data.defaultPassword ? esc(data.defaultPassword) : '';

        const subject = isRenewal
            ? `SSFI Membership Renewed — ${typeLabel}`
            : `SSFI Registration Received — ${typeLabel}`;

        const detailRows = [
            safeStateName     ? row('State',       safeStateName)    : '',
            safeDistrictName  ? row('District',    safeDistrictName) : '',
            safeClubName      ? row('Club',        safeClubName)     : '',
            safeExpiryDate    ? row('Valid Until', `<strong>${safeExpiryDate}</strong>`) : '',
            row('Registration Type', typeLabel),
            row('Status', isRenewal
                ? `<span style="color:#15803D;font-weight:700;">Renewed</span>`
                : `<span style="color:#D97706;font-weight:700;">Pending Review</span>`),
        ].filter(Boolean).join('');

        const body = `
          ${greeting(safeName, isRenewal
            ? `Your SSFI <strong>${typeLabel}</strong> membership has been renewed successfully. Thank you for continuing to be part of the Speed Skating Federation of India.`
            : `Thank you for registering with the Speed Skating Federation of India. Your <strong>${typeLabel}</strong> application has been received and is currently under review by our team.`
          )}

          ${uidBox('Your SSFI UID', safeUid)}

          ${sectionCard('APPLICATION DETAILS', `<table width="100%" cellpadding="0" cellspacing="0" border="0">${detailRows}</table>`)}

          ${safeDefaultPassword && !isRenewal ? credentialCard(safeUid, safeDefaultPassword, typeLabel) : ''}

          ${!isRenewal ? alertBox('info', `Your application is <strong>pending admin review</strong>. You will receive a separate email notification once it has been approved or if any action is required. Please save your SSFI UID for future reference.`) : ''}

          ${isRenewal ? alertBox('success', `Your membership is now active ${safeExpiryDate ? `and valid until <strong>${safeExpiryDate}</strong>` : ''}. You can continue to access all SSFI services and events.`) : ''}
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
        const esc = EmailService.escapeHtml;
        const typeLabel = typeLabels[data.type] || data.type;
        const subject = `SSFI Application Approved — ${typeLabel}`;

        const safeName = esc(data.name);
        const safeUid = esc(data.uid);
        const safeStateName = data.stateName ? esc(data.stateName) : '';
        const safeDistrictName = data.districtName ? esc(data.districtName) : '';
        const safeClubName = data.clubName ? esc(data.clubName) : '';
        const safeExpiryDate = data.expiryDate ? esc(data.expiryDate) : '';
        const safeLoginPassword = data.loginPassword ? esc(data.loginPassword) : '';

        const detailRows = [
            safeStateName     ? row('State',       safeStateName)    : '',
            safeDistrictName  ? row('District',    safeDistrictName) : '',
            safeClubName      ? row('Club',        safeClubName)     : '',
            row('Role', typeLabel, true),
            safeExpiryDate ? row('Membership Valid Until', `<strong style="color:#15803D;">${safeExpiryDate}</strong>`) : '',
        ].filter(Boolean).join('');

        const body = `
          ${greeting(safeName, `We are pleased to inform you that your <strong>${typeLabel}</strong> application with the Speed Skating Federation of India has been <strong style="color:#15803D;">approved</strong>. Welcome to the SSFI family!`)}

          <!-- Approved badge -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr>
              <td align="center" style="background:linear-gradient(135deg,#15803D,#166534);border-radius:12px;padding:24px;">
                <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;">Application Status</p>
                <p style="margin:0 0 10px;font-size:28px;font-weight:800;color:#ffffff;">APPROVED ✓</p>
                <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.6);">SSFI UID: <strong style="color:#fff;font-family:'Courier New',monospace;">${safeUid}</strong></p>
              </td>
            </tr>
          </table>

          ${sectionCard('MEMBERSHIP DETAILS', `<table width="100%" cellpadding="0" cellspacing="0" border="0">${detailRows}</table>`)}

          ${safeLoginPassword ? credentialCard(safeUid, safeLoginPassword, typeLabel) : ''}

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
        const esc = EmailService.escapeHtml;
        const typeLabel = typeLabels[data.type] || data.type;
        const subject = `SSFI Application Update — ${typeLabel}`;

        const safeName = esc(data.name);
        const safeUid = esc(data.uid);
        const safeReason = data.reason ? esc(data.reason) : '';

        const body = `
          ${greeting(safeName, `We regret to inform you that your <strong>${typeLabel}</strong> application with the Speed Skating Federation of India could not be approved at this time.`)}

          <!-- UID reference -->
          ${uidBox('Application Reference', safeUid, '#DC2626')}

          ${safeReason ? sectionCard('REASON FOR REJECTION', `<p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">${safeReason}</p>`) : ''}

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
        const esc = EmailService.escapeHtml;
        const subject = `Event Registration Confirmed — ${esc(data.confirmationNumber)}`;

        const safeStudentName = esc(data.studentName);
        const safeConfirmationNumber = esc(data.confirmationNumber);
        const safeEventName = esc(data.eventName);
        const safeSsfiUid = esc(data.ssfiUid);
        const safeVenue = esc(data.venue);
        const safeCity = esc(data.city);
        const safeAgeCategory = esc(data.ageCategory);
        const safeSkateCategory = esc(data.skateCategory.replace(/_/g, ' '));
        const safeEventDate = esc(data.eventDate);
        const safeEventEndDate = data.eventEndDate ? esc(data.eventEndDate) : '';

        const racesFormatted = data.selectedRaces.length > 0
            ? data.selectedRaces.map(r =>
                `<tr><td style="padding:5px 0;color:#374151;font-size:13px;">⛸&nbsp;&nbsp;${esc(r.replace(/_/g, ' '))}</td></tr>`
              ).join('')
            : `<tr><td style="padding:5px 0;color:#9CA3AF;font-size:13px;font-style:italic;">No specific races selected</td></tr>`;

        const body = `
          ${greeting(safeStudentName, `Your registration for <strong>${safeEventName}</strong> has been received successfully. Please find your registration details below.`)}

          ${uidBox('Confirmation Number', safeConfirmationNumber)}

          ${sectionCard('EVENT DETAILS', `
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${row('Event Name', `<strong>${safeEventName}</strong>`)}
              ${row('Date', safeEventDate + (safeEventEndDate ? ` &ndash; ${safeEventEndDate}` : ''))}
              ${row('Venue', `${safeVenue}, ${safeCity}`)}
              ${row('Athlete UID', `<span style="font-family:'Courier New',monospace;">${safeSsfiUid}</span>`)}
              ${row('Age Category', safeAgeCategory)}
              ${row('Skate Category', safeSkateCategory)}
              ${row('Entry Fee', `<strong>₹${data.totalFee.toLocaleString('en-IN')}</strong>`)}
              ${row('Payment Status', payBadge(data.paymentStatus))}
            </table>
          `)}

          ${sectionCard('SELECTED RACES', `<table width="100%" cellpadding="0" cellspacing="0" border="0">${racesFormatted}</table>`)}

          ${data.paymentStatus !== 'PAID' && data.paymentStatus !== 'COMPLETED'
            ? alertBox('warning', `Your registration is confirmed but <strong>payment is pending</strong>. Please complete payment before the deadline to secure your spot. Unpaid registrations may be cancelled.`)
            : alertBox('success', `Payment received. Your spot is confirmed. Please carry your Confirmation Number <strong>${safeConfirmationNumber}</strong> on the event day.`)
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
        const esc = EmailService.escapeHtml;
        const safeStudentName = esc(data.studentName);
        const safeRegNumber = esc(data.registrationNumber);
        const safeProgramTitle = esc(data.programTitle);
        const safeVenue = esc(data.venue);
        const safeCity = esc(data.city);
        const safeState = esc(data.state);
        const safeStartDate = esc(data.startDate);
        const safeEndDate = esc(data.endDate);

        const subject = `Beginner Certification Registered — ${safeRegNumber}`;

        const categoryLabel: Record<string, string> = {
            SPEED_SKATING:  'Speed Skating',
            ARTISTIC:       'Artistic Skating',
            INLINE_HOCKEY:  'Inline Hockey',
            GENERAL:        'General Skating',
        };
        const catDisplay = categoryLabel[data.programCategory] || esc(data.programCategory);

        const categoryIcon: Record<string, string> = {
            SPEED_SKATING: '⚡',
            ARTISTIC:      '🎨',
            INLINE_HOCKEY: '🏒',
            GENERAL:       '⛸️',
        };
        const catIcon = categoryIcon[data.programCategory] || '⛸️';

        const body = `
          ${greeting(safeStudentName, `Congratulations! Your registration for the <strong>${safeProgramTitle}</strong> beginner certification program has been received. Here are your details.`)}

          ${uidBox('Registration Number', safeRegNumber, '#7C3AED')}

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
              ${row('Program', `<strong>${safeProgramTitle}</strong>`)}
              ${row('Category', catDisplay)}
              ${row('Start Date', safeStartDate)}
              ${row('End Date', safeEndDate)}
              ${row('Venue', safeVenue)}
              ${row('Location', `${safeCity}, ${safeState}`)}
              ${row('Program Fee', `<strong>₹${Number(data.amount).toLocaleString('en-IN')}</strong>`)}
              ${row('Payment Status', payBadge(data.paymentStatus))}
            </table>
          `)}

          ${data.paymentStatus !== 'PAID'
            ? alertBox('warning', `Payment for this program is <strong>pending</strong>. Please complete your payment to confirm your enrollment. Your registration number is <strong>${safeRegNumber}</strong>.`)
            : alertBox('success', `You are successfully enrolled in the program. Please report to the venue on <strong>${safeStartDate}</strong> with your registration number and a valid photo ID.`)
          }

          ${alertBox('info', `Please carry your registration number <strong>${safeRegNumber}</strong> and a government-issued photo ID on the day of the program. Contact us at <a href="mailto:${process.env.SMTP_USER || 'info@ssfiskate.com'}" style="color:#1E40AF;">${process.env.SMTP_USER || 'info@ssfiskate.com'}</a> for any queries.`)}
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

    // ─────────────────────────────────────────────────────────────────────────
    // 8. CONTACT FORM NOTIFICATION (sent to admin)
    // ─────────────────────────────────────────────────────────────────────────
    async sendContactFormNotification(data: {
        name: string;
        email: string;
        phone?: string;
        subject?: string;
        message: string;
    }): Promise<void> {
        const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_USER || '';
        if (!receiverEmail) {
            logger.warn('No CONTACT_RECEIVER_EMAIL configured — skipping contact notification');
            return;
        }

        const esc = EmailService.escapeHtml;
        const subjectLine = data.subject
            ? `Contact Form: ${data.subject}`
            : `New Contact Form Message from ${data.name}`;

        const detailRows = [
            row('Name', esc(data.name), true),
            row('Email', `<a href="mailto:${esc(data.email)}" style="color:${BRAND_BLUE};font-weight:600;">${esc(data.email)}</a>`),
            data.phone ? row('Phone', esc(data.phone)) : '',
            data.subject ? row('Subject', esc(data.subject)) : '',
        ].filter(Boolean).join('');

        const body = `
          ${greeting('Admin', `A new message has been submitted through the SSFI website contact form. Details are below.`)}

          ${sectionCard('SENDER DETAILS', `<table width="100%" cellpadding="0" cellspacing="0" border="0">${detailRows}</table>`)}

          ${sectionCard('MESSAGE', `
            <div style="background:#F9FAFB;border-left:4px solid #10B981;border-radius:6px;padding:16px;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${esc(data.message)}</div>
          `)}

          ${alertBox('info', `You can reply directly to this email — it will be sent to <strong>${esc(data.email)}</strong>.`)}
        `;

        const html = layout({
            title: 'New Contact Form Message',
            bannerColor: 'linear-gradient(135deg,#10B981,#0D9488)',
            bannerIcon: '📬',
            bannerText: 'New Contact Form Submission',
            body,
        });

        // Plain-text fallback for email clients that don't support HTML
        const text = [
            '=== New Contact Form Message — SSFI Website ===',
            '',
            `From:    ${data.name}`,
            `Email:   ${data.email}`,
            data.phone ? `Phone:   ${data.phone}` : null,
            data.subject ? `Subject: ${data.subject}` : null,
            '',
            '--- Message ---',
            data.message,
            '',
            '--- Sent from ssfiskate.com contact form ---',
        ].filter(line => line !== null).join('\n');

        await this.send(receiverEmail, subjectLine, html, 'contact-form', {
            replyTo: `"${data.name}" <${data.email}>`,
            text,
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9. RENEWAL REMINDER
    // ─────────────────────────────────────────────────────────────────────────
    async sendRenewalReminder(to: string, data: {
        name: string;
        uid: string;
        role: string;
        daysUntilExpiry: number;
        expiryDate: Date;
    }): Promise<void> {
        const roleLabel: Record<string, string> = {
            STATE_SECRETARY: 'State Secretary',
            DISTRICT_SECRETARY: 'District Secretary',
            CLUB_OWNER: 'Club Owner',
            STUDENT: 'Student',
        };
        const esc = EmailService.escapeHtml;
        const typeLabel = roleLabel[data.role] || esc(data.role);
        const safeName = esc(data.name);
        const safeUid = esc(data.uid);
        const expiryStr = data.expiryDate.toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
        const isExpired = data.daysUntilExpiry <= 0;
        const isUrgent = data.daysUntilExpiry <= 7;

        const subject = isExpired
            ? `SSFI Membership Expired — Renew Now`
            : `SSFI Membership ${isUrgent ? 'Expiring Soon' : 'Renewal Reminder'} — ${data.daysUntilExpiry} days left`;

        const urgencyMessage = isExpired
            ? `Your SSFI <strong>${typeLabel}</strong> membership expired on <strong>${expiryStr}</strong>. Your account access has been restricted. Please renew immediately to restore full access.`
            : isUrgent
                ? `Your SSFI <strong>${typeLabel}</strong> membership expires in <strong>${data.daysUntilExpiry} days</strong> on <strong>${expiryStr}</strong>. Renew now to avoid any disruption to your account.`
                : `Your SSFI <strong>${typeLabel}</strong> membership will expire on <strong>${expiryStr}</strong> (${data.daysUntilExpiry} days from now). Please plan to renew before the expiry date.`;

        const body = `
          ${greeting(safeName, urgencyMessage)}

          ${uidBox('Your SSFI UID', safeUid, isExpired ? '#DC2626' : isUrgent ? '#D97706' : BRAND_BLUE)}

          ${sectionCard('MEMBERSHIP DETAILS', `
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${row('Role', typeLabel)}
              ${row('Expiry Date', `<strong style="color:${isExpired ? '#DC2626' : isUrgent ? '#D97706' : '#111827'};">${expiryStr}</strong>`)}
              ${row('Status', isExpired
                ? `<span style="color:#DC2626;font-weight:700;">Expired</span>`
                : isUrgent
                    ? `<span style="color:#D97706;font-weight:700;">Expiring Soon</span>`
                    : `<span style="color:#15803D;font-weight:700;">Active</span>`
              )}
            </table>
          `)}

          ${isExpired
            ? alertBox('danger', `Your account has been restricted due to expired membership. You will not be able to access dashboard features, register for events, or manage your organization until you renew.`)
            : isUrgent
                ? alertBox('warning', `Your membership expires in <strong>${data.daysUntilExpiry} days</strong>. After expiry, your account access will be restricted and you will not be able to participate in events.`)
                : alertBox('info', `This is a friendly reminder to renew your membership before <strong>${expiryStr}</strong>. Early renewal ensures uninterrupted access to all SSFI services.`)
          }

          ${sectionCard('HOW TO RENEW', `
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">1.&nbsp;&nbsp;Log in to the SSFI portal at <a href="https://ssfiskate.com" style="color:${BRAND_BLUE};font-weight:600;">ssfiskate.com</a></td></tr>
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">2.&nbsp;&nbsp;Navigate to your Dashboard</td></tr>
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">3.&nbsp;&nbsp;Click on the renewal banner or go to Settings</td></tr>
              <tr><td style="padding:7px 0;color:#374151;font-size:13px;">4.&nbsp;&nbsp;Complete the payment to renew your membership</td></tr>
            </table>
          `)}

          <p style="margin:0;font-size:13px;color:#9CA3AF;text-align:center;line-height:1.6;">
            For questions or assistance, contact us at <a href="mailto:${process.env.SMTP_USER || 'info@ssfiskate.com'}" style="color:${BRAND_BLUE};">${process.env.SMTP_USER || 'info@ssfiskate.com'}</a>
          </p>
        `;

        const bannerColor = isExpired
            ? 'linear-gradient(135deg,#B91C1C,#991B1B)'
            : isUrgent
                ? 'linear-gradient(135deg,#D97706,#B45309)'
                : 'linear-gradient(135deg,#0891B2,#0E7490)';

        const html = layout({
            title: subject,
            bannerColor,
            bannerIcon: isExpired ? '🚨' : isUrgent ? '⏰' : '🔔',
            bannerText: isExpired ? 'Membership Expired' : isUrgent ? 'Membership Expiring Soon' : 'Membership Renewal Reminder',
            body,
        });

        await this.send(to, subject, html, `renewal-reminder:${data.daysUntilExpiry}d`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BULK EMAIL — Registration Window Open
    // ─────────────────────────────────────────────────────────────────────────
    async sendRegistrationOpenNotification(to: string, data: {
        name: string;
        windowTitle: string;
        windowType: string;
        startDate: string;
        endDate: string;
        baseFee: number;
    }): Promise<void> {
        const esc = EmailService.escapeHtml;
        const safeName = esc(data.name);
        const safeTitle = esc(data.windowTitle);
        const typeLabel = data.windowType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        const subject = `SSFI ${typeLabel} Registration is Now Open!`;

        const body = `
          ${greeting(safeName, `We are excited to inform you that <strong>${safeTitle}</strong> registration is now open at the Speed Skating Federation of India.`)}

          ${sectionCard('REGISTRATION DETAILS', `
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${row('Registration Type', `<strong>${typeLabel}</strong>`)}
              ${row('Opens', `<strong>${esc(data.startDate)}</strong>`)}
              ${row('Closes', `<strong style="color:#B91C1C;">${esc(data.endDate)}</strong>`)}
              ${row('Fee', `<strong>₹${data.baseFee.toLocaleString('en-IN')}</strong>`)}
            </table>
          `)}

          ${alertBox('info', `Please complete your registration before the deadline. Late registrations may attract additional fees or may not be accepted.`)}

          ${alertBox('success', `Visit <a href="${process.env.FRONTEND_URL || 'https://ssfiskate.com'}" style="color:#15803D;font-weight:700;">ssfiskate.com</a> to register or renew your membership now.`)}
        `;

        const html = layout({
            title: subject,
            bannerColor: 'linear-gradient(135deg,#1A4BAF,#6366F1)',
            bannerIcon: '📢',
            bannerText: `${typeLabel} Registration is Open!`,
            body,
        });

        await this.send(to, subject, html, `reg-window-open:${data.windowType}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BULK EMAIL — New Event Created
    // ─────────────────────────────────────────────────────────────────────────
    async sendNewEventNotification(to: string, data: {
        name: string;
        eventName: string;
        eventDate: string;
        venue: string;
        city: string;
        eventLevel: string;
        registrationEndDate: string;
    }): Promise<void> {
        const esc = EmailService.escapeHtml;
        const safeName = esc(data.name);
        const safeEventName = esc(data.eventName);
        const subject = `New Event: ${data.eventName} — Register Now!`;

        const body = `
          ${greeting(safeName, `A new <strong>${esc(data.eventLevel)}</strong> level event has been announced by SSFI. Check out the details below and register early!`)}

          ${sectionCard('EVENT DETAILS', `
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${row('Event', `<strong>${safeEventName}</strong>`)}
              ${row('Date', `<strong>${esc(data.eventDate)}</strong>`)}
              ${row('Venue', `${esc(data.venue)}, ${esc(data.city)}`)}
              ${row('Level', esc(data.eventLevel))}
              ${row('Register Before', `<strong style="color:#B91C1C;">${esc(data.registrationEndDate)}</strong>`)}
            </table>
          `)}

          ${alertBox('info', `Visit <a href="${process.env.FRONTEND_URL || 'https://ssfiskate.com'}/events" style="color:#1E40AF;font-weight:700;">ssfiskate.com/events</a> to view event details and register.`)}
        `;

        const html = layout({
            title: subject,
            bannerColor: 'linear-gradient(135deg,#0D9488,#0891B2)',
            bannerIcon: '🏆',
            bannerText: 'New Event Announced!',
            body,
        });

        await this.send(to, subject, html, `new-event:${data.eventLevel}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BULK SEND UTILITY — batched sending to avoid SMTP rate limits
    // ─────────────────────────────────────────────────────────────────────────
    sendBulkInBackground(
        recipients: { email: string; name: string }[],
        sendFn: (email: string, name: string) => Promise<void>,
        tag: string,
    ): void {
        const BATCH_SIZE = 50;
        const BATCH_DELAY_MS = 1000;

        const processBatches = async () => {
            let sent = 0;
            let failed = 0;

            for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
                const batch = recipients.slice(i, i + BATCH_SIZE);

                await Promise.allSettled(
                    batch.map(async (r) => {
                        try {
                            await sendFn(r.email, r.name);
                            sent++;
                        } catch {
                            failed++;
                        }
                    }),
                );

                // Delay between batches to avoid rate limiting
                if (i + BATCH_SIZE < recipients.length) {
                    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
                }
            }

            logger.info(`[bulk-email:${tag}] Completed: ${sent} sent, ${failed} failed out of ${recipients.length}`);
        };

        processBatches().catch((err) => {
            logger.error(`[bulk-email:${tag}] Fatal error:`, err);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITY
    // ─────────────────────────────────────────────────────────────────────────
    private static escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

export const emailService = new EmailService();
