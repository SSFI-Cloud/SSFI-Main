-- SQL Script to seed all 36 Indian States
-- Run this in your database directly via Prisma Studio or pgAdmin

INSERT INTO states (name, code, "createdAt", "updatedAt") VALUES
('Andaman and Nicobar Islands', 'AN', NOW(), NOW()),
('Andhra Pradesh', 'AP', NOW(), NOW()),
('Arunachal Pradesh', 'AR', NOW(), NOW()),
('Assam', 'AS', NOW(), NOW()),
('Bihar', 'BR', NOW(), NOW()),
('Chandigarh', 'CH', NOW(), NOW()),
('Chhattisgarh', 'CT', NOW(), NOW()),
('Dadra and Nagar Haveli and Daman and Diu', 'DH', NOW(), NOW()),
('Delhi', 'DL', NOW(), NOW()),
('Goa', 'GA', NOW(), NOW()),
('Gujarat', 'GJ', NOW(), NOW()),
('Haryana', 'HR', NOW(), NOW()),
('Himachal Pradesh', 'HP', NOW(), NOW()),
('Jammu and Kashmir', 'JK', NOW(), NOW()),
('Jharkhand', 'JH', NOW(), NOW()),
('Karnataka', 'KA', NOW(), NOW()),
('Kerala', 'KL', NOW(), NOW()),
('Ladakh', 'LA', NOW(), NOW()),
('Lakshadweep', 'LD', NOW(), NOW()),
('Madhya Pradesh', 'MP', NOW(), NOW()),
('Maharashtra', 'MH', NOW(), NOW()),
('Manipur', 'MN', NOW(), NOW()),
('Meghalaya', 'ML', NOW(), NOW()),
('Mizoram', 'MZ', NOW(), NOW()),
('Nagaland', 'NL', NOW(), NOW()),
('Odisha', 'OR', NOW(), NOW()),
('Puducherry', 'PY', NOW(), NOW()),
('Punjab', 'PB', NOW(), NOW()),
('Rajasthan', 'RJ', NOW(), NOW()),
('Sikkim', 'SK', NOW(), NOW()),
('Tamil Nadu', 'TN', NOW(), NOW()),
('Telangana', 'TS', NOW(), NOW()),
('Tripura', 'TR', NOW(), NOW()),
('Uttar Pradesh', 'UP', NOW(), NOW()),
('Uttarakhand', 'UK', NOW(), NOW()),
('West Bengal', 'WB', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Verify count
SELECT COUNT(*) as total_states FROM states;
