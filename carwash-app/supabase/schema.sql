-- ==============================================================================
-- APEX Detail Studio - Supabase Database Schema (PostgreSQL)
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
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Vehicle Categories Table (Sedan, SUV, Truck multiplier)
CREATE TABLE IF NOT EXISTS public.vehicle_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.0 CHECK (multiplier > 0),
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
    business_name TEXT NOT NULL DEFAULT 'APEX Detail Studio',
    address TEXT NOT NULL DEFAULT '11723 N FM 620, Austin, TX 78726',
    phone TEXT NOT NULL DEFAULT '(512) 890-2839',
    email TEXT NOT NULL DEFAULT 'concierge@apexdetailaustin.com',
    timezone TEXT NOT NULL DEFAULT 'America/Chicago',
    slot_interval_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_interval_minutes IN (15, 30, 45, 60)),
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

-- 7. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    vehicle_details TEXT NOT NULL,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    vehicle_category_id UUID NOT NULL REFERENCES public.vehicle_categories(id) ON DELETE RESTRICT,
    selected_addons JSONB NOT NULL DEFAULT '[]'::jsonb,
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
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Public Read Policies for Frontend catalog & slot engine
CREATE POLICY "Public can view active services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Public can view active vehicle categories" ON public.vehicle_categories FOR SELECT USING (true);
CREATE POLICY "Public can view active addons" ON public.addons FOR SELECT USING (true);
CREATE POLICY "Public can view business settings" ON public.business_settings FOR SELECT USING (true);
CREATE POLICY "Public can view business schedules" ON public.business_schedules FOR SELECT USING (true);
CREATE POLICY "Public can view blackout dates" ON public.blackout_dates FOR SELECT USING (true);
CREATE POLICY "Public can view appointments for slot calculation" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Public can insert new appointments" ON public.appointments FOR INSERT WITH CHECK (true);

-- Authenticated Admin Policies (Full control for authenticated dashboard users)
CREATE POLICY "Admin full control on services" ON public.services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full control on vehicle categories" ON public.vehicle_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full control on addons" ON public.addons FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full control on business settings" ON public.business_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full control on business schedules" ON public.business_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full control on blackout dates" ON public.blackout_dates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full control on appointments" ON public.appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);
