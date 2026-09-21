INSERT INTO nutritionist (id, email, password_hash, name, role, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'dev@compas.app',
    '$2a$10$PlaceholderHashForDevOnlyNotForProduction',
    'Nutricionista Dev',
    'NUTRITIONIST',
    NOW(),
    NOW()
);