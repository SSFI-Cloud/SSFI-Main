import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Seed CMS Pages table with entries for all existing public frontend pages.
 * Uses upsert (on slug) so it's safe to run multiple times.
 * Admins can then edit content, SEO fields, or unpublish pages from the CMS panel.
 */

interface PageSeed {
    title: string;
    slug: string;
    content: string;
    template: string;
    status: string;
    sortOrder: number;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
}

const pages: PageSeed[] = [
    {
        title: 'Home',
        slug: 'home',
        template: 'home',
        status: 'PUBLISHED',
        sortOrder: 1,
        metaTitle: 'SSFI - Speed Skating Federation of India',
        metaDescription: 'Official website of the Speed Skating Federation of India. Promoting speed skating, inline skating, and roller sports across India.',
        metaKeywords: 'SSFI, speed skating, India, inline skating, roller sports, federation',
        content: `# Speed Skating Federation of India

## Hero Section
Welcome to the Speed Skating Federation of India — the governing body for speed skating, inline skating, and roller sports in India.

**Tagline:** Glide Into Greatness

## Event Highlights
Three featured event/program cards showcasing:
- National Championships
- Beginner Certification Programs
- Coach Certification Programs

## Why Join SSFI
Value proposition section highlighting federation benefits:
- Professional Training & Coaching
- National & International Competitions
- Community & Networking
- Official Certification Programs

## Recent Results
Latest championship results and highlights displayed dynamically.

## Our Team / Leadership
Executive committee members and leadership showcase.

## Meet Rollie
SSFI mascot section — a friendly skating character that appears across the site.

## Donations
Support SSFI's mission to promote skating across India.

## Partners
Trusted partner organizations and affiliations.`,
    },
    {
        title: 'About Us',
        slug: 'about',
        template: 'default',
        status: 'PUBLISHED',
        sortOrder: 2,
        metaTitle: 'About SSFI - Speed Skating Federation of India',
        metaDescription: 'Learn about the Speed Skating Federation of India — our story, vision, mission, milestones, leadership, and impact across 36 states.',
        metaKeywords: 'about SSFI, speed skating federation, India skating history, skating leadership',
        content: `# About the Speed Skating Federation of India

## Our Story
The Speed Skating Federation of India (SSFI) was founded with a bold vision — to make speed skating accessible to every Indian. Under the leadership of Shri S. Muruganantham and Mr. Krishna Baisware, the federation has grown from a grassroots initiative into a recognized national body.

## Vision
To make India a global powerhouse in speed skating by nurturing talent from every corner of the country.

## Mission
- Develop world-class skating infrastructure across India
- Identify and nurture talent from grassroots to elite level
- Organize national and international competitions
- Provide professional coaching and certification programs
- Promote skating as a mainstream sport and fitness activity
- Build partnerships with global skating federations

## Milestones
- **2001 — Foundation:** SSFI was established to organize and promote speed skating in India.
- **2005–2010 — Expansion:** Extended operations across multiple states, conducting inter-state competitions.
- **2011–2018 — Structured Growth:** Introduced formal coaching programs, standardized competition formats.
- **2019–2024 — Grassroots & International:** Launched beginner certification, partnered with international skating bodies.
- **2025–26 — 25th National Championship:** Silver jubilee celebration of the National Speed Skating Championship.
- **Today — Building the Future:** Active in 36 states with 800+ clubs and 5600+ registered skaters.

## Impact Statistics
- Registered Skaters: 5600+
- Active Clubs: 800+
- States Covered: 36
- Districts: 640+
- Events Organized: 50+
- Championships: 25

## Affiliations
- Bharat Skate India
- Fit India Movement
- Ministry of Corporate Affairs
- NITI Aayog`,
    },
    {
        title: 'Contact Us',
        slug: 'contact',
        template: 'contact',
        status: 'PUBLISHED',
        sortOrder: 3,
        metaTitle: 'Contact SSFI - Speed Skating Federation of India',
        metaDescription: 'Get in touch with the Speed Skating Federation of India. Find our office address, phone numbers, email, and department contacts.',
        metaKeywords: 'contact SSFI, skating federation contact, SSFI address, SSFI phone',
        content: `# Contact Us

## Office Address
Speed Skating Federation of India
(Address managed via Site Settings)

## Phone
Contact numbers managed via Site Settings.

## Email
Contact email managed via Site Settings.

## Office Hours
- Monday – Friday: 10:00 AM – 6:00 PM
- Saturday: 10:00 AM – 2:00 PM
- Sunday: Closed

## Department Contacts
- **General Enquiries** — For general information about SSFI
- **Event Registration** — Questions about event registration and participation
- **Coaching & Certification** — Information about coaching programs and certifications
- **Media & Press** — Press inquiries, media partnerships, and coverage requests

## Contact Form
Name, Email, Phone, Subject, Message — submissions go to the admin email.`,
    },
    {
        title: 'Beginner Program',
        slug: 'beginner-program',
        template: 'default',
        status: 'PUBLISHED',
        sortOrder: 4,
        metaTitle: 'Beginner Skating Program - SSFI',
        metaDescription: 'Join SSFI\'s Beginner Skating Program. Learn the fundamentals of speed skating with professional coaching, grading, and certification.',
        metaKeywords: 'beginner skating, learn skating, skating program India, SSFI beginner',
        content: `# Beginner Skating Program

## Overview
The SSFI Beginner Program is designed to introduce newcomers to the world of speed skating. From balance basics to performance assessment, our structured program ensures a solid foundation.

## Grading System
- **A / A+ Grade** — Gold Medal: Exceptional skill and technique
- **B / B+ Grade** — Silver Medal: Strong performance with good fundamentals
- **C+ Grade** — Bronze Medal: Satisfactory basics with room for improvement

## Core Skills (6 Modules)
1. **Balance & Posture** — Master the fundamental skating stance and weight distribution
2. **Start & Acceleration** — Learn explosive starts and acceleration techniques
3. **Glide Technique** — Develop smooth, efficient gliding mechanics
4. **Turning & Braking** — Practice safe turning and stopping techniques
5. **Safety Protocols** — Understand protective gear and safety rules
6. **Performance Assessment** — Timed trials and skill evaluations

## Who Can Join
- School students (age 5+)
- College students
- Working professionals
- Senior citizens
- Anyone with a passion for skating

## Program Objectives
1. Build a strong foundation in skating fundamentals
2. Develop confidence on wheels
3. Ensure safety-first approach to skating
4. Prepare students for competitive skating
5. Issue official SSFI certification upon completion`,
    },
    {
        title: 'Beginner Certification',
        slug: 'beginner-certification',
        template: 'default',
        status: 'PUBLISHED',
        sortOrder: 5,
        metaTitle: 'Beginner Certification Programs - SSFI',
        metaDescription: 'Get officially certified by SSFI. Browse active beginner certification programs across India — speed skating, artistic, inline hockey, and more.',
        metaKeywords: 'skating certification, beginner certification, SSFI certificate, skating test',
        content: `# Beginner Certification Programs

## Overview
SSFI offers official certification programs for beginner skaters across multiple disciplines. Get certified and join a community of recognized skaters.

## Why Get Certified?
- **Official Recognition** — SSFI-recognized certificate valid nationwide
- **Skill Validation** — Prove your skating competency with a structured assessment
- **Career Pathway** — First step towards competitive skating and coaching
- **Community Access** — Join the SSFI network of certified skaters

## Program Categories
- Speed Skating
- Artistic Skating
- Inline Hockey
- General Skating

## Active Programs
Programs are listed dynamically from the database. Each program shows:
- Title, description, age group
- Dates, venue, price
- Eligibility criteria
- Available seats with registration

## FAQ
Frequently asked questions about the certification process, eligibility, and benefits.`,
    },
    {
        title: 'Coach Certification',
        slug: 'coach-certification',
        template: 'default',
        status: 'PUBLISHED',
        sortOrder: 6,
        metaTitle: 'Coach Certification - SSFI',
        metaDescription: 'Become a certified skating coach with SSFI. Three certification levels — Certified Coach, Advanced Coach, and Master Coach.',
        metaKeywords: 'coaching certification, skating coach, SSFI coach, become skating coach',
        content: `# Coach Certification Programs

## Overview
SSFI's Coach Certification program trains and certifies skating coaches across India. Our three-tier certification ensures coaches at every level have the knowledge and skills to develop skaters safely and effectively.

## Why Get Certified?
- **Professional Credibility** — SSFI-recognized coaching certification
- **Career Growth** — Open doors to coaching opportunities nationwide
- **Listed in Coach Directory** — Get discovered by clubs and students
- **Continued Education** — Access workshops, seminars, and advanced training

## Certification Levels

### Level 1 — Certified Coach
Entry-level certification for new coaches. Covers fundamental coaching techniques, safety protocols, and beginner training methods.

### Level 2 — Advanced Coach
Mid-level certification for experienced coaches. Includes advanced technique coaching, competition preparation, and athlete development planning.

### Level 3 — Master Coach
Elite certification for senior coaches. Covers elite athlete training, international competition preparation, and coaching program design.

## Active Programs
Programs listed dynamically. Each shows title, dates, venue, price, eligibility, and available seats.

## FAQ
- Eligibility requirements for each level
- Curriculum overview
- Duration and assessment format
- Directory listing after certification
- Renewal and continuing education`,
    },
    {
        title: 'Affiliated Coaches',
        slug: 'affiliated-coaches',
        template: 'default',
        status: 'PUBLISHED',
        sortOrder: 7,
        metaTitle: 'Affiliated Coaches - SSFI',
        metaDescription: 'Find SSFI-certified skating coaches near you. Browse our directory of affiliated coaches across India.',
        metaKeywords: 'skating coaches, certified coaches India, SSFI coaches directory, find skating coach',
        content: `# Affiliated Coaches Directory

## Overview
Browse SSFI's directory of certified skating coaches. All listed coaches have completed SSFI's official certification program.

## Coach Directory
Searchable and filterable directory showing:
- Coach name and photo
- Certification level (Level 1, 2, or 3)
- Location (State/City)
- Experience and specialization
- Certified since date

## Filters
- Search by name
- Filter by state
- Filter by certification level

## Become a Coach
Interested in becoming a certified skating coach? Check out our Coach Certification programs.

## Upcoming Programs
List of upcoming coach certification batches for aspiring coaches.`,
    },
    {
        title: 'Events',
        slug: 'events',
        template: 'default',
        status: 'PUBLISHED',
        sortOrder: 8,
        metaTitle: 'Events & Competitions - SSFI',
        metaDescription: 'Browse upcoming speed skating events, competitions, and championships organized by SSFI across India.',
        metaKeywords: 'skating events, speed skating competition, SSFI events, skating championship India',
        content: `# Events & Competitions

## Overview
SSFI organizes skating events, competitions, and championships at Club, District, State, and National levels throughout the year.

## Event Levels
- **National** — National-level championships
- **State** — State-level competitions
- **District** — District-level events
- **Club** — Club-organized local events

## Event Types
- Speed Skating Championships
- Artistic Skating Competitions
- Inline Hockey Tournaments
- Multi-discipline Events

## Features
- Search events by name
- Filter by level, type, discipline, state
- View registration status and deadlines
- Online registration and payment
- View event results after completion`,
    },
    {
        title: 'Gallery',
        slug: 'gallery',
        template: 'default',
        status: 'PUBLISHED',
        sortOrder: 9,
        metaTitle: 'Photo Gallery - SSFI',
        metaDescription: 'View photos from SSFI events, competitions, certification programs, and more. Browse our gallery albums.',
        metaKeywords: 'skating photos, SSFI gallery, skating event photos, speed skating images',
        content: `# Photo Gallery

## Overview
Browse photo albums from SSFI events, competitions, certification programs, and community activities.

## Features
- Album-based photo organization
- Category filtering
- Event-linked albums
- 3D carousel showcase for featured albums
- Full-screen photo viewing

## Content
Albums are managed through the CMS Gallery section. Create albums, upload photos, and link them to events.`,
    },
    {
        title: 'News & Updates',
        slug: 'news',
        template: 'default',
        status: 'PUBLISHED',
        sortOrder: 10,
        metaTitle: 'News & Updates - SSFI',
        metaDescription: 'Latest news, updates, and announcements from the Speed Skating Federation of India.',
        metaKeywords: 'SSFI news, skating updates, skating news India, federation announcements',
        content: `# News & Updates

## Overview
Stay updated with the latest news and announcements from SSFI.

## Features
- Category-based news filtering
- Featured articles highlighted at top
- Search functionality
- Newsletter subscription
- View count tracking

## Content
News articles are managed through the CMS News section. Create articles with rich content, categories, tags, and featured images.`,
    },
    {
        title: 'Results',
        slug: 'results',
        template: 'default',
        status: 'PUBLISHED',
        sortOrder: 11,
        metaTitle: 'Competition Results - SSFI',
        metaDescription: 'View results from SSFI speed skating competitions and championships. Find event results, rankings, and certificates.',
        metaKeywords: 'skating results, competition results, SSFI results, championship results',
        content: `# Competition Results

## Overview
View results from SSFI-organized competitions and championships.

## Features
- Search results by event name
- Filter by event level, discipline, state
- View medal tallies and rankings
- Download certificates for medalists
- Detailed event-wise results`,
    },
    {
        title: 'Privacy Policy',
        slug: 'privacy',
        template: 'legal',
        status: 'PUBLISHED',
        sortOrder: 12,
        metaTitle: 'Privacy Policy - SSFI',
        metaDescription: 'Read the privacy policy of the Speed Skating Federation of India. Learn how we collect, use, and protect your personal information.',
        metaKeywords: 'privacy policy, SSFI privacy, data protection',
        content: `# Privacy Policy

**Effective Date:** January 1, 2025
**Last Updated:** January 1, 2025

## Introduction
The Speed Skating Federation of India (SSFI) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.

## Information We Collect
- Personal identification information (name, email, phone, address)
- Date of birth and age (for registration and eligibility)
- Identity documents (Aadhaar verification for KYC)
- Skating profile information (club, district, state, experience)
- Payment information (processed securely via Razorpay)
- Website usage data and cookies

## How We Use Your Information
- Process registrations and memberships
- Organize events and competitions
- Issue certificates and maintain records
- Communicate updates and announcements
- Improve our services and website
- Comply with legal obligations

## Data Security
We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## Third-Party Services
We use trusted third-party services including Razorpay (payments), SurePass (KYC verification), and cloud hosting. Each has their own privacy policies.

## Your Rights
You have the right to access, correct, or delete your personal information. Contact us at the email provided on our Contact page.

## Contact
For privacy-related inquiries, contact our office using the details on our Contact page.`,
    },
    {
        title: 'Terms & Conditions',
        slug: 'terms',
        template: 'legal',
        status: 'PUBLISHED',
        sortOrder: 13,
        metaTitle: 'Terms & Conditions - SSFI',
        metaDescription: 'Read the terms and conditions for using SSFI services, event registration, memberships, and website usage.',
        metaKeywords: 'terms and conditions, SSFI terms, usage policy',
        content: `# Terms & Conditions

**Effective Date:** January 1, 2025
**Last Updated:** January 1, 2025

## Acceptance of Terms
By accessing and using the SSFI website and services, you agree to be bound by these Terms and Conditions.

## Registration & Membership
- All registrations must provide accurate and complete information
- Members must maintain valid contact information
- SSFI reserves the right to verify all submitted information
- Membership is subject to approval by the appropriate authority

## Event Participation
- Event registration is subject to availability and eligibility
- Participants must adhere to all event rules and safety guidelines
- SSFI reserves the right to modify event schedules and venues
- Participants are responsible for their own safety equipment

## Payments & Refunds
- All payments are processed securely through Razorpay
- Registration fees are as displayed at the time of registration
- Refund policy applies as per our separate Refund Policy page
- SSFI is not responsible for payment gateway issues

## Code of Conduct
- All members and participants must maintain sportsmanship
- Harassment, discrimination, or unsportsmanlike conduct is prohibited
- SSFI reserves the right to suspend or revoke memberships
- Decisions by SSFI officials during events are final

## Intellectual Property
All content, logos, and materials on the SSFI website are proprietary. Unauthorized use is prohibited.

## Limitation of Liability
SSFI shall not be liable for any injuries during events, website downtime, or losses arising from use of our services, to the maximum extent permitted by law.

## Changes to Terms
SSFI reserves the right to modify these terms at any time. Continued use constitutes acceptance of updated terms.`,
    },
    {
        title: 'Refund Policy',
        slug: 'refund',
        template: 'legal',
        status: 'PUBLISHED',
        sortOrder: 14,
        metaTitle: 'Refund Policy - SSFI',
        metaDescription: 'Read SSFI\'s refund policy for event registrations, memberships, and certification programs.',
        metaKeywords: 'refund policy, SSFI refund, registration refund',
        content: `# Refund Policy

**Effective Date:** January 1, 2025
**Last Updated:** January 1, 2025

## General Policy
SSFI strives to ensure satisfaction with our services. This policy outlines the conditions under which refunds may be issued.

## Event Registration Refunds
- **More than 15 days before event:** Full refund minus processing fees
- **7–15 days before event:** 50% refund
- **Less than 7 days before event:** No refund
- **Event cancellation by SSFI:** Full refund

## Membership & Affiliation Fees
- Membership fees are generally non-refundable once processed
- Exceptions may be made for duplicate payments or system errors
- Annual membership fees are not prorated for partial-year usage

## Certification Program Refunds
- **Before program start:** 80% refund
- **After program start:** No refund
- **Program cancellation by SSFI:** Full refund

## How to Request a Refund
1. Contact SSFI via the Contact Us page
2. Provide your registration/payment details
3. State the reason for the refund request
4. Allow 7-10 business days for processing

## Refund Processing
- Refunds are processed to the original payment method
- Processing time: 7-10 business days
- Razorpay processing fees may be non-refundable

## Contact
For refund inquiries, reach out through our Contact page or email the General Enquiries department.`,
    },
];

async function main() {
    console.log('🌱 Seeding CMS Pages...\n');

    let created = 0;
    let skipped = 0;

    for (const page of pages) {
        try {
            const existing = await prisma.page.findUnique({
                where: { slug: page.slug },
            });

            if (existing) {
                console.log(`  ⏭  "${page.title}" (/${page.slug}) — already exists, skipping`);
                skipped++;
                continue;
            }

            await prisma.page.create({
                data: {
                    title: page.title,
                    slug: page.slug,
                    content: page.content,
                    template: page.template,
                    status: page.status,
                    sortOrder: page.sortOrder,
                    metaTitle: page.metaTitle,
                    metaDescription: page.metaDescription,
                    metaKeywords: page.metaKeywords,
                    publishedAt: new Date(),
                    createdBy: 'system-seed',
                },
            });

            console.log(`  ✅ Created "${page.title}" (/${page.slug})`);
            created++;
        } catch (err) {
            console.error(`  ❌ Failed to seed "${page.title}":`, (err as Error).message);
        }
    }

    console.log(`\n📊 Summary: ${created} created, ${skipped} skipped (already existed)`);
    console.log('✨ CMS Pages seeding complete!\n');
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
