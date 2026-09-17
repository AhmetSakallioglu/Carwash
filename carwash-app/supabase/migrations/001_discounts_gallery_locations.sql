-- ==============================================================================
-- Incremental migration: discounts, gallery, location zones, appointment travel
-- Safe to re-run on existing OZER Detail Studio databases.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Promotional discount columns on services
ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS discount_active BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'services_discount_percentage_check'
    ) THEN
        ALTER TABLE public.services
            ADD CONSTRAINT services_discount_percentage_check
            CHECK (discount_percentage >= 0 AND discount_percentage <= 100);
    END IF;
END $$;

-- 2. Gallery items
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

-- 3. Location / service area zones
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

-- 4. Appointment travel fields
ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS location_zone_id UUID REFERENCES public.location_zones(id) ON DELETE SET NULL;

ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS travel_fee NUMERIC(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS travel_time_minutes INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'appointments_travel_fee_check'
    ) THEN
        ALTER TABLE public.appointments
            ADD CONSTRAINT appointments_travel_fee_check CHECK (travel_fee >= 0);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'appointments_travel_time_minutes_check'
    ) THEN
        ALTER TABLE public.appointments
            ADD CONSTRAINT appointments_travel_time_minutes_check CHECK (travel_time_minutes >= 0);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gallery_items_active ON public.gallery_items(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_location_zones_active ON public.location_zones(is_active, sort_order);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active gallery items" ON public.gallery_items;
CREATE POLICY "Public can view active gallery items" ON public.gallery_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view location zones" ON public.location_zones;
CREATE POLICY "Public can view location zones" ON public.location_zones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full control on gallery items" ON public.gallery_items;
CREATE POLICY "Admin full control on gallery items" ON public.gallery_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full control on location zones" ON public.location_zones;
CREATE POLICY "Admin full control on location zones" ON public.location_zones FOR ALL TO authenticated USING (true) WITH CHECK (true);
