-- ==============================================================================
-- APEX Detail Studio - Seed Data
-- ==============================================================================

-- 1. Business Settings
INSERT INTO public.business_settings (
    id, business_name, address, phone, email, timezone, slot_interval_minutes
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'APEX Detail Studio',
    '11723 N FM 620, Austin, TX 78726',
    '(512) 890-2839',
    'concierge@apexdetailaustin.com',
    'America/Chicago',
    30
) ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email;

-- 2. Business Schedules (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
INSERT INTO public.business_schedules (day_of_week, is_open, open_time, close_time) VALUES
    (0, false, '08:00:00', '18:00:00'), -- Sunday Closed
    (1, true,  '08:00:00', '18:00:00'), -- Monday
    (2, true,  '08:00:00', '18:00:00'), -- Tuesday
    (3, true,  '08:00:00', '18:00:00'), -- Wednesday
    (4, true,  '08:00:00', '18:00:00'), -- Thursday
    (5, true,  '08:00:00', '18:00:00'), -- Friday
    (6, true,  '08:30:00', '17:00:00')  -- Saturday
ON CONFLICT (day_of_week) DO UPDATE SET
    is_open = EXCLUDED.is_open,
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time;

-- 3. Vehicle Categories & Multipliers
INSERT INTO public.vehicle_categories (id, label, multiplier, is_active, sort_order) VALUES
    ('11111111-1111-1111-1111-111111111101', 'Sedan / Coupe', 1.00, true, 1),
    ('11111111-1111-1111-1111-111111111102', 'Mid-SUV / Crossover', 1.20, true, 2),
    ('11111111-1111-1111-1111-111111111103', 'Truck / 3-Row SUV', 1.40, true, 3)
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    multiplier = EXCLUDED.multiplier,
    sort_order = EXCLUDED.sort_order;

-- 4. Core Services
INSERT INTO public.services (
    id, name, slug, description, features, base_price, duration_minutes, is_featured, is_active, sort_order
) VALUES
    (
        '22222222-2222-2222-2222-222222222201',
        'Exterior Signature Hand Wash',
        'signature-hand-wash',
        '2-bucket hand wash, wheel barrel decontamination, synthetic paint sealant, and crystal-clear glass.',
        '["Foam cannon pre-soak", "Wheel barrel iron removal", "60-day hydrophobic sealant", "Streak-free crystal glass", "Tire dressing and rim shine"]'::jsonb,
        99.00,
        60,
        false,
        true,
        1
    ),
    (
        '22222222-2222-2222-2222-222222222202',
        'Interior Deep Steam Restoration',
        'interior-deep-steam',
        'Full cabin steam extraction, leather conditioning, deep carpet shampoo, and antimicrobial sanitation.',
        '["Full cabin steam & sanitation", "Deep carpet hot water extraction", "Leather clean and UV conditioner", "AC vent ozone odor treatment", "All plastics and trim dressed"]'::jsonb,
        159.00,
        90,
        false,
        true,
        2
    ),
    (
        '22222222-2222-2222-2222-222222222203',
        'Full Complete Reset (In & Out)',
        'full-complete-reset',
        'Steam extraction, leather conditioning, clay bar decontam, and multi-layer high-gloss machine glaze.',
        '["Full cabin steam & sanitation", "Clay bar paint treatment", "Deep carpet hot water extraction", "High-gloss machine glaze seal", "Tire & trim deep rejuvenation"]'::jsonb,
        249.00,
        150,
        true,
        true,
        3
    ),
    (
        '22222222-2222-2222-2222-222222222204',
        'Ceramic Coating & Paint Correction',
        'ceramic-coating-correction',
        'Multi-stage machine paint correction eliminating swirls, topped with certified 3 to 5-year 9H ceramic matrix.',
        '["2-Stage swirl elimination", "9H Ceramic layer application", "Carfax registration warranty", "Hydrophobic glass coating", "Wheel faces ceramic protected"]'::jsonb,
        799.00,
        240,
        false,
        true,
        4
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    base_price = EXCLUDED.base_price,
    duration_minutes = EXCLUDED.duration_minutes,
    is_featured = EXCLUDED.is_featured,
    sort_order = EXCLUDED.sort_order;

-- 5. Add-ons
INSERT INTO public.addons (id, name, price, duration_minutes, is_active, sort_order) VALUES
    ('33333333-3333-3333-3333-333333333301', 'Pet Hair & Odor Neutralizer', 50.00, 30, true, 1),
    ('33333333-3333-3333-3333-333333333302', 'Engine Bay Detail & Dressing', 75.00, 30, true, 2),
    ('33333333-3333-3333-3333-333333333303', 'UV Headlight Restoration', 90.00, 45, true, 3),
    ('33333333-3333-3333-3333-333333333304', 'Leather Ceramic Guard Treatment', 120.00, 45, true, 4)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    duration_minutes = EXCLUDED.duration_minutes,
    sort_order = EXCLUDED.sort_order;

-- 6. Sample Blackout Date (e.g. Labor Day holiday)
INSERT INTO public.blackout_dates (id, title, start_datetime, end_datetime, is_full_day) VALUES
    ('44444444-4444-4444-4444-444444444401', 'Austin Studio Maintenance Day', '2026-10-15 00:00:00+00', '2026-10-15 23:59:59+00', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Sample Initial Bookings
INSERT INTO public.appointments (
    id,
    appointment_code,
    customer_name,
    customer_phone,
    customer_address,
    vehicle_details,
    service_id,
    vehicle_category_id,
    selected_addons,
    total_price,
    start_time,
    end_time,
    status
) VALUES
    (
        '55555555-5555-5555-5555-555555555501',
        'APX-9482',
        'Marcus Vance',
        '(512) 481-9920',
        '1100 Congress Ave, Austin, TX 78701',
        '2024 Porsche 911 GT3 (Chalk)',
        '22222222-2222-2222-2222-222222222204',
        '11111111-1111-1111-1111-111111111101',
        '[{"id": "33333333-3333-3333-3333-333333333302", "name": "Engine Bay Detail & Dressing", "price": 75, "duration_minutes": 30}]'::jsonb,
        874.00,
        '2026-09-17 09:00:00-05',
        '2026-09-17 13:30:00-05',
        'confirmed'
    ),
    (
        '55555555-5555-5555-5555-555555555502',
        'APX-3104',
        'Sarah Jenkins',
        '(512) 793-1144',
        '3400 Palm Way, Austin, TX 78758 (The Domain)',
        '2023 Tesla Model X Plaid (Midnight Silver)',
        '22222222-2222-2222-2222-222222222203',
        '11111111-1111-1111-1111-111111111103',
        '[{"id": "33333333-3333-3333-3333-333333333301", "name": "Pet Hair & Odor Neutralizer", "price": 50, "duration_minutes": 30}]'::jsonb,
        398.60,
        '2026-09-18 10:00:00-05',
        '2026-09-18 13:00:00-05',
        'confirmed'
    )
ON CONFLICT (id) DO NOTHING;
