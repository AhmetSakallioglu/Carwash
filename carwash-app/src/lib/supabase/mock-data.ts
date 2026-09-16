import { Service, VehicleCategory, Addon, BusinessSettings, BusinessSchedule, BlackoutDate, Appointment } from '@/types'

export const MOCK_BUSINESS_SETTINGS: BusinessSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  business_name: 'OZER Detail Studio',
  address: '11723 N FM 620, Austin, TX 78726',
  phone: '(512) 890-2839',
  email: 'concierge@ozerdetailaustin.com',
  timezone: 'America/Chicago',
  slot_interval_minutes: 30,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const MOCK_SERVICES: Service[] = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    name: 'Exterior Signature Hand Wash',
    slug: 'signature-hand-wash',
    description: '2-bucket hand wash, wheel barrel decontamination, synthetic paint sealant, and crystal-clear glass.',
    features: ['Foam cannon pre-soak', 'Wheel barrel iron removal', '60-day hydrophobic sealant', 'Streak-free crystal glass', 'Tire dressing and rim shine'],
    base_price: 99,
    duration_minutes: 60,
    is_featured: false,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    name: 'Interior Deep Steam Restoration',
    slug: 'interior-deep-steam',
    description: 'Full cabin steam extraction, leather conditioning, deep carpet shampoo, and antimicrobial sanitation.',
    features: ['Full cabin steam & sanitation', 'Deep carpet hot water extraction', 'Leather clean and UV conditioner', 'AC vent ozone odor treatment', 'All plastics and trim dressed'],
    base_price: 159,
    duration_minutes: 90,
    is_featured: false,
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    name: 'Full Complete Reset (In & Out)',
    slug: 'full-complete-reset',
    description: 'Steam extraction, leather conditioning, clay bar decontam, and multi-layer high-gloss machine glaze.',
    features: ['Full cabin steam & sanitation', 'Clay bar paint treatment', 'Deep carpet hot water extraction', 'High-gloss machine glaze seal', 'Tire & trim deep rejuvenation'],
    base_price: 249,
    duration_minutes: 150,
    is_featured: true,
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222204',
    name: 'Ceramic Coating & Paint Correction',
    slug: 'ceramic-coating-correction',
    description: 'Multi-stage machine paint correction eliminating swirls, topped with certified 3 to 5-year 9H ceramic matrix.',
    features: ['2-Stage swirl elimination', '9H Ceramic layer application', 'Carfax registration warranty', 'Hydrophobic glass coating', 'Wheel faces ceramic protected'],
    base_price: 799,
    duration_minutes: 240,
    is_featured: false,
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
]

export const MOCK_VEHICLE_CATEGORIES: VehicleCategory[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    label: 'Sedan / Coupe',
    multiplier: 1.0,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    label: 'Mid-SUV / Crossover',
    multiplier: 1.2,
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    label: 'Truck / 3-Row SUV',
    multiplier: 1.4,
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
  }
]

export const MOCK_ADDONS: Addon[] = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    name: 'Pet Hair & Odor Neutralizer',
    price: 50,
    duration_minutes: 30,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    name: 'Engine Bay Detail & Dressing',
    price: 75,
    duration_minutes: 30,
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333303',
    name: 'UV Headlight Restoration',
    price: 90,
    duration_minutes: 45,
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333304',
    name: 'Leather Ceramic Guard Treatment',
    price: 120,
    duration_minutes: 45,
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
  }
]

export const MOCK_SCHEDULES: BusinessSchedule[] = [
  { id: '1', day_of_week: 0, is_open: false, open_time: '08:00', close_time: '18:00', created_at: new Date().toISOString() },
  { id: '2', day_of_week: 1, is_open: true, open_time: '08:00', close_time: '18:00', created_at: new Date().toISOString() },
  { id: '3', day_of_week: 2, is_open: true, open_time: '08:00', close_time: '18:00', created_at: new Date().toISOString() },
  { id: '4', day_of_week: 3, is_open: true, open_time: '08:00', close_time: '18:00', created_at: new Date().toISOString() },
  { id: '5', day_of_week: 4, is_open: true, open_time: '08:00', close_time: '18:00', created_at: new Date().toISOString() },
  { id: '6', day_of_week: 5, is_open: true, open_time: '08:00', close_time: '18:00', created_at: new Date().toISOString() },
  { id: '7', day_of_week: 6, is_open: true, open_time: '08:30', close_time: '17:00', created_at: new Date().toISOString() }
]

export const MOCK_BLACKOUTS: BlackoutDate[] = [
  {
    id: '44444444-4444-4444-4444-444444444401',
    title: 'Austin Studio Maintenance Day',
    start_datetime: '2026-10-15T00:00:00.000Z',
    end_datetime: '2026-10-15T23:59:59.000Z',
    is_full_day: true,
    created_at: new Date().toISOString(),
  }
]

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: '55555555-5555-5555-5555-555555555501',
    appointment_code: 'APX-9482',
    customer_name: 'Marcus Vance',
    customer_phone: '(512) 481-9920',
    customer_address: '1100 Congress Ave, Austin, TX 78701',
    vehicle_details: '2024 Porsche 911 GT3 (Chalk)',
    service_id: '22222222-2222-2222-2222-222222222204',
    vehicle_category_id: '11111111-1111-1111-1111-111111111101',
    selected_addons: [
      { id: '33333333-3333-3333-3333-333333333302', name: 'Engine Bay Detail & Dressing', price: 75, duration_minutes: 30 }
    ],
    total_price: 874,
    start_time: '2026-09-17T14:00:00.000Z', // 9:00 AM CT
    end_time: '2026-09-17T18:30:00.000Z',
    status: 'confirmed',
    cancellation_reason: null,
    google_event_id: 'mock_cal_event_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    service: MOCK_SERVICES[3],
    vehicle_category: MOCK_VEHICLE_CATEGORIES[0]
  },
  {
    id: '55555555-5555-5555-5555-555555555502',
    appointment_code: 'APX-3104',
    customer_name: 'Sarah Jenkins',
    customer_phone: '(512) 793-1144',
    customer_address: '3400 Palm Way, Austin, TX 78758',
    vehicle_details: '2023 Tesla Model X Plaid (Midnight Silver)',
    service_id: '22222222-2222-2222-2222-222222222203',
    vehicle_category_id: '11111111-1111-1111-1111-111111111103',
    selected_addons: [
      { id: '33333333-3333-3333-3333-333333333301', name: 'Pet Hair & Odor Neutralizer', price: 50, duration_minutes: 30 }
    ],
    total_price: 398.6,
    start_time: '2026-09-18T15:00:00.000Z', // 10:00 AM CT
    end_time: '2026-09-18T18:00:00.000Z',
    status: 'confirmed',
    cancellation_reason: null,
    google_event_id: 'mock_cal_event_2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    service: MOCK_SERVICES[2],
    vehicle_category: MOCK_VEHICLE_CATEGORIES[2]
  }
]
