-- Step 1: Check if there are any existing verified students you can use for testing
SELECT id, membershipId, name, dateOfBirth, verified 
FROM students 
WHERE verified = 1 
LIMIT 10;

-- Step 2: If you see a membershipId above, use that for testing
-- Otherwise, run this insert to create a minimal test student

-- First, get IDs from your database:
-- SELECT id FROM clubs LIMIT 1;      -- Note the club ID
-- SELECT id FROM districts LIMIT 1;  -- Note the district ID  
-- SELECT id FROM states LIMIT 1;     -- Note the state ID

-- Then update the INSERT below with those IDs and run it:

INSERT INTO students (
    membershipId,
    name,
    dateOfBirth,
    gender,
    bloodGroup,
    phone,
    email,
    fatherName,
    motherName,
    schoolName,
    academicBoard,
    className,
    nomineeName,
    nomineeAge,
    nomineeRelation,
    nomineePhone,
    addressLine1,
    city,
    pincode,
    aadhaarNumber,
    clubId,
    districtId,
    stateId,
    verified,
    status,
    createdAt,
    updatedAt
) VALUES (
    'SSFI-TN-CHE-TSC-ST-0001',           -- membershipId (UID)
    'Test Student',                       -- name
    '2010-01-01',                         -- dateOfBirth
    'MALE',                               -- gender
    'A+',                                 -- bloodGroup
    '9876543210',                         -- phone
    'test@example.com',                   -- email
    'Test Father',                        -- fatherName
    'Test Mother',                        -- motherName
    'Test School',                        -- schoolName
    'STATE',                              -- academicBoard
    '5th',                                -- className
    'Test Guardian',                      -- nomineeName
    35,                                   -- nomineeAge
    'FATHER',                             -- nomineeRelation
    '9876543210',                         -- nomineePhone
    '123 Test Street',                    -- addressLine1
    'Test City',                          -- city
    '600001',                             -- pincode
    '123456789012',                       -- aadhaarNumber (12 digits)
    1,                                    -- clubId - CHANGE THIS!
    1,                                    -- districtId - CHANGE THIS!
    1,                                    -- stateId - CHANGE THIS!
    1,                                    -- verified (1 = verified)
    'APPROVED',                           -- status
    NOW(),                                -- createdAt
    NOW()                                 -- updatedAt
);

-- Verify the insert worked:
SELECT * FROM students WHERE membershipId = 'SSFI-TN-CHE-TSC-ST-0001';
