/**
 * Test Email Script — Sends dummy registration confirmation emails
 *
 * Usage: npx ts-node -r tsconfig-paths/register src/scripts/test-emails.ts
 *
 * Sends 4 emails to the specified address:
 * 1. Student Registration Confirmation
 * 2. State Secretary Registration Confirmation
 * 3. District Secretary Registration Confirmation (Credentials)
 * 4. Club Registration Confirmation
 */

import dotenv from 'dotenv';
dotenv.config();

import { emailService } from '../services/email.service';

const TEST_EMAIL = 'lakshmanan1413@gmail.com';

async function sendTestEmails() {
    console.log('=== SSFI Test Email Script ===');
    console.log(`Sending 4 test emails to: ${TEST_EMAIL}`);
    console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
    console.log(`SMTP User: ${process.env.SMTP_USER}`);
    console.log('');

    // 1. Student Registration Confirmation
    console.log('1/4 Sending Student Registration Confirmation...');
    try {
        await emailService.sendAffiliationConfirmation(TEST_EMAIL, {
            type: 'STUDENT',
            name: 'Arjun Kumar',
            uid: 'SSFI-26-TN-CHN-0042',
            defaultPassword: '9876543210',
            stateName: 'Tamil Nadu',
            districtName: 'Chennai',
            clubName: 'Chennai Speed Skating Academy',
        });
        console.log('   ✅ Student email sent!');
    } catch (err) {
        console.error('   ❌ Student email failed:', err);
    }

    // Small delay between emails to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000));

    // 2. State Secretary Registration Confirmation
    console.log('2/4 Sending State Secretary Registration Confirmation...');
    try {
        await emailService.sendAffiliationConfirmation(TEST_EMAIL, {
            type: 'STATE_SECRETARY',
            name: 'Rajesh Sharma',
            uid: 'SSFI-26-TN-SS-001',
            defaultPassword: '9988776655',
            stateName: 'Tamil Nadu',
        });
        console.log('   ✅ State Secretary email sent!');
    } catch (err) {
        console.error('   ❌ State Secretary email failed:', err);
    }

    await new Promise(r => setTimeout(r, 2000));

    // 3. District Secretary Registration — uses sendCredentials (what actually happens after payment)
    console.log('3/4 Sending District Secretary Credentials Email...');
    try {
        await emailService.sendCredentials(TEST_EMAIL, 'Priya Venkatesh', {
            uid: 'SSFI-26-TN-CBE-DS-001',
            password: '9112233445',
            role: 'DISTRICT_SECRETARY',
        });
        console.log('   ✅ District Secretary email sent!');
    } catch (err) {
        console.error('   ❌ District Secretary email failed:', err);
    }

    await new Promise(r => setTimeout(r, 2000));

    // 4. Club Registration Confirmation
    console.log('4/4 Sending Club Registration Confirmation...');
    try {
        await emailService.sendAffiliationConfirmation(TEST_EMAIL, {
            type: 'CLUB',
            name: 'Vikram Patel',
            uid: 'SSFI-26-TN-CHN-CL-007',
            defaultPassword: '9556677889',
            stateName: 'Tamil Nadu',
            districtName: 'Chennai',
            clubName: 'Speedsters Skating Club',
        });
        console.log('   ✅ Club email sent!');
    } catch (err) {
        console.error('   ❌ Club email failed:', err);
    }

    console.log('');
    console.log('=== All 4 test emails sent! ===');
    console.log(`Check inbox: ${TEST_EMAIL}`);
    console.log('(Also check spam/promotions folder)');

    // Exit after a brief delay to let nodemailer finish
    setTimeout(() => process.exit(0), 3000);
}

sendTestEmails().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
