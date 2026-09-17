-- ==============================================================================
-- Hero stats, Google reviews settings, and public gallery storage
-- Safe to re-run on existing Ozer Auto Detailing databases.
-- ==============================================================================

ALTER TABLE public.business_settings
    ADD COLUMN IF NOT EXISTS tagline TEXT NOT NULL DEFAULT 'Premium Auto Detailing & Mobile Wash';

ALTER TABLE public.business_settings
    ADD COLUMN IF NOT EXISTS show_google_reviews BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.business_settings
    ADD COLUMN IF NOT EXISTS google_place_id TEXT NOT NULL DEFAULT '';

ALTER TABLE public.business_settings
    ADD COLUMN IF NOT EXISTS hero_vehicles_count INTEGER NOT NULL DEFAULT 250;

ALTER TABLE public.business_settings
    ADD COLUMN IF NOT EXISTS hero_rating_override NUMERIC(2, 1);

ALTER TABLE public.business_settings
    ADD COLUMN IF NOT EXISTS hero_review_count_override INTEGER;

ALTER TABLE public.business_settings
    ADD COLUMN IF NOT EXISTS hero_stat_3_value TEXT NOT NULL DEFAULT '100%';

ALTER TABLE public.business_settings
    ADD COLUMN IF NOT EXISTS hero_stat_3_label TEXT NOT NULL DEFAULT 'Mobile Service';

ALTER TABLE public.business_settings
    ADD COLUMN IF NOT EXISTS hero_stat_4_value TEXT NOT NULL DEFAULT 'Austin, TX';

ALTER TABLE public.business_settings
    ADD COLUMN IF NOT EXISTS hero_stat_4_label TEXT NOT NULL DEFAULT 'Service Area';

UPDATE public.business_settings
SET
    business_name = CASE
        WHEN business_name ILIKE '%apex%' OR business_name ILIKE '%apx%' THEN 'Ozer Auto Detailing'
        WHEN business_name = 'OZER Detail Studio' THEN 'Ozer Auto Detailing'
        ELSE business_name
    END,
    tagline = COALESCE(NULLIF(tagline, ''), 'Premium Auto Detailing & Mobile Wash')
WHERE true;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'gallery-images',
    'gallery-images',
    true,
    8388608,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'Public read gallery images'
    ) THEN
        CREATE POLICY "Public read gallery images"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'gallery-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'Authenticated upload gallery images'
    ) THEN
        CREATE POLICY "Authenticated upload gallery images"
            ON storage.objects FOR INSERT
            WITH CHECK (bucket_id = 'gallery-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'Authenticated update gallery images'
    ) THEN
        CREATE POLICY "Authenticated update gallery images"
            ON storage.objects FOR UPDATE
            USING (bucket_id = 'gallery-images')
            WITH CHECK (bucket_id = 'gallery-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'Authenticated delete gallery images'
    ) THEN
        CREATE POLICY "Authenticated delete gallery images"
            ON storage.objects FOR DELETE
            USING (bucket_id = 'gallery-images');
    END IF;
END $$;
