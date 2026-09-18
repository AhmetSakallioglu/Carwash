-- ==============================================================================
-- Homepage before/after comparison section: toggle + image URLs
-- Safe to re-run on existing Ozer Auto Detailing databases.
-- ==============================================================================

ALTER TABLE public.business_settings
    ADD COLUMN IF NOT EXISTS show_before_after BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.business_settings
    ADD COLUMN IF NOT EXISTS before_after_before_image_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1400&q=80';

ALTER TABLE public.business_settings
    ADD COLUMN IF NOT EXISTS before_after_after_image_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1400&q=80';

UPDATE public.business_settings AS bs
SET
    show_before_after = gi.is_active,
    before_after_before_image_url = COALESCE(NULLIF(gi.before_image_url, ''), bs.before_after_before_image_url),
    before_after_after_image_url = COALESCE(NULLIF(gi.image_url, ''), bs.before_after_after_image_url)
FROM public.gallery_items AS gi
WHERE gi.category = '__homepage_before_after__';
