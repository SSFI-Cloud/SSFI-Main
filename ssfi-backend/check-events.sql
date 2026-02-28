-- Check what events exist in the database
SELECT id, code, name, status, eventDate FROM events LIMIT 10;

-- If you want to create a test event with code 'demo-2':
INSERT INTO events (
    creatorId,
    code,
    name,
    description,
    category,
    eventType,
    eventLevel,
    status,
    eventDate,
    eventEndDate,
    registrationStartDate,
    registrationEndDate,
    venue,
    city,
    entryFee,
    createdAt,
    updatedAt
) VALUES (
    1,                              -- creatorId (use a valid user ID from your users table)
    'demo-2',                       -- code (slug)
    'Demo Championship 2',          -- name
    'Test event for registration',  -- description
    'NATIONAL',                     -- category
    'COMPETITION',                  -- eventType
    'NATIONAL',                     -- eventLevel
    'PUBLISHED',                    -- status (must be PUBLISHED for registration)
    '2026-03-15',                   -- eventDate
    '2026-03-17',                   -- eventEndDate
    '2026-02-01',                   -- registrationStartDate
    '2026-03-10',                   -- registrationEndDate
    'Test Arena',                   -- venue
    'Test City',                    -- city
    500.00,                         -- entryFee
    NOW(),                          -- createdAt
    NOW()                           -- updatedAt
);
