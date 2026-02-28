
import { PrismaClient } from '@prisma/client';
import * as eventService from './services/event.service';
import * as eventRegistrationService from './services/eventRegistration.service';
import { validateRaceSelection } from './validators/eventRegistration.validator';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING DEBUG ---');

    // 1. Test Event Listing (500 Error Diagnosis)
    console.log('\n--- 1. Testing getAllEvents ---');
    try {
        const result = await eventService.getAllEvents({ upcoming: 'true', page: 1, limit: 10 });
        console.log('getAllEvents Success!');
        console.log(`Found ${result.events.length} events`);
    } catch (error: any) {
        console.error('getAllEvents FAILED:');
        console.error(error);
    }

    // 2. Test Registration Validation (400 Error Diagnosis)
    console.log('\n--- 2. Testing Registration Validation ---');
    try {
        // Find a student and an event
        const student = await prisma.student.findFirst({
            include: { user: true }
        });
        const event = await prisma.event.findFirst({
            where: { status: 'PUBLISHED' } // or any available status
        });

        if (!student || !event) {
            console.log('No student or event found to test validation.');
            return;
        }

        console.log(`Testing with Student: ${student.name} (${student.membershipId})`);
        console.log(`Testing with Event: ${event.name} (ID: ${event.id})`);

        // Check lookup
        console.log('Running lookupStudentForEvent...');
        // lookupStudentForEvent expects membershipId as UID usually if it's the one passed from frontend
        // In frontend I saw user typing SSFI-..., which is stored in `uid` or `membershipId`?
        // Schema: User has uid, Student has membershipId.
        // Frontend sends `uid` state. `lookupStudent` -> `studentLookupSchema` -> `lookupStudentForEvent(uid, eventId)`.
        // service.ts: `lookupStudentForEvent` takes `membershipId` param name but searches `where: { membershipId }`.
        // Let's use `student.membershipId`.
        const membershipId = student.membershipId || '';
        if (!membershipId) {
            console.log('Student has no membershipId, skipping lookup test.');
        } else {
            const lookup = await eventRegistrationService.lookupStudentForEvent(membershipId, event.id);
            console.log('Lookup Success given Age Category:', lookup.eligibility.ageCategory);

            // Simulate Race Selection
            const testCategory = 'RECREATIONAL';
            const testRaces = ['RACE_200M', 'RACE_400M']; // 2 races

            console.log(`Validating Race Selection: Category=${testCategory}, Age=${lookup.eligibility.ageCategory}, Races=${testRaces}`);
            const check = validateRaceSelection(testCategory, lookup.eligibility.ageCategory, testRaces);
            console.log('Validation Result:', check);

            if (!check.valid) {
                console.log('Validation FAILED with error:', check.error);
            } else {
                console.log('Validation PASSED');
            }
        }

    } catch (error: any) {
        console.error('Registration Test FAILED:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
