-- ==============================================================================
-- Ozer Auto Detailing - Seed Data
-- ==============================================================================

-- 1. Business Settings
INSERT INTO public.business_settings (
    id, business_name, address, phone, email, timezone, slot_interval_minutes, tagline
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Ozer Auto Detailing',
    '11723 N FM 620, Austin, TX 78726',
    '(512) 890-2839',
    'concierge@ozerdetailaustin.com',
    'America/Chicago',
    30,
    'Premium Auto Detailing & Mobile Wash'
) ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    tagline = EXCLUDED.tagline;

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

-- 3. Vehicle Sizes (no multipliers — prices live on each package matrix)
INSERT INTO public.vehicle_categories (id, label, size_key, is_active, sort_order) VALUES
    ('11111111-1111-1111-1111-111111111101', 'Sedan / Coupe', 'sedan', true, 1),
    ('11111111-1111-1111-1111-111111111102', 'SUV / Crossover', 'suv', true, 2),
    ('11111111-1111-1111-1111-111111111103', 'Truck / Large SUV / Van', 'truck', true, 3)
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    size_key = EXCLUDED.size_key,
    sort_order = EXCLUDED.sort_order;

-- 4. Core Packages with independent price + duration per vehicle size
INSERT INTO public.services (
    id, name, slug, description, features, base_price, duration_minutes, pricing_matrix, discount_percentage, discount_active, is_featured, is_active, sort_order
) VALUES
    (
        '22222222-2222-2222-2222-222222222201',
        'Interior Detail',
        'interior-detail',
        'Full cabin steam extraction, leather conditioning, deep carpet shampoo, and antimicrobial sanitation.',
        '["Full cabin steam & sanitation", "Deep carpet hot water extraction", "Leather clean and UV conditioner", "AC vent ozone odor treatment", "All plastics and trim dressed"]'::jsonb,
        159.00,
        90,
        '{"sedan":{"price":159,"durationMinutes":90},"suv":{"price":189,"durationMinutes":110},"truck":{"price":219,"durationMinutes":130}}'::jsonb,
        0,
        false,
        false,
        true,
        1
    ),
    (
        '22222222-2222-2222-2222-222222222202',
        'Exterior Detail',
        'exterior-detail',
        '2-bucket hand wash, wheel barrel decontamination, synthetic paint sealant, and crystal-clear glass.',
        '["Foam cannon pre-soak", "Wheel barrel iron removal", "60-day hydrophobic sealant", "Streak-free crystal glass", "Tire dressing and rim shine"]'::jsonb,
        99.00,
        60,
        '{"sedan":{"price":99,"durationMinutes":60},"suv":{"price":129,"durationMinutes":75},"truck":{"price":149,"durationMinutes":90}}'::jsonb,
        0,
        false,
        false,
        true,
        2
    ),
    (
        '22222222-2222-2222-2222-222222222203',
        'Basic Detail',
        'basic-detail',
        'Interior wipe-down plus exterior wash and protection — a complete refresh without the full restoration.',
        '["Exterior hand wash & dry", "Interior vacuum and wipe-down", "Windows in and out", "Tire dressing", "Light stain treatment"]'::jsonb,
        199.00,
        120,
        '{"sedan":{"price":199,"durationMinutes":120},"suv":{"price":239,"durationMinutes":150},"truck":{"price":279,"durationMinutes":180}}'::jsonb,
        0,
        false,
        false,
        true,
        3
    ),
    (
        '22222222-2222-2222-2222-222222222204',
        'Full Detail',
        'full-detail',
        'Steam extraction, leather conditioning, clay bar decontam, and multi-layer high-gloss machine glaze.',
        '["Full cabin steam & sanitation", "Clay bar paint treatment", "Deep carpet hot water extraction", "High-gloss machine glaze seal", "Tire & trim deep rejuvenation"]'::jsonb,
        249.00,
        150,
        '{"sedan":{"price":249,"durationMinutes":150},"suv":{"price":299,"durationMinutes":180},"truck":{"price":349,"durationMinutes":210}}'::jsonb,
        0,
        false,
        true,
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
    pricing_matrix = EXCLUDED.pricing_matrix,
    discount_percentage = EXCLUDED.discount_percentage,
    discount_active = EXCLUDED.discount_active,
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

-- 6. Location Zones (Austin Area Service Zones with Transit Times & Travel Fees)
INSERT INTO public.location_zones (id, zone_name, zip_codes, travel_fee, travel_time_minutes, is_active, sort_order) VALUES
    (
        '66666666-6666-6666-6666-666666666601',
        'Central Austin / Downtown',
        ARRAY['78701', '78702', '78703', '78704', '78705', '78712', '78722', '78751', '78752', '78756', '78757'],
        0.00,
        15,
        true,
        1
    ),
    (
        '66666666-6666-6666-6666-666666666602',
        'Round Rock / Cedar Park / Domain',
        ARRAY['78726', '78727', '78728', '78729', '78750', '78758', '78759', '78613', '78664', '78681', '78717'],
        0.00,
        20,
        true,
        2
    ),
    (
        '66666666-6666-6666-6666-666666666603',
        'West Lake / Lakeway',
        ARRAY['78746', '78733', '78734', '78738', '78735', '78732'],
        15.00,
        35,
        true,
        3
    ),
    (
        '66666666-6666-6666-6666-666666666604',
        'Georgetown / Buda / San Marcos',
        ARRAY['78626', '78628', '78633', '78610', '78640', '78666', '78619'],
        30.00,
        60,
        true,
        4
    )
ON CONFLICT (id) DO UPDATE SET
    zone_name = EXCLUDED.zone_name,
    zip_codes = EXCLUDED.zip_codes,
    travel_fee = EXCLUDED.travel_fee,
    travel_time_minutes = EXCLUDED.travel_time_minutes,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;

-- 7. Gallery Items (Austin Detailing Portfolio)
INSERT INTO public.gallery_items (id, title, category, image_url, before_image_url, sort_order, is_active) VALUES
    (
        '77777777-7777-7777-7777-777777777701',
        'Porsche 911 GT3 RS 9H Ceramic Matrix Coating',
        'Ceramic Coating',
        'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1200&q=80',
        1,
        true
    ),
    (
        '77777777-7777-7777-7777-777777777702',
        'BMW M4 Competition Multi-Stage Swirl Correction',
        'Paint Correction',
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=1200&q=80',
        2,
        true
    ),
    (
        '77777777-7777-7777-7777-777777777703',
        'Mercedes-AMG G63 Full Interior Steam Restoration',
        'Interior Reset',
        'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
        NULL,
        3,
        true
    ),
    (
        '77777777-7777-7777-7777-777777777704',
        'Tesla Model S Plaid Hydrophobic Glass & Paint Sealant',
        'Ceramic Coating',
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
        NULL,
        4,
        true
    ),
    (
        '77777777-7777-7777-7777-777777777705',
        'Corvette Z06 Wet-Look Machine Mirror Glaze',
        'Paint Correction',
        'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
        NULL,
        5,
        true
    ),
    (
        '77777777-7777-7777-7777-777777777706',
        'Audi RS6 Avant Signature Two-Bucket Hand Wash',
        'Signature Wash',
        'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80',
        NULL,
        6,
        true
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    image_url = EXCLUDED.image_url,
    before_image_url = EXCLUDED.before_image_url,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

-- 8. Sample Blackout Date
INSERT INTO public.blackout_dates (id, title, start_datetime, end_datetime, is_full_day) VALUES
    ('44444444-4444-4444-4444-444444444401', 'Mobile Fleet Maintenance Day', '2026-10-15 00:00:00+00', '2026-10-15 23:59:59+00', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Sample Initial Bookings (with zone & travel fee)
INSERT INTO public.appointments (
    id,
    appointment_code,
    customer_name,
    customer_phone,
    customer_address,
    vehicle_details,
    service_id,
    vehicle_category_id,
    location_zone_id,
    selected_addons,
    travel_fee,
    travel_time_minutes,
    total_price,
    start_time,
    end_time,
    status
) VALUES
    (
        '55555555-5555-5555-5555-555555555501',
        'OZER-9482',
        'Marcus Vance',
        '(512) 481-9920',
        '1100 Congress Ave, Austin, TX 78701',
        '2024 Porsche 911 GT3 (Chalk)',
        '22222222-2222-2222-2222-222222222204',
        '11111111-1111-1111-1111-111111111101',
        '66666666-6666-6666-6666-666666666601',
        '[{"id": "33333333-3333-3333-3333-333333333302", "name": "Engine Bay Detail & Dressing", "price": 75, "duration_minutes": 30}]'::jsonb,
        0.00,
        15,
        874.00,
        '2026-09-17 09:00:00-05',
        '2026-09-17 13:45:00-05',
        'confirmed'
    ),
    (
        '55555555-5555-5555-5555-555555555502',
        'OZER-3104',
        'Sarah Jenkins',
        '(512) 793-1144',
        '3400 Palm Way, Austin, TX 78758 (The Domain)',
        '2023 Tesla Model X Plaid (Midnight Silver)',
        '22222222-2222-2222-2222-222222222203',
        '11111111-1111-1111-1111-111111111103',
        '66666666-6666-6666-6666-666666666602',
        '[{"id": "33333333-3333-3333-3333-333333333301", "name": "Pet Hair & Odor Neutralizer", "price": 50, "duration_minutes": 30}]'::jsonb,
        0.00,
        20,
        328.80,
        '2026-09-18 10:00:00-05',
        '2026-09-18 13:20:00-05',
        'confirmed'
    )
ON CONFLICT (id) DO NOTHING;
