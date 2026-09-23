-- V31: Seed default Compas Ops Administrator account
INSERT INTO nutritionist (
    id, email, password_hash, name, professional_name, role,
    crn, crn_regional, email_verified, onboarding_completed,
    subscription_tier, patient_limit, created_at, updated_at
) VALUES (
    'b81f2541-a897-4305-a93f-9d28a59b24b8',
    'ops@compas.app',
    '$2a$10$Lr11IxihWJ2dklKYE3FuqOmDYJp/GqwjpTstgVP3bvYzOigU2vZFi',
    'Operador Compas',
    'Compas Ops',
    'ADMIN',
    '00000',
    'CRN-3',
    TRUE,
    TRUE,
    'UNLIMITED',
    9999,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    role = 'ADMIN',
    email_verified = TRUE,
    onboarding_completed = TRUE;
