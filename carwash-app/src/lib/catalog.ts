import { Service, VehicleCategory } from '@/types'
import { Json } from '@/types/database'

export const VEHICLE_SIZE_KEYS = ['sedan', 'suv', 'truck'] as const
export type VehicleSizeKey = (typeof VEHICLE_SIZE_KEYS)[number]

export interface PackageSizeRate {
  price: number
  durationMinutes: number
}

export type PricingMatrix = Record<VehicleSizeKey, PackageSizeRate>

export interface VehicleSizeDefinition {
  key: VehicleSizeKey
  id: string
  label: string
  hint: string
  sortOrder: number
}

export interface PackageDefinition {
  id: string
  slug: string
  name: string
  description: string
  features: string[]
  isFeatured: boolean
  sortOrder: number
  rates: PricingMatrix
}

export const VEHICLE_SIZE_IDS = {
  sedan: '11111111-1111-1111-1111-111111111101',
  suv: '11111111-1111-1111-1111-111111111102',
  truck: '11111111-1111-1111-1111-111111111103',
} as const

export const PACKAGE_IDS = {
  interior: '22222222-2222-2222-2222-222222222201',
  exterior: '22222222-2222-2222-2222-222222222202',
  basic: '22222222-2222-2222-2222-222222222203',
  full: '22222222-2222-2222-2222-222222222204',
} as const

export const VEHICLE_SIZES: VehicleSizeDefinition[] = [
  {
    key: 'sedan',
    id: VEHICLE_SIZE_IDS.sedan,
    label: 'Sedan / Coupe',
    hint: 'Cars & 2-door',
    sortOrder: 1,
  },
  {
    key: 'suv',
    id: VEHICLE_SIZE_IDS.suv,
    label: 'SUV / Crossover',
    hint: 'Crossovers & mid-size SUVs',
    sortOrder: 2,
  },
  {
    key: 'truck',
    id: VEHICLE_SIZE_IDS.truck,
    label: 'Truck / Large SUV / Van',
    hint: 'Trucks, 3-row SUVs & vans',
    sortOrder: 3,
  },
]

export const PACKAGE_CATALOG: PackageDefinition[] = [
  {
    id: PACKAGE_IDS.interior,
    slug: 'interior-detail',
    name: 'Interior Detail',
    description:
      'Full cabin steam extraction, leather conditioning, deep carpet shampoo, and antimicrobial sanitation.',
    features: [
      'Full cabin steam & sanitation',
      'Deep carpet hot water extraction',
      'Leather clean and UV conditioner',
      'AC vent ozone odor treatment',
      'All plastics and trim dressed',
    ],
    isFeatured: false,
    sortOrder: 1,
    rates: {
      sedan: { price: 159, durationMinutes: 90 },
      suv: { price: 189, durationMinutes: 110 },
      truck: { price: 219, durationMinutes: 130 },
    },
  },
  {
    id: PACKAGE_IDS.exterior,
    slug: 'exterior-detail',
    name: 'Exterior Detail',
    description:
      '2-bucket hand wash, wheel barrel decontamination, synthetic paint sealant, and crystal-clear glass.',
    features: [
      'Foam cannon pre-soak',
      'Wheel barrel iron removal',
      '60-day hydrophobic sealant',
      'Streak-free crystal glass',
      'Tire dressing and rim shine',
    ],
    isFeatured: false,
    sortOrder: 2,
    rates: {
      sedan: { price: 99, durationMinutes: 60 },
      suv: { price: 129, durationMinutes: 75 },
      truck: { price: 149, durationMinutes: 90 },
    },
  },
  {
    id: PACKAGE_IDS.basic,
    slug: 'basic-detail',
    name: 'Basic Detail',
    description:
      'Interior wipe-down plus exterior wash and protection — a complete refresh without the full restoration.',
    features: [
      'Exterior hand wash & dry',
      'Interior vacuum and wipe-down',
      'Windows in and out',
      'Tire dressing',
      'Light stain treatment',
    ],
    isFeatured: false,
    sortOrder: 3,
    rates: {
      sedan: { price: 199, durationMinutes: 120 },
      suv: { price: 239, durationMinutes: 150 },
      truck: { price: 279, durationMinutes: 180 },
    },
  },
  {
    id: PACKAGE_IDS.full,
    slug: 'full-detail',
    name: 'Full Detail',
    description:
      'Steam extraction, leather conditioning, clay bar decontam, and multi-layer high-gloss machine glaze.',
    features: [
      'Full cabin steam & sanitation',
      'Clay bar paint treatment',
      'Deep carpet hot water extraction',
      'High-gloss machine glaze seal',
      'Tire & trim deep rejuvenation',
    ],
    isFeatured: true,
    sortOrder: 4,
    rates: {
      sedan: { price: 249, durationMinutes: 150 },
      suv: { price: 299, durationMinutes: 180 },
      truck: { price: 349, durationMinutes: 210 },
    },
  },
]

const SIZE_KEY_SET = new Set<string>(VEHICLE_SIZE_KEYS)

export function isVehicleSizeKey(value: string | null | undefined): value is VehicleSizeKey {
  return Boolean(value && SIZE_KEY_SET.has(value))
}

export function emptyPricingMatrix(seed?: Partial<PricingMatrix>): PricingMatrix {
  return {
    sedan: { price: seed?.sedan?.price ?? 0, durationMinutes: seed?.sedan?.durationMinutes ?? 60 },
    suv: { price: seed?.suv?.price ?? 0, durationMinutes: seed?.suv?.durationMinutes ?? 60 },
    truck: { price: seed?.truck?.price ?? 0, durationMinutes: seed?.truck?.durationMinutes ?? 60 },
  }
}

function parseRate(raw: unknown, fallback: PackageSizeRate): PackageSizeRate {
  if (!raw || typeof raw !== 'object') return { ...fallback }
  const record = raw as Record<string, unknown>
  const price = Number(record.price ?? record.base_price)
  const durationMinutes = Number(
    record.durationMinutes ?? record.duration_minutes ?? record.duration
  )
  return {
    price: Number.isFinite(price) && price >= 0 ? price : fallback.price,
    durationMinutes:
      Number.isFinite(durationMinutes) && durationMinutes > 0
        ? Math.round(durationMinutes)
        : fallback.durationMinutes,
  }
}

export function normalizePricingMatrix(
  raw: unknown,
  fallback?: Partial<PricingMatrix>
): PricingMatrix {
  const base = emptyPricingMatrix(fallback)
  if (!raw || typeof raw !== 'object') return base

  const record = raw as Record<string, unknown>
  return {
    sedan: parseRate(record.sedan, base.sedan),
    suv: parseRate(record.suv, base.suv),
    truck: parseRate(record.truck, base.truck),
  }
}

export function pricingMatrixToJson(matrix: PricingMatrix): Json {
  return JSON.parse(JSON.stringify(matrix)) as Json
}

export function resolveVehicleSizeKey(category?: {
  id?: string | null
  label?: string | null
  size_key?: string | null
} | null): VehicleSizeKey {
  if (category?.size_key && isVehicleSizeKey(category.size_key)) {
    return category.size_key
  }

  const byId = VEHICLE_SIZES.find(size => size.id === category?.id)
  if (byId) return byId.key

  const label = (category?.label || '').toLowerCase()
  if (label.includes('truck') || label.includes('van') || label.includes('3-row') || label.includes('large')) {
    return 'truck'
  }
  if (label.includes('suv') || label.includes('crossover')) {
    return 'suv'
  }
  return 'sedan'
}

export function vehicleSizeDefinition(key: VehicleSizeKey): VehicleSizeDefinition {
  return VEHICLE_SIZES.find(size => size.key === key) || VEHICLE_SIZES[0]
}

export function findPackageDefinition(service?: Pick<Service, 'id' | 'slug'> | null): PackageDefinition | undefined {
  if (!service) return undefined
  return (
    PACKAGE_CATALOG.find(pkg => pkg.id === service.id) ||
    PACKAGE_CATALOG.find(pkg => pkg.slug === service.slug)
  )
}

export function getServicePricingMatrix(service?: Partial<Service> | null): PricingMatrix {
  const catalog = findPackageDefinition(service as Pick<Service, 'id' | 'slug'> | undefined)
  const fallback = catalog?.rates
  const stored = (service as { pricing_matrix?: unknown } | undefined)?.pricing_matrix
  const hasStoredCells =
    stored &&
    typeof stored === 'object' &&
    VEHICLE_SIZE_KEYS.some(key => Boolean((stored as Record<string, unknown>)[key]))

  if (hasStoredCells) {
    return normalizePricingMatrix(stored, fallback)
  }

  if (fallback) return emptyPricingMatrix(fallback)

  const legacyPrice = Number(service?.base_price)
  const legacyDuration = Number(service?.duration_minutes)
  const shared: PackageSizeRate = {
    price: Number.isFinite(legacyPrice) && legacyPrice >= 0 ? legacyPrice : 0,
    durationMinutes:
      Number.isFinite(legacyDuration) && legacyDuration > 0 ? Math.round(legacyDuration) : 60,
  }
  return emptyPricingMatrix({ sedan: shared, suv: shared, truck: shared })
}

export function getPackageSizeRate(
  service: Partial<Service> | null | undefined,
  category?: {
    id?: string | null
    label?: string | null
    size_key?: string | null
  } | null
): PackageSizeRate {
  const matrix = getServicePricingMatrix(service)
  return matrix[resolveVehicleSizeKey(category)]
}

export function getStartingPackageRate(service?: Partial<Service> | null): PackageSizeRate {
  const matrix = getServicePricingMatrix(service)
  return VEHICLE_SIZE_KEYS.map(key => matrix[key]).reduce((lowest, rate) =>
    rate.price < lowest.price ? rate : lowest
  )
}

export function applyMatrixToService<T extends Partial<Service>>(service: T, matrix: PricingMatrix): T {
  const sedan = matrix.sedan
  return {
    ...service,
    pricing_matrix: pricingMatrixToJson(matrix),
    base_price: sedan.price,
    duration_minutes: sedan.durationMinutes,
  }
}

export function hydrateVehicleCategory(raw: Partial<VehicleCategory> & { label?: string }): VehicleCategory {
  const sizeKey = resolveVehicleSizeKey(raw)
  const definition = vehicleSizeDefinition(sizeKey)
  const knownSize = VEHICLE_SIZES.find(size => size.id === raw.id)
  return {
    id: raw.id || definition.id,
    label: knownSize?.label || raw.label || definition.label,
    size_key: sizeKey,
    is_active: raw.is_active !== undefined ? Boolean(raw.is_active) : true,
    sort_order: Number(raw.sort_order) || definition.sortOrder,
    created_at: raw.created_at || new Date().toISOString(),
  }
}

const LEGACY_PACKAGE_SLUGS = new Set([
  'signature-hand-wash',
  'interior-deep-steam',
  'full-complete-reset',
  'ceramic-coating-correction',
])

export function hydrateService(raw: Partial<Service> & { name?: string }): Service {
  const catalog = findPackageDefinition(raw as Pick<Service, 'id' | 'slug'>)
  const matrix = getServicePricingMatrix(raw)
  const sedan = matrix.sedan
  const remapLegacyCopy = Boolean(catalog && LEGACY_PACKAGE_SLUGS.has(raw.slug || ''))
  return {
    id: raw.id || catalog?.id || `pkg_${Date.now()}`,
    name: (remapLegacyCopy ? catalog?.name : raw.name) || catalog?.name || 'Detail Package',
    slug: (remapLegacyCopy ? catalog?.slug : raw.slug) || catalog?.slug || 'detail-package',
    description: (remapLegacyCopy ? catalog?.description : raw.description) || catalog?.description || '',
    features:
      (remapLegacyCopy ? catalog?.features : undefined) ||
      (Array.isArray(raw.features) ? raw.features : catalog?.features || []),
    base_price: sedan.price,
    duration_minutes: sedan.durationMinutes,
    pricing_matrix: pricingMatrixToJson(matrix),
    discount_percentage: Number(raw.discount_percentage) || 0,
    discount_active: Boolean(raw.discount_active),
    is_featured: raw.is_featured !== undefined ? Boolean(raw.is_featured) : Boolean(catalog?.isFeatured),
    is_active: raw.is_active !== undefined ? Boolean(raw.is_active) : true,
    sort_order: Number(raw.sort_order) || catalog?.sortOrder || 0,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  }
}
