-- ==============================================================================
-- Ozer Auto Detailing - Supabase Database Schema (PostgreSQL)
-- Location: Austin, Texas (America/Chicago Timezone)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    pricing_matrix JSONB NOT NULL DEFAULT '{}'::jsonb,
    discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    discount_active BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Vehicle Sizes Table (independent package × size pricing matrix)
CREATE TABLE IF NOT EXISTS public.vehicle_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    size_key TEXT NOT NULL DEFAULT 'sedan',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Add-ons Table
CREATE TABLE IF NOT EXISTS public.addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Business Settings Table
CREATE TABLE IF NOT EXISTS public.business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL DEFAULT 'Ozer Auto Detailing',
    address TEXT NOT NULL DEFAULT '11723 N FM 620, Austin, TX 78726',
    phone TEXT NOT NULL DEFAULT '(512) 890-2839',
    email TEXT NOT NULL DEFAULT 'concierge@ozerdetailaustin.com',
    timezone TEXT NOT NULL DEFAULT 'America/Chicago',
    slot_interval_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_interval_minutes IN (15, 30, 45, 60)),
    tagline TEXT NOT NULL DEFAULT 'Premium Auto Detailing & Mobile Wash',
    show_google_reviews BOOLEAN NOT NULL DEFAULT true,
    google_place_id TEXT NOT NULL DEFAULT '',
    hero_vehicles_count INTEGER NOT NULL DEFAULT 250,
    hero_rating_override NUMERIC(2, 1),
    hero_review_count_override INTEGER,
    hero_stat_3_value TEXT NOT NULL DEFAULT '100%',
    hero_stat_3_label TEXT NOT NULL DEFAULT 'Mobile Service',
    hero_stat_4_value TEXT NOT NULL DEFAULT 'Austin, TX',
    hero_stat_4_label TEXT NOT NULL DEFAULT 'Service Area',
    show_before_after BOOLEAN NOT NULL DEFAULT true,
    before_after_before_image_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1400&q=80',
    before_after_after_image_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1400&q=80',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Business Schedules Table (Day of Week 0-6: 0 = Sun, 1 = Mon ... 6 = Sat)
CREATE TABLE IF NOT EXISTS public.business_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL UNIQUE CHECK (day_of_week BETWEEN 0 AND 6),
    is_open BOOLEAN NOT NULL DEFAULT true,
    open_time TIME NOT NULL DEFAULT '08:00:00',
    close_time TIME NOT NULL DEFAULT '18:00:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Blackout Dates / Time Off Table
CREATE TABLE IF NOT EXISTS public.blackout_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    is_full_day BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Gallery Items Table
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT NOT NULL,
    before_image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Location / Service Area Zones Table
CREATE TABLE IF NOT EXISTS public.location_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name TEXT NOT NULL,
    zip_codes TEXT[] NOT NULL DEFAULT '{}'::text[],
    travel_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (travel_fee >= 0),
    travel_time_minutes INTEGER NOT NULL DEFAULT 30 CHECK (travel_time_minutes >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    vehicle_details TEXT NOT NULL,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    vehicle_category_id UUID NOT NULL REFERENCES public.vehicle_categories(id) ON DELETE RESTRICT,
    location_zone_id UUID REFERENCES public.location_zones(id) ON DELETE SET NULL,
    selected_addons JSONB NOT NULL DEFAULT '[]'::jsonb,
    travel_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (travel_fee >= 0),
    travel_time_minutes INTEGER NOT NULL DEFAULT 0 CHECK (travel_time_minutes >= 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    cancellation_reason TEXT,
    google_event_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance & quick slot lookups
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_vehicle_categories_active ON public.vehicle_categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_addons_active ON public.addons(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_gallery_items_active ON public.gallery_items(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_location_zones_active ON public.location_zones(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_appointments_time_status ON public.appointments(start_time, end_time, status);
CREATE INDEX IF NOT EXISTS idx_appointments_code ON public.appointments(appointment_code);
CREATE INDEX IF NOT EXISTS idx_blackout_range ON public.blackout_dates(start_datetime, end_datetime);

-- Row Level Security (RLS) Setup
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blackout_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Public Read Policies for Frontend catalog & slot engine
CREATE POLICY "Public can view active services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Public can view active vehicle categories" ON public.vehicle_categories FOR SELECT USING (true);
CREATE POLICY "Public can view active addons" ON public.addons FOR SELECT USING (true);
CREATE POLICY "Public can view business settings" ON public.business_settings FOR SELECT USING (true);
CREATE POLICY "Public can view business schedules" ON public.business_schedules FOR SELECT USING (true);
CREATE POLICY "Public can view blackout dates" ON public.blackout_dates FOR SELECT USING (true);
CREATE POLICY "Public can view active gallery items" ON public.gallery_items FOR SELECT USING (true);
CREATE POLICY "Public can view location zones" ON public.location_zones FOR SELECT USING (true);
CREATE POLICY "Public can view appointments for slot calculation" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Public can insert new appointments" ON public.appointments FOR INSERT WITH CHECK (true);

-- Authenticated Admin Policies (Full control for authenticated dashboard users)
CREATE POLICY "Admin full control on services" ON public.services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full control on vehicle categories" ON public.vehicle_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full control on addons" ON public.addons FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full control on business settings" ON public.business_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full control on business schedules" ON public.business_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full control on blackout dates" ON public.blackout_dates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full control on gallery items" ON public.gallery_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full control on location zones" ON public.location_zones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full control on appointments" ON public.appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);
