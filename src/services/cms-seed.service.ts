import prisma from '../config/prisma';

/**
 * CMS Page seed data — represents all existing public frontend pages.
 * Admins can edit titles, content, SEO meta, and status from the CMS panel.
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

const CMS_PAGES: PageSeed[] = [
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

## Grading System
- **A / A+ Grade** — Gold Medal
- **B / B+ Grade** — Silver Medal
- **C+ Grade** — Bronze Medal

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
        metaDescription: 'Get officially certified by SSFI. Browse active beginner certification programs across India.',
        metaKeywords: 'skating certification, beginner certification, SSFI certificate, skating test',
        content: `# Beginner Certification Programs

## Why Get Certified?
- **Official Recognition** — SSFI-recognized certificate valid nationwide
- **Skill Validation** — Prove your skating competency with structured assessment
- **Career Pathway** — First step towards competitive skating and coaching
- **Community Access** — Join the SSFI network of certified skaters

## Program Categories
- Speed Skating
- Artistic Skating
- Inline Hockey
- General Skating

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
        metaDescription: 'Become a certified skating coach with SSFI. Three certification levels available.',
        metaKeywords: 'coaching certification, skating coach, SSFI coach, become skating coach',
        content: `# Coach Certification Programs

## Why Get Certified?
- **Professional Credibility** — SSFI-recognized coaching certification
- **Career Growth** — Open doors to coaching opportunities nationwide
- **Listed in Coach Directory** — Get discovered by clubs and students
- **Continued Education** — Access workshops, seminars, and advanced training

## Certification Levels
### Level 1 — Certified Coach
Entry-level certification covering fundamental coaching techniques and safety protocols.

### Level 2 — Advanced Coach
Mid-level certification including advanced technique coaching and competition preparation.

### Level 3 — Master Coach
Elite certification for senior coaches covering international competition preparation.

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
        metaKeywords: 'skating coaches, certified coaches India, SSFI coaches directory',
        content: `# Affiliated Coaches Directory

Searchable directory of SSFI-certified skating coaches showing:
- Coach name, photo, certification level
- Location, experience, specialization
- Certified since date

Filters: Search by name, state, certification level.`,
    },
    {
        title: 'Events',
        slug: 'events',
        template: 'default',
        status: 'PUBLISHED',
        sortOrder: 8,
        metaTitle: 'Events & Competitions - SSFI',
        metaDescription: 'Browse upcoming speed skating events, competitions, and championships organized by SSFI.',
        metaKeywords: 'skating events, speed skating competition, SSFI events, skating championship',
        content: `# Events & Competitions

Browse and register for skating events at Club, District, State, and National levels.

## Event Levels
- National, State, District, Club

## Features
- Search and filter events
- Online registration and payment
- View results after completion`,
    },
    {
        title: 'Gallery',
        slug: 'gallery',
        template: 'default',
        status: 'PUBLISHED',
        sortOrder: 9,
        metaTitle: 'Photo Gallery - SSFI',
        metaDescription: 'View photos from SSFI events, competitions, and certification programs.',
        metaKeywords: 'skating photos, SSFI gallery, skating event photos',
        content: `# Photo Gallery

Browse photo albums from SSFI events, competitions, certification programs, and community activities. Albums are managed through the CMS Gallery section.`,
    },
    {
        title: 'News & Updates',
        slug: 'news',
        template: 'default',
        status: 'PUBLISHED',
        sortOrder: 10,
        metaTitle: 'News & Updates - SSFI',
        metaDescription: 'Latest news, updates, and announcements from the Speed Skating Federation of India.',
        metaKeywords: 'SSFI news, skating updates, skating news India',
        content: `# News & Updates

Stay updated with the latest news and announcements from SSFI. Articles are managed through the CMS News section.`,
    },
    {
        title: 'Results',
        slug: 'results',
        template: 'default',
        status: 'PUBLISHED',
        sortOrder: 11,
        metaTitle: 'Competition Results - SSFI',
        metaDescription: 'View results from SSFI speed skating competitions and championships.',
        metaKeywords: 'skating results, competition results, SSFI results',
        content: `# Competition Results

View results from SSFI-organized competitions and championships. Search and filter by event, discipline, and state.`,
    },
    {
        title: 'Privacy Policy',
        slug: 'privacy',
        template: 'legal',
        status: 'PUBLISHED',
        sortOrder: 12,
        metaTitle: 'Privacy Policy - SSFI',
        metaDescription: 'Read the privacy policy of the Speed Skating Federation of India.',
        metaKeywords: 'privacy policy, SSFI privacy, data protection',
        content: `# Privacy Policy

**Effective Date:** January 1, 2025

## Information We Collect
- Personal identification information (name, email, phone, address)
- Date of birth and age (for registration and eligibility)
- Identity documents (Aadhaar verification for KYC)
- Skating profile information
- Payment information (processed via Razorpay)
- Website usage data and cookies

## How We Use Your Information
- Process registrations and memberships
- Organize events and competitions
- Issue certificates and maintain records
- Communicate updates and announcements
- Improve our services

## Data Security
We implement appropriate security measures to protect your personal information.

## Your Rights
You have the right to access, correct, or delete your personal information. Contact us for privacy-related inquiries.`,
    },
    {
        title: 'Terms & Conditions',
        slug: 'terms',
        template: 'legal',
        status: 'PUBLISHED',
        sortOrder: 13,
        metaTitle: 'Terms & Conditions - SSFI',
        metaDescription: 'Read the terms and conditions for using SSFI services.',
        metaKeywords: 'terms and conditions, SSFI terms, usage policy',
        content: `# Terms & Conditions

**Effective Date:** January 1, 2025

## Registration & Membership
- All registrations must provide accurate information
- SSFI reserves the right to verify submitted information
- Membership is subject to approval

## Event Participation
- Registration subject to availability and eligibility
- Participants must adhere to all event rules and safety guidelines

## Payments & Refunds
- All payments processed securely through Razorpay
- Refund policy applies as per the Refund Policy page

## Code of Conduct
- All members must maintain sportsmanship
- Harassment, discrimination, or unsportsmanlike conduct is prohibited

## Intellectual Property
All content, logos, and materials on SSFI website are proprietary.`,
    },
    {
        title: 'Refund Policy',
        slug: 'refund',
        template: 'legal',
        status: 'PUBLISHED',
        sortOrder: 14,
        metaTitle: 'Refund Policy - SSFI',
        metaDescription: 'Read SSFI\'s refund policy for event registrations and certification programs.',
        metaKeywords: 'refund policy, SSFI refund, registration refund',
        content: `# Refund Policy

**Effective Date:** January 1, 2025

## Event Registration Refunds
- More than 15 days before event: Full refund minus processing fees
- 7–15 days before event: 50% refund
- Less than 7 days: No refund
- Event cancellation by SSFI: Full refund

## Certification Program Refunds
- Before program start: 80% refund
- After program start: No refund
- Program cancellation by SSFI: Full refund

## How to Request
Contact SSFI via the Contact Us page with your registration/payment details. Allow 7-10 business days for processing.`,
    },
];

/**
 * Seeds CMS pages — safe to run multiple times (idempotent).
 * Skips pages that already exist (by slug).
 */
export async function seedCmsPages(createdBy: string = 'system-seed') {
    let created = 0;
    let skipped = 0;
    const results: { title: string; slug: string; action: 'created' | 'skipped' }[] = [];

    for (const page of CMS_PAGES) {
        const existing = await prisma.page.findUnique({
            where: { slug: page.slug },
        });

        if (existing) {
            skipped++;
            results.push({ title: page.title, slug: page.slug, action: 'skipped' });
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
                createdBy,
            },
        });

        created++;
        results.push({ title: page.title, slug: page.slug, action: 'created' });
    }

    return { created, skipped, total: CMS_PAGES.length, results };
}
