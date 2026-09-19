-- Replace vehicle multipliers with an independent package × vehicle-size pricing matrix.

ALTER TABLE public.vehicle_categories
  ADD COLUMN IF NOT EXISTS size_key TEXT;

UPDATE public.vehicle_categories
SET size_key = CASE
  WHEN id = '11111111-1111-1111-1111-111111111101' THEN 'sedan'
  WHEN id = '11111111-1111-1111-1111-111111111102' THEN 'suv'
  WHEN id = '11111111-1111-1111-1111-111111111103' THEN 'truck'
  WHEN lower(label) LIKE '%truck%' OR lower(label) LIKE '%van%' OR lower(label) LIKE '%3-row%' THEN 'truck'
  WHEN lower(label) LIKE '%suv%' OR lower(label) LIKE '%crossover%' THEN 'suv'
  ELSE 'sedan'
END
WHERE size_key IS NULL OR size_key = '';

ALTER TABLE public.vehicle_categories
  ALTER COLUMN size_key SET DEFAULT 'sedan';

UPDATE public.vehicle_categories SET size_key = 'sedan' WHERE size_key IS NULL;
ALTER TABLE public.vehicle_categories ALTER COLUMN size_key SET NOT NULL;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS pricing_matrix JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.services SET pricing_matrix = '{
  "sedan": { "price": 159, "durationMinutes": 90 },
  "suv": { "price": 189, "durationMinutes": 110 },
  "truck": { "price": 219, "durationMinutes": 130 }
}'::jsonb
WHERE id = '22222222-2222-2222-2222-222222222201';

UPDATE public.services SET pricing_matrix = '{
  "sedan": { "price": 99, "durationMinutes": 60 },
  "suv": { "price": 129, "durationMinutes": 75 },
  "truck": { "price": 149, "durationMinutes": 90 }
}'::jsonb
WHERE id = '22222222-2222-2222-2222-222222222202';

UPDATE public.services SET pricing_matrix = '{
  "sedan": { "price": 199, "durationMinutes": 120 },
  "suv": { "price": 239, "durationMinutes": 150 },
  "truck": { "price": 279, "durationMinutes": 180 }
}'::jsonb
WHERE id = '22222222-2222-2222-2222-222222222203';

UPDATE public.services SET pricing_matrix = '{
  "sedan": { "price": 249, "durationMinutes": 150 },
  "suv": { "price": 299, "durationMinutes": 180 },
  "truck": { "price": 349, "durationMinutes": 210 }
}'::jsonb
WHERE id = '22222222-2222-2222-2222-222222222204';

UPDATE public.services
SET
  name = 'Interior Detail',
  slug = 'interior-detail',
  description = 'Full cabin steam extraction, leather conditioning, deep carpet shampoo, and antimicrobial sanitation.',
  features = '["Full cabin steam & sanitation","Deep carpet hot water extraction","Leather clean and UV conditioner","AC vent ozone odor treatment","All plastics and trim dressed"]'::jsonb,
  base_price = 159,
  duration_minutes = 90,
  is_featured = false,
  sort_order = 1
WHERE id = '22222222-2222-2222-2222-222222222201';

UPDATE public.services
SET
  name = 'Exterior Detail',
  slug = 'exterior-detail',
  description = '2-bucket hand wash, wheel barrel decontamination, synthetic paint sealant, and crystal-clear glass.',
  features = '["Foam cannon pre-soak","Wheel barrel iron removal","60-day hydrophobic sealant","Streak-free crystal glass","Tire dressing and rim shine"]'::jsonb,
  base_price = 99,
  duration_minutes = 60,
  is_featured = false,
  sort_order = 2
WHERE id = '22222222-2222-2222-2222-222222222202';

UPDATE public.services
SET
  name = 'Basic Detail',
  slug = 'basic-detail',
  description = 'Interior wipe-down plus exterior wash and protection — a complete refresh without the full restoration.',
  features = '["Exterior hand wash & dry","Interior vacuum and wipe-down","Windows in and out","Tire dressing","Light stain treatment"]'::jsonb,
  base_price = 199,
  duration_minutes = 120,
  is_featured = false,
  sort_order = 3
WHERE id = '22222222-2222-2222-2222-222222222203';

UPDATE public.services
SET
  name = 'Full Detail',
  slug = 'full-detail',
  description = 'Steam extraction, leather conditioning, clay bar decontam, and multi-layer high-gloss machine glaze.',
  features = '["Full cabin steam & sanitation","Clay bar paint treatment","Deep carpet hot water extraction","High-gloss machine glaze seal","Tire & trim deep rejuvenation"]'::jsonb,
  base_price = 249,
  duration_minutes = 150,
  is_featured = true,
  sort_order = 4
WHERE id = '22222222-2222-2222-2222-222222222204';

UPDATE public.vehicle_categories
SET label = 'Sedan / Coupe', size_key = 'sedan', sort_order = 1
WHERE id = '11111111-1111-1111-1111-111111111101';

UPDATE public.vehicle_categories
SET label = 'SUV / Crossover', size_key = 'suv', sort_order = 2
WHERE id = '11111111-1111-1111-1111-111111111102';

UPDATE public.vehicle_categories
SET label = 'Truck / Large SUV / Van', size_key = 'truck', sort_order = 3
WHERE id = '11111111-1111-1111-1111-111111111103';

ALTER TABLE public.vehicle_categories
  DROP COLUMN IF EXISTS multiplier;
