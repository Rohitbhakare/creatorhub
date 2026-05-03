/**
 * Seeds rich dummy content across India for web/mobile validation.
 *
 *   pnpm tsx scripts/seed-dummy-content.ts
 *
 * Idempotent: every row uses a stable UUID with a `dd000000` prefix for
 * easy identification, and the script DELETEs that range first before
 * re-inserting. Production data (any other UUID range) is untouched.
 *
 * Volume:
 *   8 creators · 16 posts · 10 itineraries · 6 experiences · 5 events
 *   = 37 content rows across 18 cities, all with Unsplash cover images.
 */

import { createClient } from '@supabase/supabase-js'
// Load API .env without adding a dotenv dependency. tsx --env-file does the
// same job; we run with `pnpm tsx --env-file=.env scripts/seed-dummy-content.ts`.
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ── Stable UUID generators ──────────────────────────────────────────
// Prefix `dd0` so wipe is precise.
const userId = (n: number) => `dd000000-1000-1000-1000-${String(n).padStart(12, '0')}`
const contentId = (n: number) => `dd000000-2000-2000-2000-${String(n).padStart(12, '0')}`

// ── Cities (referenced by content.starting_city_id) ──────────────────
const C = {
  delhi: 'in.dl.delhi',
  mumbai: 'in.mh.mumbai',
  bengaluru: 'in.ka.bengaluru',
  hyderabad: 'in.tg.hyderabad',
  pune: 'in.mh.pune',
  jaipur: 'in.rj.jaipur',
  chennai: 'in.tn.chennai',
  kolkata: 'in.wb.kolkata',
  ahmedabad: 'in.gj.ahmedabad',
  varanasi: 'in.up.varanasi',
  agra: 'in.up.agra',
  srinagar: 'in.jk.srinagar',
  lucknow: 'in.up.lucknow',
  bhopal: 'in.mp.bhopal',
  indore: 'in.mp.indore',
  nashik: 'in.mh.nashik',
  thane: 'in.mh.thane',
  vadodara: 'in.gj.vadodara',
} as const

// ── Creators ─────────────────────────────────────────────────────────
const creators = [
  {
    id: userId(1),
    phone: '9810000001',
    display_name: 'Aanya Ravi',
    username: 'aanyaravi',
    bio: 'Coastal slow-travel. Konkan, Goa, the Kerala backwaters. Writer & photographer.',
    verticals: ['travel', 'stories'] as const,
  },
  {
    id: userId(2),
    phone: '9810000002',
    display_name: 'Vikram Khanna',
    username: 'vikramkhanna',
    bio: 'Two-wheel adventures from Spiti to Ladakh. 38 high-altitude rides logged.',
    verticals: ['travel'] as const,
  },
  {
    id: userId(3),
    phone: '9810000003',
    display_name: 'Diya Pratap',
    username: 'diyapratap',
    bio: 'Trekking guide. Triund, Kedarkantha, Hampta. Beginner-friendly trails.',
    verticals: ['travel'] as const,
  },
  {
    id: userId(4),
    phone: '9810000004',
    display_name: 'Saanvi Krishnan',
    username: 'saanvik',
    bio: 'Food walks across south India. Pondicherry kitchens, Chettinad, Bangalore filter coffee.',
    verticals: ['stories', 'food'] as const,
  },
  {
    id: userId(5),
    phone: '9810000005',
    display_name: 'Rohan Mehta',
    username: 'rohanmehta',
    bio: 'Heritage walks & history. Old Delhi, Hyderabad, Lucknow nawabi-era.',
    verticals: ['stories'] as const,
  },
  {
    id: userId(6),
    phone: '9810000006',
    display_name: 'Kabir Shenoy',
    username: 'kabirshenoy',
    bio: 'Photography expeditions. Ladakh, Spiti, North Sikkim. Dark sky chaser.',
    verticals: ['travel', 'photography'] as const,
  },
  {
    id: userId(7),
    phone: '9810000007',
    display_name: 'Ria Bhatia',
    username: 'riabhatia',
    bio: 'Solo female travel & community. Trip planning workshops in Mumbai.',
    verticals: ['travel'] as const,
  },
  {
    id: userId(8),
    phone: '9810000008',
    display_name: 'Devansh Pillai',
    username: 'devanshpillai',
    bio: 'Weekend getaways from Bangalore. Coorg, Chikmagalur, Hampi.',
    verticals: ['travel'] as const,
  },
]

// ── Content with media URLs baked in ────────────────────────────────
/**
 * `subCategory` values must match a row in `vertical_sub_categories`.
 * Verified against the live DB on 2026-05-02 — note: live IDs use the
 * canonicalised `_<modifier>` suffix style (e.g. `travel.heritage_culture`,
 * not `travel.heritage` from migration 023's original draft).
 */
type TravelSubCategory =
  | 'travel.road_trips_biking'
  | 'travel.biking'
  | 'travel.trekking_hiking'
  | 'travel.adventure_sports'
  | 'travel.heritage_culture'
  | 'travel.food_trails'
  | 'travel.wildlife_nature'
  | 'travel.photo_walks'
  | 'travel.wellness_retreats'
  | 'travel.family_kids'
  | 'travel.luxury_curated'
  | 'travel.offbeat_hidden'
  | 'travel.nightlife_events'
type StoriesSubCategory =
  | 'stories.personal'
  | 'stories.photo_essays'
  | 'stories.guides'
  | 'stories.lists'
  | 'stories.reviews'
type SubCategoryId = TravelSubCategory | StoriesSubCategory

interface SpotSeed {
  /** 1-indexed day this spot belongs to. */
  dayNumber: number
  /** 1-indexed order within the day. */
  spotOrder: number
  name: string
  /** Free-form category label shown on the spot card. */
  category: string
  lat: number
  lng: number
  /** Unsplash photo ID — `https://images.unsplash.com/<id>` will be the thumbnail. */
  thumbnailId?: string
  /** 1-2 sentence creator note shown when the spot card expands. */
  creatorNote?: string
  /** Estimated time at the spot in minutes. Used in the day-summary. */
  durationMinutes?: number
  /** Stop type — drives icon + monochrome/coral colouring per design system. */
  stopType?: 'regular' | 'overnight' | 'meal' | 'photo' | 'meeting'
  /** Visible to non-buyers on paid itineraries (FR-046). Defaults to true for day 1. */
  isFreePreview?: boolean
}

interface PostSeed {
  type: 'post'
  city: string
  vertical: 'travel' | 'stories' | 'food'
  subCategory: SubCategoryId
  title: string
  description: string
  body: string
  cover: string
  pricing?: 'free' | 'paid'
  pricePaisa?: number
}

interface ItinerarySeed {
  type: 'self_paced_itinerary'
  city: string
  subCategory: TravelSubCategory
  title: string
  description: string
  /** Long-form markdown body — magazine reader renders this with merged spot cards. */
  body: string
  cover: string
  durationDays: number
  pricing?: 'free' | 'paid'
  pricePaisa?: number
  days: { dayNumber: number; title: string; description: string }[]
  spots: SpotSeed[]
  /** Day offsets from now for scheduled departure dates (paid itineraries only). */
  scheduledDates?: number[]
  /** Capacity for each scheduled date. Defaults to 8. */
  scheduledCapacity?: number
}

interface ExperienceSeed {
  type: 'scheduled_experience'
  city: string
  subCategory: TravelSubCategory
  title: string
  description: string
  /** Long-form markdown — what to expect, who it's for, what to bring. */
  body: string
  cover: string
  pricePaisa: number
  durationMinutes: number
  meetingArea: string
  exactLocation: string
  capacity: number
  /** Date offsets in days from now. */
  dates: number[]
}

interface EventSeed {
  type: 'event'
  city: string
  subCategory: TravelSubCategory | StoriesSubCategory
  title: string
  description: string
  /** Long-form markdown — agenda, format, what to expect. */
  body: string
  cover: string
  venue: string
  venueAddress: string
  /** Day offset from now. */
  startsInDays: number
  durationHours: number
  capacity: number
  isFree: boolean
}

type Seed = PostSeed | ItinerarySeed | ExperienceSeed | EventSeed

const photo = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=80&auto=format`

const seeds: { creator: number; data: Seed }[] = [
  // ─── Posts (stories) ──────────────────────────────────────────
  {
    creator: 1,
    data: {
      type: 'post',
      city: C.mumbai,
      vertical: 'travel',
      subCategory: 'travel.road_trips_biking',
      title: 'Konkan in 4 quiet days',
      description: 'A coastal route from Mumbai to Diveagar — slow, salty, no rush.',
      body:
        'We left at sunrise. The Mumbai-Pune highway empties at 5 a.m., and that is the road\'s secret. By 7, we were at Tamhini Ghat with monsoon waterfalls cutting across the road. Three days later, on a stretch outside Indapur, the road belonged to no one. We stopped, and stayed stopped, for an hour.\n\nDay 2 in Velas, the olive ridley turtles. Day 3, Aji\'s kitchen in Guhagar — three fishes, hot rice, solkadhi until you cannot. Day 4, the cliff walk in Ratnagiri at sunset.',
      cover: 'photo-1564507592333-c60657eea523',
    },
  },
  {
    creator: 2,
    data: {
      type: 'post',
      city: C.srinagar,
      vertical: 'travel',
      subCategory: 'travel.biking',
      title: 'Why Spiti before snow is the only Spiti',
      description: 'Late September is the secret. The light is gold, the roads are open, the crowds are gone.',
      body:
        'June Spiti is loud. October Spiti is impossible. But that two-week window in the last days of September? You get the high passes, the gold-leaf willows, the Pin Valley apricot harvest, and exactly zero Instagrammers in matching jumpsuits.\n\nManali to Kaza on day 1, Pin Valley on day 3, Chandratal on the way back. Bring layers. Bring a jerry can. The petrol pump at Kaza closes at 7 p.m.',
      cover: 'photo-1626621341517-bbf3d9990a23',
    },
  },
  {
    creator: 3,
    data: {
      type: 'post',
      city: C.indore,
      vertical: 'travel',
      subCategory: 'travel.heritage_culture',
      title: 'Mandu in monsoon — the only monsoon plan worth keeping',
      description: 'Three days, ten ruins, two thousand years of love stories.',
      body:
        'When it rains in Mandu, the Roopmati pavilion sits inside a cloud. You walk up at 6 a.m. and the entire fort is yours. The Jami Masjid courtyard, empty. The Hoshang Shah tomb, dripping wet. By the time the tour buses arrive at 11 a.m., you are back at your hotel eating dal-baati.',
      cover: 'photo-1599661046289-e31897846e41',
    },
  },
  {
    creator: 4,
    data: {
      type: 'post',
      city: C.hyderabad,
      vertical: 'food',
      subCategory: 'travel.food_trails',
      title: 'The last Irani chai café in Hyderabad',
      description: 'Nimrah Café is 90 years old. The Osmania biscuit still costs ₹8.',
      body:
        'There used to be 300 Irani cafés in Hyderabad. Now there are maybe 20. Nimrah, right opposite Charminar, opens at 5 a.m. The Osmania biscuit costs ₹8 — same price since 2015. Aziz bhai, 74, showed me the leather-bound ledger from 1934. \n\n> "We don\'t change the recipe because the recipe is the memory."\n\nThe chai is milky, sweet, made in a massive brass degh. Some things should never be optimised.',
      cover: 'photo-1587474260584-136574528ed5',
    },
  },
  {
    creator: 5,
    data: {
      type: 'post',
      city: C.lucknow,
      vertical: 'stories',
      subCategory: 'stories.personal',
      title: 'Tunday Kababi at 7 a.m. is a different city',
      description: 'Lucknow before the tourists wake up.',
      body:
        'The Aminabad branch opens at 7. Everyone tells you to go to the Chowk one. They are wrong — Chowk is for tourists. Aminabad is for the rickshaw drivers, the lawyers heading to court, the old men reading Awaz on the next bench. The kababs are softer at 7 than at 11. The keema paratha hasn\'t hit its stride yet, but the shami kabab, freshly fried, falls apart on your tongue like it knows the day is starting.',
      cover: 'photo-1606491956689-2ea866880c84',
    },
  },
  {
    creator: 6,
    data: {
      type: 'post',
      city: C.srinagar,
      vertical: 'travel',
      subCategory: 'travel.photo_walks',
      title: '47 failed attempts at the Milky Way in Hanle',
      description: 'Spoiler: attempt 48 worked. Everything I learned, in order.',
      body:
        'Equipment: Canon R6 Mark II, Sigma 14mm f/1.8, tripod that cost more than the flight. Location: Hanle, Ladakh. Altitude: 14,764 feet. First 20 attempts failed because I didn\'t know about the 500 rule. The next 15 failed because clouds. Then 12 more because my battery died in the cold (pro tip: keep it in your jacket until the last second).\n\nAttempt 48: 25 seconds, f/1.8, ISO 3200. The arm of the galaxy stretched across the frame like someone had spilled cream across a black tablecloth.',
      cover: 'photo-1506905925346-21bda4d32df4',
    },
  },
  {
    creator: 7,
    data: {
      type: 'post',
      city: C.mumbai,
      vertical: 'travel',
      subCategory: 'travel.offbeat_hidden',
      title: 'Solo travel in India — the question I get asked the most',
      description: '"Is it safe?" The honest, lived answer from 24 trips.',
      body:
        'Yes, with caveats. Tier-1 cities at night: book a cab, don\'t walk. Hill towns: completely fine, often safer than my own neighbourhood. Religious towns at festival time: skip them — not unsafe, just exhausting. I have done Hampi alone twice, Bir three times, Munnar in monsoon. The risk profile of Indian solo travel is "logistics-heavy, not danger-heavy."',
      cover: 'photo-1502786129293-79981df4e689',
    },
  },
  {
    creator: 8,
    data: {
      type: 'post',
      city: C.bengaluru,
      vertical: 'travel',
      subCategory: 'travel.road_trips_biking',
      title: 'Coorg in a long weekend — without the resort cliché',
      description: 'A Friday-evening to Sunday-night route that doesn\'t involve a "wellness retreat."',
      body:
        'Drive Friday night. Madikeri by midnight. Saturday morning: Abbey Falls before the crowds. Saturday lunch: pandi curry at a homestay in Napoklu. Saturday evening: Raja\'s Seat for sunset, then Cauvery Riverside cafe for dinner. Sunday: Tala Cauvery at sunrise, Bhagamandala temple, drive back via Mysuru. Skip the spice plantation tours — they are tourist traps.',
      cover: 'photo-1582719471384-894fbb16e074',
    },
  },
  {
    creator: 1,
    data: {
      type: 'post',
      city: C.varanasi,
      vertical: 'stories',
      subCategory: 'stories.guides',
      title: 'First-timer\'s guide to Varanasi — skip the ghat walks',
      description: 'Controversial: the organised ghat walks are a tourist trap.',
      body:
        'They start at 5 a.m. with 30 strangers and a guide who has memorised three jokes. Skip it. Walk to Manikarnika at 4 a.m. by yourself. Sit on the steps. Don\'t take photos. The pyres burn 24/7 here — they have for 2,500 years. After an hour, walk to Pizzeria Vaatika for a chai. Then Assi Ghat for the morning aarti at 6:30. That sequence — quiet, then ritual — is the city.',
      cover: 'photo-1561361513-2d000a50f0dc',
    },
  },
  {
    creator: 5,
    data: {
      type: 'post',
      city: C.delhi,
      vertical: 'stories',
      subCategory: 'stories.personal',
      title: 'Old Delhi at 5 a.m. is the only Old Delhi',
      description: 'The walks I do for friends visiting from abroad.',
      body:
        'Jama Masjid steps at 5 a.m. The first muezzin\'s call. The pigeons rise over the dome. Walk down to Karim\'s — they don\'t open for breakfast, but Al-Jawahar across the street does. Order the nihari and a kulcha. Walk to Khari Baoli (the spice market) by 6:30, before the trucks arrive. By 8 you are at Daryaganj for a chai at the press club gates. By 9, the city has turned.',
      cover: 'photo-1602216056096-3b40cc0c9944',
    },
  },
  {
    creator: 4,
    data: {
      type: 'post',
      city: C.chennai,
      vertical: 'food',
      subCategory: 'travel.food_trails',
      title: 'Chennai filter coffee — a 4-decanter taste test',
      description: 'Saravana Bhavan vs. Murugan Idli vs. Rayars vs. the unnamed cart.',
      body:
        'Saravana: corporate, consistent, slightly burnt. Murugan: foamy, tilts sweet. Rayars: the textbook ratio, the temperature is exact, this is what Chennai tastes like. The unnamed cart on Karneeshwarar Koil street: chicory-heavy, bitter, served in steel tumblers that scald your fingers — and the only one I came back for the next morning.',
      cover: 'photo-1495474472287-4d71bcdd2085',
    },
  },
  {
    creator: 7,
    data: {
      type: 'post',
      city: C.pune,
      vertical: 'travel',
      subCategory: 'travel.road_trips_biking',
      title: 'Pune to Tarkarli — the long weekend nobody plans right',
      description: 'Skip Goa. Tarkarli is what Goa was 25 years ago.',
      body:
        'Friday night drive. 12 hours via Ratnagiri. Saturday: scuba diving at Sindhudurg, 1,200 rupees, seasoned instructors, visibility better than the brochures suggest. Saturday evening: silver beach at Devbagh — actual silver sand, no shacks, no music. Sunday lunch: a homestay where lunch is whatever was caught that morning. Sunday drive back via Amboli ghat for sunset.',
      cover: 'photo-1602216056096-3b40cc0c9944',
    },
  },
  {
    creator: 8,
    data: {
      type: 'post',
      city: C.bengaluru,
      vertical: 'travel',
      subCategory: 'travel.heritage_culture',
      title: 'Hampi without the day-trip cliché',
      description: 'Three days minimum. Anegundi changes the whole trip.',
      body:
        'Most people do Hampi in 6 hours. Three days is the minimum. Day 1: royal enclosure, bazaar, Vijaya Vittala by 4 p.m. for the gold light. Day 2: cross the river at sunrise to Anegundi — the part of Hampi nobody visits. Day 3: bouldering and the Hanuman temple climb at sunset. The watchman at the side shrine behind the elephant stables knows the 600-year story nobody tells.',
      cover: 'photo-1590050752117-238cb0fb12b1',
    },
  },
  {
    creator: 3,
    data: {
      type: 'post',
      city: C.nashik,
      vertical: 'travel',
      subCategory: 'travel.adventure_sports',
      title: 'Two waterfalls outside Nashik you have to walk to',
      description: 'Dugarwadi and Vihigaon. No ticket counter, no railing, no bus tour.',
      body:
        'You will not find these on any "Top 10 Maharashtra waterfalls" list, which is exactly why they are still worth your time. Both need a 30-minute walk through a village. Both are at their best between mid-July and mid-September. Both have zero infrastructure — pack water, pack out trash, leave by 4 p.m. so you are not navigating the trail at dusk.',
      cover: 'photo-1500964757637-c85e8a162699',
    },
  },
  {
    creator: 6,
    data: {
      type: 'post',
      city: C.kolkata,
      vertical: 'stories',
      subCategory: 'stories.personal',
      title: 'A morning at the College Street book bazaar',
      description: 'Boi Para. Half a million books, no inventory, somehow everyone finds what they want.',
      body:
        'You walk down the street and tell the first stall keeper what you are looking for. He shouts the title across the street. By the time you reach stall four, six men have already started looking. Twenty minutes later, the book is in your hand — sometimes brand new at half price, sometimes a 1972 imprint with someone\'s grandmother\'s name on the flyleaf. Boi Para does not have an algorithm. It has the men of College Street.',
      cover: 'photo-1521587760476-6c12a4b040da',
    },
  },
  {
    creator: 1,
    data: {
      type: 'post',
      city: C.ahmedabad,
      vertical: 'stories',
      subCategory: 'stories.personal',
      title: 'The pol houses of Ahmedabad — what the heritage walks miss',
      description: 'Skip the official walk. Get lost in Mandvi-ni-pol on a Tuesday morning.',
      body:
        'The official walks take you through the same six houses. Beautiful, sure. But the magic is the unmaintained ones, the ones where four families share a courtyard and an old chabutra. A Tuesday morning, when the kids are at school and the grandmothers are stringing flowers. Ask one of them if you can sit on the chabutra steps. They will say yes and bring you a glass of water.',
      cover: 'photo-1604357209793-fca5dca89f97',
    },
  },

  // ─── Itineraries ─────────────────────────────────────────────
  {
    creator: 2,
    data: {
      type: 'self_paced_itinerary',
      subCategory: 'travel.biking',
      city: C.srinagar,
      title: 'Manali to Spiti Valley — 7 day road trip',
      description: 'The complete route with stops, stays, and permits. Tested late-Sept 2025.',
      cover: 'photo-1626621341517-bbf3d9990a23',
      durationDays: 7,
      pricing: 'paid',
      pricePaisa: 49900,
      body:
        '## Why this route, and why now\n\nLate September is the only honest time for Spiti. June rains rip the Manali-Kaza road in half. Mid-October the snow shuts Kunzum. The window is ten days, give or take. This itinerary moves slowly enough that altitude does not catch up with you, and fast enough that you ride out before the passes close.\n\n## Permits, fuel, and the petrol reality\n\nNo permits for Indian citizens for the route up to Tabo. Foreigners need an Inner Line Permit for Tabo onwards — pick it up in Reckong Peo (alternate route) or Kaza SDM office. The petrol pump at Kaza closes at 7 p.m. and runs dry by mid-October — carry a 5L jerry can. Tank up at Manali, top up at Tandi (last fuel before Kaza, 365 km), refuel at Kaza for the way back.\n\n## What to pack\n\nLayers, not bulk. Down jacket, fleece, base layers, gloves, ear cover. A balaclava for Kunzum (4,551m) — wind cuts through anything thinner. Headlamp for Chandratal nights. Diamox for altitude (start 24 hours before Jispa). Cash — UPI is a coin flip in Kaza, dead beyond.\n\n## How to read the days below\n\nEach day card has a route summary and the food/sleep recommendations I have actually tested. The spots tagged `overnight` are where I have personally stayed — not aspirational, not influencer-recommended.',
      days: [
        { dayNumber: 1, title: 'Manali → Jispa', description: 'Acclimatise at 3,200m. Light walk to Sissu monastery.' },
        { dayNumber: 2, title: 'Jispa → Kaza via Kunzum', description: 'High pass crossing. Tea at the dhabaa near Losar.' },
        { dayNumber: 3, title: 'Kaza homestay day', description: 'Key Monastery at sunrise. Komic village afternoon.' },
        { dayNumber: 4, title: 'Pin Valley', description: 'Mudh village. Apricot harvest if late Sept.' },
        { dayNumber: 5, title: 'Chandratal', description: 'Camp at the moon lake. Stargazing recommended.' },
        { dayNumber: 6, title: 'Chandratal → Manali', description: 'Long descent via Atal tunnel.' },
        { dayNumber: 7, title: 'Buffer / rest day', description: 'Old Manali walks. Mall road avoidance.' },
      ],
      spots: [
        { dayNumber: 1, spotOrder: 1, name: 'Atal Tunnel north portal', category: 'transit', lat: 32.3766, lng: 77.2330, stopType: 'viewpoint', durationMinutes: 20, creatorNote: 'Stop on the north side for the first proper Lahaul valley shot.' },
        { dayNumber: 1, spotOrder: 2, name: 'Sissu monastery & Chandra falls', category: 'sight', lat: 32.4795, lng: 77.1247, thumbnailId: 'photo-1626621341517-bbf3d9990a23', stopType: 'viewpoint', durationMinutes: 60 },
        { dayNumber: 1, spotOrder: 3, name: 'Hotel Padma — Jispa', category: 'stay', lat: 32.6183, lng: 77.2031, stopType: 'overnight', creatorNote: 'Family-run, hot bucket water, dinner included. Book direct via WhatsApp.' },
        { dayNumber: 2, spotOrder: 1, name: 'Kunzum Pass (4,551m)', category: 'sight', lat: 32.4061, lng: 77.6403, stopType: 'viewpoint', durationMinutes: 30, creatorNote: 'Three rounds clockwise around the temple — local custom.' },
        { dayNumber: 2, spotOrder: 2, name: 'Losar dhaba (Norbu)', category: 'meal', lat: 32.4395, lng: 77.7522, stopType: 'meal', durationMinutes: 45 },
        { dayNumber: 3, spotOrder: 1, name: 'Key Monastery sunrise', category: 'sight', lat: 32.2982, lng: 78.0119, thumbnailId: 'photo-1599661046289-e31897846e41', stopType: 'viewpoint', durationMinutes: 90, creatorNote: 'Be there by 5:50 a.m. — chants start at 6.' },
        { dayNumber: 3, spotOrder: 2, name: 'Komic village (highest motorable)', category: 'sight', lat: 32.3122, lng: 78.0608, durationMinutes: 60 },
        { dayNumber: 4, spotOrder: 1, name: 'Mudh village (Pin Valley)', category: 'sight', lat: 32.0044, lng: 78.0019, stopType: 'overnight', creatorNote: 'Apricot harvest mid-Sept. Homestay at Konchok\'s house — no signal but excellent thukpa.' },
        { dayNumber: 5, spotOrder: 1, name: 'Chandratal Lake camp', category: 'stay', lat: 32.4763, lng: 77.6219, thumbnailId: 'photo-1506905925346-21bda4d32df4', stopType: 'overnight', creatorNote: 'Camp 2km from the lake — protected zone. Walk in for sunset, again at 4 a.m. for the Milky Way.' },
        { dayNumber: 6, spotOrder: 1, name: 'Batal dhaba (Chacha-Chachi)', category: 'meal', lat: 32.3617, lng: 77.6125, stopType: 'meal', durationMinutes: 45, creatorNote: 'Last warm food for 100 km. Maggi + chai, expect to wait.' },
      ],
      scheduledDates: [21, 35, 49],
      scheduledCapacity: 8,
    },
  },
  {
    creator: 1,
    data: {
      type: 'self_paced_itinerary',
      subCategory: 'travel.road_trips_biking',
      city: C.mumbai,
      title: 'Konkan coast — 4 quiet days from Mumbai',
      description: 'Mumbai → Alibaug → Velas → Diveagar → Ratnagiri.',
      cover: 'photo-1564507592333-c60657eea523',
      durationDays: 4,
      pricing: 'paid',
      pricePaisa: 19900,
      body:
        '## What this itinerary is, and is not\n\nThis is the slow Konkan. Not the Goa-adjacent party route, not the temple-tour pilgrimage circuit. Four days, two thousand kilometres of coastline cut into manageable pieces, three meals a day eaten on plastic chairs facing the sea.\n\n## Best window\n\nLate October to mid-March. Monsoon (Jun–Sep) closes too many of the side roads — pretty but logistically painful. May is humid past the point of pleasure. Velas turtle nesting is mid-Feb to mid-April only — if you can plan for those weeks, do.\n\n## The driving discipline\n\nNH-66 is a real highway now between Mumbai and Karad — boring, fast, fuel-efficient. The actual joy starts when you turn off it. Plan for 30 km/h average on the coastal roads. Phone signal drops between Velas and Guhagar — download offline maps. Roadside food is reliable; bottled water is not — carry a 5L jar.',
      days: [
        { dayNumber: 1, title: 'Mumbai → Alibaug', description: 'NH-66 sunrise drive. Kashid beach evening.' },
        { dayNumber: 2, title: 'Alibaug → Velas', description: 'Olive ridley turtle nesting (Feb–Apr only).' },
        { dayNumber: 3, title: 'Velas → Diveagar → Guhagar', description: 'Aji\'s kitchen lunch. Cliff walks.' },
        { dayNumber: 4, title: 'Ratnagiri & back', description: 'Bhandarkar fort sunset. Drive home via Tamhini.' },
      ],
      spots: [
        { dayNumber: 1, spotOrder: 1, name: 'Mandwa jetty (RoRo ferry)', category: 'transit', lat: 18.8030, lng: 72.9219, stopType: 'viewpoint', durationMinutes: 90, creatorNote: 'Skip the road via Vashi. Take the 90-min ferry — your car comes with you.' },
        { dayNumber: 1, spotOrder: 2, name: 'Kashid beach', category: 'sight', lat: 18.4337, lng: 72.8791, thumbnailId: 'photo-1564507592333-c60657eea523', stopType: 'viewpoint', durationMinutes: 60 },
        { dayNumber: 1, spotOrder: 3, name: 'Saffronstays Murud Bungalow', category: 'stay', lat: 18.3262, lng: 72.9606, stopType: 'overnight' },
        { dayNumber: 2, spotOrder: 1, name: 'Velas turtle festival point', category: 'sight', lat: 17.9619, lng: 73.0306, stopType: 'viewpoint', durationMinutes: 120, creatorNote: 'Mid-Feb to mid-April. Hatching at 6:30 a.m. and 6 p.m. — village volunteers run it.' },
        { dayNumber: 2, spotOrder: 2, name: 'Bankot fort viewpoint', category: 'sight', lat: 17.9978, lng: 73.0438, durationMinutes: 60 },
        { dayNumber: 3, spotOrder: 1, name: "Aji's kitchen — Guhagar", category: 'meal', lat: 17.4842, lng: 73.1908, thumbnailId: 'photo-1606491956689-2ea866880c84', stopType: 'meal', durationMinutes: 90, creatorNote: 'Fixed thali. Three fishes, hot rice, solkadhi. Call ahead — small kitchen, walk-ins occasionally turned away.' },
        { dayNumber: 3, spotOrder: 2, name: 'Diveagar Suvarna Ganesh temple', category: 'sight', lat: 18.1714, lng: 73.0192, durationMinutes: 45 },
        { dayNumber: 4, spotOrder: 1, name: 'Bhandarkar (Ratnadurg) fort sunset', category: 'sight', lat: 16.9817, lng: 73.2542, stopType: 'viewpoint', durationMinutes: 90 },
        { dayNumber: 4, spotOrder: 2, name: 'Tamhini ghat viewpoint (return)', category: 'sight', lat: 18.4267, lng: 73.4181, durationMinutes: 30 },
      ],
      scheduledDates: [10, 24, 45],
      scheduledCapacity: 12,
    },
  },
  {
    creator: 3,
    data: {
      type: 'self_paced_itinerary',
      subCategory: 'travel.trekking_hiking',
      city: C.delhi,
      title: 'Triund + Indrahar Pass — 4 day trek itinerary',
      description: 'Mid-altitude trek for first-timers. Mid-Sept to mid-Nov ideal.',
      cover: 'photo-1551632811-561732d1e306',
      durationDays: 4,
      pricing: 'paid',
      pricePaisa: 35000,
      body:
        '## Who this is for\n\nFirst-time Himalayan trekkers, weekend-fit walkers, anyone who wants the high-altitude experience without committing to a 10-day Roopkund or Kedarkantha. Triund is the gateway. Indrahar adds one real challenge day — a 4,342m pass that asks more from your lungs than your legs.\n\n## Fitness baseline\n\nIf you can walk 8 km on flat ground in under 90 minutes carrying a 6 kg daypack, you are fit enough for Triund. Indrahar wants slightly more — three months of stair-climbing or treadmill incline at 8% twice a week. Cardio matters more than leg strength here.\n\n## Why mid-Sept to mid-Nov\n\nClear skies after monsoon. Snow stays off Indrahar until late November. The post-Diwali week is the photographer\'s window — gold light, no haze. Avoid weekends — Triund gets 200+ trekkers on Saturdays.\n\n## Permits and registration\n\nNo permit for Triund itself. Register at the McLeodganj Forest Office before departure (free, takes 15 min). Indrahar is open without permit but you must trek with a registered guide — list at the same office.',
      days: [
        { dayNumber: 1, title: 'McLeodganj → Triund', description: '9 km steady ascent. Stay in tents.' },
        { dayNumber: 2, title: 'Triund → Snowline', description: 'Acclimatisation hike to Laka Got.' },
        { dayNumber: 3, title: 'Snowline → Indrahar Pass', description: '4,342m crossing. Long day, early start.' },
        { dayNumber: 4, title: 'Descent', description: 'Back to McLeodganj. Local food at Common Ground.' },
      ],
      spots: [
        { dayNumber: 1, spotOrder: 1, name: 'Galu Devi temple trailhead', category: 'transit', lat: 32.2569, lng: 76.3275, stopType: 'viewpoint', durationMinutes: 30, creatorNote: 'Pre-dawn start ideal — 5 a.m. so you summit Triund by 11.' },
        { dayNumber: 1, spotOrder: 2, name: 'Magic View Café', category: 'meal', lat: 32.2625, lng: 76.3458, stopType: 'meal', durationMinutes: 45, creatorNote: 'Halfway. Maggi-and-tea stop. Owner Bhandari-ji has been there 22 years.' },
        { dayNumber: 1, spotOrder: 3, name: 'Triund top campsite', category: 'stay', lat: 32.2647, lng: 76.3672, thumbnailId: 'photo-1551632811-561732d1e306', stopType: 'overnight', creatorNote: 'Tents from Triund Eco Camp. Bring sleeping bag rated to -5°C.' },
        { dayNumber: 2, spotOrder: 1, name: 'Laka Got snowline cave', category: 'sight', lat: 32.2683, lng: 76.3742, durationMinutes: 90, creatorNote: 'Acclimatise at 3,300m for 2 hours. Lunch in the natural cave shelter.' },
        { dayNumber: 3, spotOrder: 1, name: 'Indrahar Pass (4,342m)', category: 'sight', lat: 32.2855, lng: 76.3925, thumbnailId: 'photo-1506905925346-21bda4d32df4', stopType: 'viewpoint', durationMinutes: 60, creatorNote: 'Sunrise summit. Move slowly above 4,000m. Headache normal — turn back if you feel nauseous.' },
        { dayNumber: 4, spotOrder: 1, name: 'Common Ground Café — McLeodganj', category: 'meal', lat: 32.2425, lng: 76.3203, stopType: 'meal', durationMinutes: 90, creatorNote: 'Tibetan momos, hot soup, the best end-of-trek meal in the entire valley.' },
      ],
      scheduledDates: [14, 28, 42, 60],
      scheduledCapacity: 10,
    },
  },
  {
    creator: 8,
    data: {
      type: 'self_paced_itinerary',
      subCategory: 'travel.road_trips_biking',
      city: C.bengaluru,
      title: 'Chikmagalur coffee country — 3 day weekend',
      description: 'Plantations, waterfalls, the Mullayanagiri trek. Friday night start.',
      cover: 'photo-1559329007-40df8a9345d8',
      durationDays: 3,
      pricing: 'paid',
      pricePaisa: 14900,
      body:
        '## The Bangalore weekender that actually rests you\n\nFriday-night drive, Sunday-night return, a quiet Saturday in between. Chikmagalur is six hours by car when the highway is clean, eight when it isn\'t. The trade-off is altitude (Mullayanagiri sits at 1,930m), the coffee plantations, and a rural Karnataka quiet that does not exist anywhere else within range of the city.\n\n## What to skip\n\nThe "popular waterfalls list" online includes Jhari, Sirimane, and Kallhatti. Skip them — overrun, no swimming allowed, mediocre views. Hebbe is the one to spend time at. Mullayanagiri summit is non-negotiable. Everything else is filler.\n\n## Coffee — the actual experience\n\nMost estate tours are a 30-minute walk plus a tasting. Two estates do it differently: Halli Berri (small, family-run, no booking system — just call) and Old Magazine House (BNHS-affiliated, birding-focused, the tour is genuinely educational). Skip the big chain estates.',
      days: [
        { dayNumber: 1, title: 'Bangalore → Chikmagalur', description: 'Drive Friday after work. Stay in a homestay.' },
        { dayNumber: 2, title: 'Mullayanagiri + Hebbe Falls', description: 'Pre-dawn climb. Falls in the afternoon.' },
        { dayNumber: 3, title: 'Coffee tour & drive back', description: 'Estate visit. Late lunch in Sakleshpur.' },
      ],
      spots: [
        { dayNumber: 1, spotOrder: 1, name: 'Maddur — Maddur Tiffanys (highway stop)', category: 'meal', lat: 12.5847, lng: 77.0444, stopType: 'meal', durationMinutes: 30, creatorNote: 'Maddur vada with filter coffee. The original location, not the franchise.' },
        { dayNumber: 1, spotOrder: 2, name: 'Halli Berri Coffee Estate Stay', category: 'stay', lat: 13.3175, lng: 75.7711, thumbnailId: 'photo-1559329007-40df8a9345d8', stopType: 'overnight', creatorNote: 'Family-run, six rooms, no Wi-Fi. Anil and Asha cook three meals a day from the estate kitchen garden.' },
        { dayNumber: 2, spotOrder: 1, name: 'Mullayanagiri summit (1,930m)', category: 'sight', lat: 13.3917, lng: 75.7236, thumbnailId: 'photo-1582719471384-894fbb16e074', stopType: 'viewpoint', durationMinutes: 90, creatorNote: 'Drive to within 200m of summit. Climb the rest. Sunrise from 6:15 — leave the homestay by 5:15 a.m.' },
        { dayNumber: 2, spotOrder: 2, name: 'Hebbe Falls trail', category: 'sight', lat: 13.3917, lng: 75.6750, durationMinutes: 180, creatorNote: '4 km jeep ride + 1 km walk. Cool plunge pool. Best between Sept and Feb.' },
        { dayNumber: 3, spotOrder: 1, name: 'Old Magazine House (birding)', category: 'experience', lat: 13.0975, lng: 75.4583, durationMinutes: 120 },
        { dayNumber: 3, spotOrder: 2, name: 'Sakleshpur — Wilson House Estate Lunch', category: 'meal', lat: 12.9617, lng: 75.7867, stopType: 'meal', durationMinutes: 90 },
      ],
      scheduledDates: [9, 23, 37, 51],
      scheduledCapacity: 12,
    },
  },
  {
    creator: 5,
    data: {
      type: 'self_paced_itinerary',
      subCategory: 'travel.heritage_culture',
      city: C.delhi,
      title: 'Old Delhi heritage walks — a 5-walk circuit',
      description: 'Five mornings, five neighbourhoods. Each walk 3 hours, all on foot.',
      cover: 'photo-1602216056096-3b40cc0c9944',
      durationDays: 5,
      body:
        '## Five walks, five mornings, no group tour\n\nThis is the self-guided version of what professional walking guides charge ₹2500 per head for. I\'ve done each walk a dozen times solo and a hundred more leading friends. Each one takes 3 hours, ends at a chai stall, leaves you with one specific feeling about the city.\n\n## Why mornings\n\nDelhi is at its kindest before 9 a.m. Light is gold, traffic is sparse, the muezzin\'s call is uncrowded by other sounds. Most of these neighbourhoods are also quieter — the shops open at 10 — so you can hear the architecture.\n\n## What to wear\n\nClosed shoes — the lanes are slippery. Modest clothing for the dargah and mosque visits (cover head + shoulders + knees). A scarf doubles as a head cover. ₹2,000 in cash — UPI is everywhere but a few of the older shops still don\'t do it.\n\n## What to skip\n\nThe Red Fort. Yes, really. It\'s lost its character to LED lights and tourist crowds. Drive past it; don\'t walk in. Save the entry fee for a chai at a more interesting stop.',
      days: [
        { dayNumber: 1, title: 'Walk 1 — Chandni Chowk dawn', description: 'Jama Masjid sunrise. Karim\'s lane. Khari Baoli.' },
        { dayNumber: 2, title: 'Walk 2 — Daryaganj & Ballimaran', description: 'Ghalib\'s haveli. The press lanes.' },
        { dayNumber: 3, title: 'Walk 3 — Nizamuddin', description: 'Dargah pre-qawwali. Humayun\'s tomb at 4 p.m.' },
        { dayNumber: 4, title: 'Walk 4 — Mehrauli', description: 'Qutub at 7 a.m. before tour buses. Jamali Kamali ruins.' },
        { dayNumber: 5, title: 'Walk 5 — Old Lutyens', description: 'India Gate at 5 a.m. Connaught Place coffee.' },
      ],
      spots: [
        { dayNumber: 1, spotOrder: 1, name: 'Jama Masjid — sunrise', category: 'sight', lat: 28.6507, lng: 77.2334, thumbnailId: 'photo-1602216056096-3b40cc0c9944', stopType: 'viewpoint', durationMinutes: 60, creatorNote: 'Climb the southern minaret if it\'s open (₹100). Best view in Delhi for the Yamuna.' },
        { dayNumber: 1, spotOrder: 2, name: "Karim's hostel street + Al-Jawahar nihari", category: 'meal', lat: 28.6500, lng: 77.2342, stopType: 'meal', durationMinutes: 60 },
        { dayNumber: 1, spotOrder: 3, name: 'Khari Baoli spice market', category: 'sight', lat: 28.6573, lng: 77.2294, durationMinutes: 60, creatorNote: 'Walk before 7 a.m. — wholesale trucks unload, lanes briefly visible. After 9, gridlock.' },
        { dayNumber: 2, spotOrder: 1, name: "Ghalib ki Haveli — Ballimaran", category: 'sight', lat: 28.6557, lng: 77.2233, durationMinutes: 45, creatorNote: 'Free entry. Quiet at 9 a.m. The poet\'s last home — small, contemplative.' },
        { dayNumber: 3, spotOrder: 1, name: "Hazrat Nizamuddin Auliya Dargah", category: 'sight', lat: 28.5917, lng: 77.2419, durationMinutes: 60, creatorNote: 'Thursday qawwali at sunset is essential. Cover your head; remove shoes at the chowk gate.' },
        { dayNumber: 3, spotOrder: 2, name: "Humayun's Tomb (4 p.m. light)", category: 'sight', lat: 28.5933, lng: 77.2507, thumbnailId: 'photo-1599661046289-e31897846e41', stopType: 'viewpoint', durationMinutes: 90 },
        { dayNumber: 4, spotOrder: 1, name: 'Qutub Minar — pre-tour-bus', category: 'sight', lat: 28.5245, lng: 77.1855, stopType: 'viewpoint', durationMinutes: 60, creatorNote: 'Tour buses arrive 9:15. Be at the gate at 6:55. The Iron Pillar in golden light.' },
        { dayNumber: 4, spotOrder: 2, name: 'Jamali Kamali tomb + mosque (Mehrauli ruins)', category: 'sight', lat: 28.5235, lng: 77.1782, durationMinutes: 90 },
        { dayNumber: 5, spotOrder: 1, name: 'India Gate at 5 a.m.', category: 'sight', lat: 28.6129, lng: 77.2295, stopType: 'viewpoint', durationMinutes: 60 },
        { dayNumber: 5, spotOrder: 2, name: 'Connaught Place — Wenger\'s + Indian Coffee House', category: 'meal', lat: 28.6328, lng: 77.2197, stopType: 'meal', durationMinutes: 60 },
      ],
    },
  },
  {
    creator: 6,
    data: {
      type: 'self_paced_itinerary',
      subCategory: 'travel.photo_walks',
      city: C.srinagar,
      title: 'Ladakh photography expedition — 8 day route',
      description: 'Leh, Pangong, Hanle dark sky, Tso Moriri. Built for night photography.',
      cover: 'photo-1506905925346-21bda4d32df4',
      durationDays: 8,
      pricing: 'paid',
      pricePaisa: 89900,
      body:
        '## Built for the camera, not the bucket list\n\nThis is not a Ladakh tour. It is a route designed around the three things only Ladakh can offer photographers: the high-altitude lake reflections at Pangong, the certified dark-sky reserve at Hanle, and the salt flats at Tso Kar. Everything else is a side note.\n\n## Equipment recommendations\n\nA wide fast prime (24mm f/1.4 or 14mm f/1.8) for night skies. A 70-200mm zoom for compressed mountain shots. Tripod that can handle wind — the cheap travel ones won\'t. Spare batteries kept in your jacket pocket — the cold drains them in minutes. ND filters for daylight long exposures over the lakes.\n\n## Permits — the strict version\n\nInner Line Permit needed for Pangong, Hanle, Tso Moriri. Get it in Leh on day 1 — open 9 a.m., closes 3 p.m. Bring two passport copies and two passport photos. ₹400 per head. The Hanle observatory needs a separate permission via email at least 2 weeks before — bookable through the IIA Bangalore office.\n\n## Acclimatisation is non-negotiable\n\nDay 1 you do nothing. Day 2 you do a low-elevation drive. Day 3 you go high. Skip steps and you spend day 5 in a hospital. There is no glory in pushing through altitude sickness.',
      days: [
        { dayNumber: 1, title: 'Arrive Leh', description: 'Acclimatise. Shanti stupa sunset only.' },
        { dayNumber: 2, title: 'Sham Valley', description: 'Magnetic hill, Sangam, Likir monastery.' },
        { dayNumber: 3, title: 'Leh → Pangong', description: 'Chang La crossing. Shoot at golden hour.' },
        { dayNumber: 4, title: 'Pangong → Hanle', description: '7-hour drive via Loma. Inner-line permit needed.' },
        { dayNumber: 5, title: 'Hanle dark sky', description: 'Indian Astronomical Observatory. Milky Way shoot.' },
        { dayNumber: 6, title: 'Hanle → Tso Moriri', description: 'High desert. Korzok village stay.' },
        { dayNumber: 7, title: 'Tso Moriri → Leh', description: 'Via Tso Kar. Salt flats.' },
        { dayNumber: 8, title: 'Buffer / departure', description: 'Local market. Flight home.' },
      ],
      spots: [
        { dayNumber: 1, spotOrder: 1, name: 'Shanti Stupa sunset', category: 'sight', lat: 34.1700, lng: 77.5783, stopType: 'viewpoint', durationMinutes: 60, creatorNote: 'No exertion day 1. Drive up, shoot golden hour, eat early, sleep.' },
        { dayNumber: 2, spotOrder: 1, name: 'Magnetic Hill', category: 'sight', lat: 34.2117, lng: 77.3406, durationMinutes: 30 },
        { dayNumber: 2, spotOrder: 2, name: 'Sangam (Indus + Zanskar confluence)', category: 'sight', lat: 34.1750, lng: 77.3094, stopType: 'viewpoint', durationMinutes: 45, creatorNote: 'Two-river colour difference visible from late spring through autumn.' },
        { dayNumber: 3, spotOrder: 1, name: 'Chang La pass (5,360m)', category: 'transit', lat: 33.9817, lng: 77.7878, stopType: 'viewpoint', durationMinutes: 20, creatorNote: 'Don\'t linger above 5,000m — high altitude headaches start within 20 minutes.' },
        { dayNumber: 3, spotOrder: 2, name: 'Pangong Tso — sunset shoot', category: 'sight', lat: 33.7575, lng: 78.6358, thumbnailId: 'photo-1626621341517-bbf3d9990a23', stopType: 'viewpoint', durationMinutes: 120, creatorNote: 'Spangmik village viewpoint. Lake colours shift from teal to ink-blue as light drops.' },
        { dayNumber: 4, spotOrder: 1, name: 'Loma checkpoint (ILP check)', category: 'transit', lat: 33.7000, lng: 78.6189, durationMinutes: 30 },
        { dayNumber: 5, spotOrder: 1, name: 'Indian Astronomical Observatory — Hanle', category: 'experience', lat: 32.7794, lng: 78.9647, thumbnailId: 'photo-1506905925346-21bda4d32df4', stopType: 'viewpoint', durationMinutes: 240, creatorNote: 'Designated dark-sky reserve. New moon dates only — confirm before booking. Milky Way shots typically 25s f/1.8 ISO 3200.' },
        { dayNumber: 6, spotOrder: 1, name: 'Korzok village monastery', category: 'sight', lat: 32.9856, lng: 78.2956, durationMinutes: 60 },
        { dayNumber: 7, spotOrder: 1, name: 'Tso Kar salt flats', category: 'sight', lat: 33.3267, lng: 78.0083, stopType: 'viewpoint', durationMinutes: 90 },
      ],
      scheduledDates: [30, 60, 90],
      scheduledCapacity: 6,
    },
  },
  {
    creator: 7,
    data: {
      type: 'self_paced_itinerary',
      subCategory: 'travel.road_trips_biking',
      city: C.mumbai,
      title: 'Mumbai → Tarkarli — long weekend (3 days)',
      description: 'Scuba, silver beach, Amboli ghat. Friday-night drive supported.',
      cover: 'photo-1602216056096-3b40cc0c9944',
      durationDays: 3,
      pricing: 'paid',
      pricePaisa: 12900,
      body:
        '## Why Tarkarli, not Goa\n\nTarkarli is what Goa was 25 years ago — clear water, white-sand bays, no shacks blasting Sunday brunch playlists. The MTDC ferry connects you to Devbagh\'s "silver beach" (named for actual silver-coloured sand). The scuba operations here are legitimate, the local seafood is uncomplicated, and you can drive back via the Amboli ghat for one of Maharashtra\'s most underrated viewpoints.\n\n## The drive logistics\n\nFriday-night drive (10 p.m. onwards) gives you a clear NH-66 down to Ratnagiri. Sleep at MTDC Tarkarli boathouse if you can book it; alternatives at Atithi Bamboo Cottages. The drive back via Amboli is 8 hours but adds the only mountain-pass scenery to an otherwise coastal trip — worth the extra km.\n\n## Scuba in Tarkarli — what to expect\n\nIIDS and Tarkarli Scuba Club run the legitimate operations. ₹1,200–1,500 for a 30-minute beginner dive, certified instructors, basic equipment. Visibility 8–12m most of the year, drops to 3m post-monsoon. October to May is the window. Don\'t book the cheaper "snorkel + dive" combo — the snorkel part is forgettable.',
      days: [
        { dayNumber: 1, title: 'Mumbai → Tarkarli', description: '12 hour overnight drive via Ratnagiri.' },
        { dayNumber: 2, title: 'Sindhudurg + Devbagh', description: 'Scuba in the morning. Silver beach evening.' },
        { dayNumber: 3, title: 'Drive back via Amboli', description: 'Sunset at Amboli ghat. Late dinner in Pune.' },
      ],
      spots: [
        { dayNumber: 1, spotOrder: 1, name: 'Chiplun — Yashwant Lunch Home', category: 'meal', lat: 17.5375, lng: 73.5128, stopType: 'meal', durationMinutes: 60, creatorNote: 'Halfway stop. Solkadhi + thali. Open till midnight.' },
        { dayNumber: 1, spotOrder: 2, name: 'MTDC Tarkarli boathouse', category: 'stay', lat: 16.0050, lng: 73.4581, thumbnailId: 'photo-1564507592333-c60657eea523', stopType: 'overnight', creatorNote: 'Book 30+ days ahead via mtdc.co. Stilted houseboats over backwater.' },
        { dayNumber: 2, spotOrder: 1, name: 'Sindhudurg fort (boat from Malvan)', category: 'sight', lat: 16.0436, lng: 73.4592, stopType: 'viewpoint', durationMinutes: 180, creatorNote: 'Shivaji-era island fort. Boats run hourly from Malvan jetty 6 a.m. – 5 p.m.' },
        { dayNumber: 2, spotOrder: 2, name: 'Devbagh silver beach (sunset)', category: 'sight', lat: 16.0011, lng: 73.4419, stopType: 'viewpoint', durationMinutes: 90 },
        { dayNumber: 3, spotOrder: 1, name: 'Amboli ghat viewpoint (sunset)', category: 'sight', lat: 15.9514, lng: 74.0028, thumbnailId: 'photo-1626621341517-bbf3d9990a23', stopType: 'viewpoint', durationMinutes: 60, creatorNote: 'Western Ghats meet the sea horizon. Best from October through Feb.' },
      ],
      scheduledDates: [12, 26, 40],
      scheduledCapacity: 10,
    },
  },
  {
    creator: 4,
    data: {
      type: 'self_paced_itinerary',
      subCategory: 'travel.food_trails',
      city: C.chennai,
      title: 'Tamil temple food trail — 5 days',
      description: 'Madurai, Kumbakonam, Thanjavur, Chettinad. Filter coffee included.',
      cover: 'photo-1606491956689-2ea866880c84',
      durationDays: 5,
      pricing: 'paid',
      pricePaisa: 24900,
      body:
        '## Five days, four kitchens, one filter coffee circuit\n\nThe Tamil food map is more layered than any other state in India. Madurai is the snack capital, Chettinad is the spice mansion, Thanjavur is the thali sanctum, Kumbakonam is the filter-coffee laboratory. Five days is the minimum to taste each properly.\n\n## What you eat, where, and why\n\n**Madurai — jigarthanda + parotta.** The dessert was invented at Famous Jigarthanda (1977). Don\'t go to Murugan Idli first — they\'re a chain now and the original recipe is at the original Madurai location.\n\n**Chettinad — mansion lunches.** Two options: a stay at Visalam (Chettinadu Mansion, 1939) or a day-long lunch at Bangala Hotel. Both serve the seven-course Chettiar meal. Pre-booking required, walk-ins refused.\n\n**Thanjavur — Marathi Bhavan thali.** Brihadeeswara temple in the morning, lunch at the bhavan. Banana leaf, twelve dishes, ₹120 since 2018.\n\n**Kumbakonam — three coffee shops, no advice on order.** Have one each at Mami\'s, Murali Café, and the unnamed cart at the Mahamaham tank gate. Form your own taste.',
      days: [
        { dayNumber: 1, title: 'Chennai → Madurai', description: 'Meenakshi temple. Jigarthanda for dessert.' },
        { dayNumber: 2, title: 'Madurai → Chettinad', description: 'Mansion lunches. Kaaraikudi market.' },
        { dayNumber: 3, title: 'Chettinad → Thanjavur', description: 'Brihadeeswara temple. Marathi Bhavan thali.' },
        { dayNumber: 4, title: 'Kumbakonam', description: 'Filter coffee circuit. Mahamaham tank.' },
        { dayNumber: 5, title: 'Drive to Pondicherry & flight home', description: 'Auroville coffee. Departure.' },
      ],
      spots: [
        { dayNumber: 1, spotOrder: 1, name: 'Meenakshi temple — east tower entry', category: 'sight', lat: 9.9195, lng: 78.1193, stopType: 'viewpoint', durationMinutes: 120, creatorNote: 'Phones not allowed inside. Cover legs and shoulders. Best pre-7 a.m.' },
        { dayNumber: 1, spotOrder: 2, name: 'Famous Jigarthanda — original Madurai', category: 'meal', lat: 9.9252, lng: 78.1198, stopType: 'meal', durationMinutes: 30, creatorNote: 'Almond pistachio milk dessert with kulfi. ₹95. Original recipe since 1977.' },
        { dayNumber: 2, spotOrder: 1, name: 'Bangala Hotel — Chettinad seven-course lunch', category: 'meal', lat: 10.0697, lng: 78.7842, thumbnailId: 'photo-1606491956689-2ea866880c84', stopType: 'meal', durationMinutes: 150, creatorNote: 'Pre-book by phone, no walk-ins. Authentic Chettiar non-veg + veg thali. ₹950 per head.' },
        { dayNumber: 2, spotOrder: 2, name: 'Kanadukathan Chettinad mansion district', category: 'sight', lat: 10.0875, lng: 78.7861, durationMinutes: 90 },
        { dayNumber: 3, spotOrder: 1, name: 'Brihadeeswara temple — Thanjavur', category: 'sight', lat: 10.7825, lng: 79.1316, stopType: 'viewpoint', durationMinutes: 90 },
        { dayNumber: 3, spotOrder: 2, name: 'Marathi Bhavan thali', category: 'meal', lat: 10.7867, lng: 79.1419, stopType: 'meal', durationMinutes: 60 },
        { dayNumber: 4, spotOrder: 1, name: 'Mami\'s coffee — Kumbakonam', category: 'meal', lat: 10.9617, lng: 79.3947, stopType: 'meal', durationMinutes: 30 },
        { dayNumber: 4, spotOrder: 2, name: 'Mahamaham tank', category: 'sight', lat: 10.9583, lng: 79.3956, durationMinutes: 45 },
        { dayNumber: 5, spotOrder: 1, name: 'Auroville visitor centre + Café des Arts', category: 'meal', lat: 12.0067, lng: 79.8108, stopType: 'meal', durationMinutes: 90 },
      ],
      scheduledDates: [15, 32, 48, 65],
      scheduledCapacity: 8,
    },
  },
  {
    creator: 1,
    data: {
      type: 'self_paced_itinerary',
      subCategory: 'travel.heritage_culture',
      city: C.jaipur,
      title: 'Rajasthan circuit — Jaipur → Jodhpur → Jaisalmer → Udaipur',
      description: '12 days through the golden triangle extended. Hidden stepwells, fort dawn walks.',
      cover: 'photo-1477587458883-47145ed94245',
      durationDays: 12,
      pricing: 'paid',
      pricePaisa: 79900,
      body:
        '## The honest 12-day Rajasthan\n\nThe golden triangle (Delhi-Agra-Jaipur) is for first-time international tourists. This circuit is for people who want the depth: stepwells nobody photographs, fort walks at 5 a.m., desert nights at Sam, palace courtyards in Udaipur where the only sound is birds. Twelve days is the minimum — anyone who tells you Rajasthan-in-7 is selling you the wrong trip.\n\n## When to go\n\nMid-October to mid-March. Avoid summer absolutely — daytime hits 47°C in the desert. Late October has Diwali; book accommodation 60 days out. February is cool and quiet, easily the best month.\n\n## Driving vs train\n\nA hired car with driver costs ₹3,500–5,000 per day all-in. Long-distance trains exist but are inefficient given the offbeat stops. Self-drive is possible if you\'re comfortable with horn-discipline traffic. The intercity highways are good; the city interiors are not.\n\n## What\'s special and what\'s overrated\n\n**Special:** Panna Meena Kund (stepwell), Mehrangarh sunrise tour, Sam dunes camp on a moonless night, the Bagore Ki Haveli puppet show. **Overrated:** the elephant ride at Amer (boycott — animal welfare), most of Pushkar (touristy), Mount Abu (one stop, then move on).',
      days: [
        { dayNumber: 1, title: 'Jaipur arrival', description: 'Hawa Mahal at golden hour. LMB lunch.' },
        { dayNumber: 2, title: 'Amer + Panna Meena', description: 'Fort at 6 a.m. Stepwell after.' },
        { dayNumber: 3, title: 'Jaipur to Pushkar', description: 'Sunset at Savitri temple.' },
        { dayNumber: 4, title: 'Pushkar to Jodhpur', description: 'Mehrangarh by night.' },
        { dayNumber: 5, title: 'Jodhpur city walk', description: 'Toorji Ka Jhalra. Indique rooftop.' },
        { dayNumber: 6, title: 'Jodhpur → Osian → Jaisalmer', description: 'Desert sunset.' },
        { dayNumber: 7, title: 'Jaisalmer fort dawn', description: 'Patwon Ki Haveli. Gadsisar sunrise.' },
        { dayNumber: 8, title: 'Sam dunes camp', description: 'Folk music + dinner.' },
        { dayNumber: 9, title: 'Jaisalmer → Mount Abu', description: 'Long driving day.' },
        { dayNumber: 10, title: 'Mount Abu → Udaipur', description: 'Dilwara temples on the way.' },
        { dayNumber: 11, title: 'Udaipur city palace', description: 'Lake Pichola boat sunset.' },
        { dayNumber: 12, title: 'Departure', description: 'Bagore Ki Haveli morning museum.' },
      ],
      spots: [
        { dayNumber: 1, spotOrder: 1, name: 'Hawa Mahal — golden hour facade', category: 'sight', lat: 26.9239, lng: 75.8267, thumbnailId: 'photo-1477587458883-47145ed94245', stopType: 'viewpoint', durationMinutes: 60, creatorNote: 'Best from Wind View Café across the road. Order chai, sit at the second-floor window.' },
        { dayNumber: 2, spotOrder: 1, name: 'Amer Fort — 6 a.m. entry', category: 'sight', lat: 26.9855, lng: 75.8513, durationMinutes: 150, creatorNote: 'Walk up from the bottom. Skip the elephant ride — boycott it on animal welfare grounds.' },
        { dayNumber: 2, spotOrder: 2, name: 'Panna Meena ka Kund (stepwell)', category: 'sight', lat: 26.9931, lng: 75.8553, stopType: 'viewpoint', durationMinutes: 60, creatorNote: 'Free entry. Symmetrical 8-storey stepwell. Best at 8 a.m. before tour groups.' },
        { dayNumber: 3, spotOrder: 1, name: 'Savitri temple ropeway sunset — Pushkar', category: 'sight', lat: 26.4869, lng: 74.5511, stopType: 'viewpoint', durationMinutes: 90 },
        { dayNumber: 4, spotOrder: 1, name: 'Mehrangarh fort by night', category: 'sight', lat: 26.2978, lng: 73.0190, durationMinutes: 120, creatorNote: 'Light show at the eastern fort wall. Last entry 9 p.m.' },
        { dayNumber: 5, spotOrder: 1, name: 'Toorji Ka Jhalra stepwell', category: 'sight', lat: 26.2911, lng: 73.0294, stopType: 'viewpoint', durationMinutes: 60 },
        { dayNumber: 5, spotOrder: 2, name: 'Indique rooftop dinner', category: 'meal', lat: 26.2933, lng: 73.0233, stopType: 'meal', durationMinutes: 90 },
        { dayNumber: 7, spotOrder: 1, name: 'Patwon Ki Haveli', category: 'sight', lat: 26.9131, lng: 70.9133, durationMinutes: 90 },
        { dayNumber: 7, spotOrder: 2, name: 'Gadsisar lake sunrise', category: 'sight', lat: 26.9072, lng: 70.9192, stopType: 'viewpoint', durationMinutes: 60 },
        { dayNumber: 8, spotOrder: 1, name: 'Sam dunes desert camp', category: 'stay', lat: 26.8417, lng: 70.4881, thumbnailId: 'photo-1599661046289-e31897846e41', stopType: 'overnight', creatorNote: 'Pick a moonless night. Folk-music dinner + dune sunset + open-sky sleep.' },
        { dayNumber: 10, spotOrder: 1, name: 'Dilwara Jain temples', category: 'sight', lat: 24.6044, lng: 72.7128, durationMinutes: 90 },
        { dayNumber: 11, spotOrder: 1, name: 'City Palace + Lake Pichola sunset boat', category: 'sight', lat: 24.5764, lng: 73.6803, stopType: 'viewpoint', durationMinutes: 180 },
        { dayNumber: 12, spotOrder: 1, name: 'Bagore Ki Haveli puppet museum', category: 'sight', lat: 24.5803, lng: 73.6839, durationMinutes: 60, creatorNote: 'Evening puppet show is touristy but charming. Morning museum is quieter and worth more.' },
      ],
      scheduledDates: [20, 50, 80],
      scheduledCapacity: 6,
    },
  },
  {
    creator: 4,
    data: {
      type: 'self_paced_itinerary',
      subCategory: 'travel.food_trails',
      city: C.hyderabad,
      title: 'Hyderabad food deep-dive — 3 days',
      description: 'Mehboob ki Mehndi, Charminar Irani, Paradise vs Bawarchi.',
      cover: 'photo-1599661046289-e31897846e41',
      durationDays: 3,
      body:
        '## Three days, two halves of one city\n\nHyderabad is two cities pretending to be one. The old city, which has not really changed since the Asaf Jahis, and the new — Banjara Hills, Jubilee Hills, Hitech City — which keeps reinventing itself every five years. The food maps these two cities differently. Three days lets you eat your way through both.\n\n## The biryani question\n\nParadise (chain), Bawarchi (legendary), Shadab (old-city authority), Shah Ghouse (the dark-horse pick). The internet has fought about this for a decade. There is no winning answer. Try at least three. My loyalty is to Shah Ghouse for breakfast haleem and Bawarchi for an actual evening meal.\n\n## What to skip\n\nThe Ramoji Film City tour. The Hussain Sagar boat ride. Mainly tourist-bus stops. Stick to the food and the heritage; the leisure circuits are forgettable.',
      days: [
        { dayNumber: 1, title: 'Old city circuit', description: 'Charminar bangles. Nimrah chai. Madina lunch.' },
        { dayNumber: 2, title: 'Biryani circuit', description: 'Paradise. Bawarchi. Shadab. The eternal debate.' },
        { dayNumber: 3, title: 'New city + departure', description: 'Hitech filter coffee. Banjara Hills shop.' },
      ],
      spots: [
        { dayNumber: 1, spotOrder: 1, name: 'Charminar dawn', category: 'sight', lat: 17.3616, lng: 78.4747, thumbnailId: 'photo-1599661046289-e31897846e41', stopType: 'viewpoint', durationMinutes: 60, creatorNote: 'Climb the southern arch (₹100). Best 6:30 a.m. before bangle shops open.' },
        { dayNumber: 1, spotOrder: 2, name: 'Nimrah Café — Osmania biscuits + chai', category: 'meal', lat: 17.3608, lng: 78.4753, thumbnailId: 'photo-1587474260584-136574528ed5', stopType: 'meal', durationMinutes: 30, creatorNote: '90-year-old café. Osmania biscuit ₹8, chai in brass degh. Skip Charminar Café across the street — newer, less character.' },
        { dayNumber: 1, spotOrder: 3, name: 'Madina Hotel — chicken haleem', category: 'meal', lat: 17.3658, lng: 78.4750, stopType: 'meal', durationMinutes: 60, creatorNote: 'Ramzan-only haleem in season; daily haleem the rest of the year. Different from Pista House — meatier, less wheaty.' },
        { dayNumber: 2, spotOrder: 1, name: 'Bawarchi — Hyderabadi biryani', category: 'meal', lat: 17.4027, lng: 78.4691, stopType: 'meal', durationMinutes: 90, creatorNote: 'RTC Crossroads. Mutton biryani is the order. Don\'t bother with the chicken.' },
        { dayNumber: 2, spotOrder: 2, name: 'Shah Ghouse Café — paaya breakfast', category: 'meal', lat: 17.3611, lng: 78.4753, stopType: 'meal', durationMinutes: 60 },
        { dayNumber: 3, spotOrder: 1, name: 'Banjara Hills coffee circuit (Roastery + The Hideout)', category: 'meal', lat: 17.4159, lng: 78.4467, stopType: 'meal', durationMinutes: 90 },
      ],
    },
  },

  // ─── Scheduled experiences ──────────────────────────────────
  {
    creator: 3,
    data: {
      type: 'scheduled_experience',
      subCategory: 'travel.trekking_hiking',
      city: C.delhi,
      title: 'Sunrise trek to Triund — beginner friendly',
      description: 'Night trek from McLeodganj. Chai at the top as the sun rises over the Dhauladhar.',
      body:
        '## What you\'ll do\n\nWe meet at McLeodganj at 1 a.m., walk the 9 km to Triund through the night, summit by 5:30 a.m., and watch the Dhauladhar light up at sunrise. Hot chai + parathas at the top. Descent at our own pace, back in McLeodganj by 11 a.m.\n\n## Who this is for\n\nFirst-time trekkers and weekend walkers. If you can do a 90-minute uphill walk on flat terrain, you can do this. Pace is unhurried — we stop, we breathe, we talk about the mountains.\n\n## What to bring\n\nWarm layers (it gets to 4°C at the top), headlamp, water bottle (1.5L+), sturdy shoes (hiking boots ideal, sneakers OK if you have grip). Dinner before 11 p.m. recommended. Skip alcohol on the day.\n\n## Group size + safety\n\nMax 12 trekkers per departure. Two certified mountain guides. Headlamps + emergency kit on every trek. Cancellation policy: full refund up to 7 days before; 50% within 7 days; weather-cancellation = full refund or rebook.',
      cover: 'photo-1551632811-561732d1e306',
      pricePaisa: 250000,
      durationMinutes: 600,
      meetingArea: 'McLeodganj main square',
      exactLocation: 'Café 32, Jogiwara Road, McLeodganj — 12 hours before start',
      capacity: 12,
      dates: [14, 21, 28, 35, 42],
    },
  },
  {
    creator: 4,
    data: {
      type: 'scheduled_experience',
      subCategory: 'travel.food_trails',
      city: C.chennai,
      title: 'Pondicherry kitchen tour — 4 hours, 3 homes',
      description: 'A French quarter walk that ends in three Tamil-Creole kitchens.',
      body:
        '## What we eat, where, and why\n\nFour hours, three Pondicherry homes, one slow afternoon. We start at Auroville Bakery for a coffee that resets your palate, then walk the White Town quarter explaining how the French left more than the architecture — they left a way of cooking too.\n\n**House 1 — Mariammal\'s kitchen.** Tamil-Creole grandmother. We sit on her veranda; she makes meen kuzhambu (Pondicherry-style fish curry) while telling you why coconut oil + ghee is the actual local trick.\n\n**House 2 — Auroville organic.** Soumya runs an Auroville-rooted kitchen. Beetroot poriyal, ragi roti, and a 30-minute conversation about why Auroville agriculture is more interesting than its yoga.\n\n**House 3 — Tantra Café family.** Their grandmother + grandkids cook a chai-and-laddoo close. We sit in the courtyard, you ask the questions, they answer in Tamil with English translation.\n\n## What to bring\n\nAn appetite. Modest clothing (covered shoulders + knees for the homes). Cash for the optional ingredient bag (₹500 per head, totally optional). Notebook if you write recipes.\n\n## Capacity + cancellation\n\nMax 8 per tour. Full refund up to 48 hours before. Vegetarian-friendly (advise on booking).',
      cover: 'photo-1599661046289-e31897846e41',
      pricePaisa: 180000,
      durationMinutes: 240,
      meetingArea: 'Auroville Bakery, White Town, Pondicherry',
      exactLocation: 'Specific kitchen address shared 24 hours before',
      capacity: 8,
      dates: [10, 17, 24, 31],
    },
  },
  {
    creator: 5,
    data: {
      type: 'scheduled_experience',
      subCategory: 'travel.heritage_culture',
      city: C.delhi,
      title: 'Old Delhi heritage walk — 3 hours, 11 lanes',
      description: 'A walk through gullies most Delhiites have never seen.',
      body:
        '## The route\n\nThree hours. Eleven lanes. We start at Jama Masjid Gate 3, walk Karim\'s lane (no eating yet — we save that), turn into Suiwalan, cross the Mughal era haveli district, and end at Khari Baoli\'s wholesale corner. You\'ll have walked through 350 years of layered Delhi by the time we stop.\n\n## What you\'ll see\n\n- Mughal merchant havelis from 1680\n- Two functioning chotta-Sufi shrines on backstreets\n- The actual narrow gullies where Ghalib walked\n- Three separate trades — silver, attar (perfume), wholesale spice\n- One quiet corner where the Yamuna used to be visible\n\n## What you\'ll eat\n\nThree stops on the route — chai at a 90-year-old corner, kulfi at the Aminabad cousin shop, and a hot kulcha at the lane-end. ₹150 total budget; tucked into the ticket.\n\n## Walk vs. tour\n\nThis isn\'t a "fact-dump" tour. It\'s a walk where someone who\'s lived here points at things and tells you the story. Bring questions. Wear closed shoes (lanes are slippery). Modest clothing for the dargah stops.\n\n## Capacity + cancellation\n\nMax 15 per walk. Cancel up to 24 hours before for a full refund.',
      cover: 'photo-1602216056096-3b40cc0c9944',
      pricePaisa: 120000,
      durationMinutes: 180,
      meetingArea: 'Jama Masjid Gate 3, Old Delhi',
      exactLocation: 'WhatsApp pinned location 24 h before',
      capacity: 15,
      dates: [7, 14, 21, 28],
    },
  },
  {
    creator: 7,
    data: {
      type: 'scheduled_experience',
      subCategory: 'travel.offbeat_hidden',
      city: C.mumbai,
      title: 'Solo trip planning workshop — Mumbai',
      description: '4-hour weekend workshop. Build your first solo trip in real time.',
      body:
        '## Why this exists\n\nI\'ve done 24 solo trips across India. Every time someone asks me how I plan, I send them three articles and a few apps. This workshop is the actual conversation — four hours, a destination of your choice, and you walk out with a real bookable trip.\n\n## What we\'ll do\n\n**Hour 1.** Pick a destination together. We rule out the bad-fit ones, narrow to two, and commit to one.\n\n**Hour 2.** Skeleton itinerary. Days, not hours. Stays, not Airbnbs. We use my actual booking-decision framework.\n\n**Hour 3.** Logistics — transport, money, safety. The single most-asked question is "is it safe" and the honest answer is "logistics-heavy not danger-heavy" — we work through both.\n\n**Hour 4.** Solo-mode mindset. Eating alone. Talking to strangers. The 80/20 of solo-travel social skills. Coffee + cake.\n\n## Who this is for\n\nFirst-time solo travellers. Doesn\'t matter your age or where you\'re going. If you\'ve been planning a trip for 6 months and never booked it, this is for you.\n\n## What to bring\n\nA laptop or notebook. Your destination shortlist (or come without — we\'ll narrow together). Comfortable clothes. ₹200 cash for coffee + cake.',
      cover: 'photo-1502786129293-79981df4e689',
      pricePaisa: 200000,
      durationMinutes: 240,
      meetingArea: 'Bandra West co-working space',
      exactLocation: 'Address shared on confirmation',
      capacity: 10,
      dates: [14, 28],
    },
  },
  {
    creator: 6,
    data: {
      type: 'scheduled_experience',
      subCategory: 'travel.photo_walks',
      city: C.srinagar,
      title: 'Ladakh dark-sky photography night',
      description: '6-hour night session at Hanle. Equipment guidance, post-processing tutorial.',
      body:
        '## The night\n\n6 hours. Hanle, the world\'s newest designated dark-sky reserve. We meet at 8 p.m., set up tripods at 9, shoot the Milky Way until 1 a.m., post-process together until 2.\n\n## What you\'ll learn\n\n- Astro-photography settings: 25s · f/1.8 · ISO 3200, why and when to deviate\n- The 500 rule (and why I ignore it now)\n- Composition with the Milky Way arch\n- Stacking — single-shot vs. 30-frame stacked, when to use which\n- Lightroom/Darktable basics for raw astro files\n\n## What to bring\n\n- Camera with manual mode (DSLR / mirrorless / phone with manual app all OK)\n- Wide fast prime ideal (24mm f/1.4 or 14mm f/1.8). Kit lens works for learning.\n- Tripod (sturdy — not the carbon ultralight)\n- Spare batteries (cold drains them — keep in your jacket)\n- Layers (it gets to -5°C at 4500m)\n- Headlamp with red-light mode (preserves night vision)\n\n## Pre-requisites\n\nYou must already be acclimatised to Ladakh altitude. We don\'t bring beginners straight up — book a separate Leh acclimatisation day before this.\n\n## Cancellation\n\nFull refund 14 days out. 50% within 14. Weather (cloud cover) cancellation = full reschedule for the next new-moon night.',
      cover: 'photo-1506905925346-21bda4d32df4',
      pricePaisa: 450000,
      durationMinutes: 360,
      meetingArea: 'Hanle village square',
      exactLocation: 'Astronomical observatory access — shared 48 h before',
      capacity: 6,
      dates: [21, 28, 35, 42, 49, 56],
    },
  },
  {
    creator: 8,
    data: {
      type: 'scheduled_experience',
      subCategory: 'travel.food_trails',
      city: C.bengaluru,
      title: 'Coffee plantation morning — Chikmagalur',
      description: '3-hour estate walk + cupping session at a 4th-generation farm.',
      body:
        '## What we do\n\nThree hours. A working coffee estate that\'s been in Anil\'s family since 1947. We start at the seedling nursery, walk through the cherry-bearing arabica blocks, cross to the robusta side, end at the cupping table where we taste 4 roasts blind.\n\n## What you\'ll learn\n\n- The arabica/robusta difference, told properly\n- Why most "estate tours" are bullshit (and what makes ours different)\n- How a coffee gets from the cherry to your cup — actual six-stage process\n- Cupping protocol (how professionals score coffees)\n- The honest answer to "is decaf bad for you"\n\n## What\'s included\n\n- 3-hour walk + tasting\n- 200g of estate-roasted arabica to take home\n- Plantation breakfast (idli + filter coffee + estate honey)\n\n## Logistics\n\nMeet at Chikmagalur main bus stand at 7 a.m. Transport to the estate (15 min) included. Wear closed shoes (the plantation is muddy in the morning). Arrive caffeinated.\n\n## Capacity\n\nMax 12 per session. Friday/Saturday/Sunday departures. Cancel up to 48h before for full refund.',
      cover: 'photo-1559329007-40df8a9345d8',
      pricePaisa: 150000,
      durationMinutes: 180,
      meetingArea: 'Chikmagalur main bus stand',
      exactLocation: 'Estate gate location shared 24 h before',
      capacity: 12,
      dates: [7, 14, 21, 28, 35],
    },
  },

  // ─── Events ─────────────────────────────────────────────────
  {
    creator: 7,
    data: {
      type: 'event',
      subCategory: 'travel.photo_walks',
      city: C.mumbai,
      title: 'Monsoon photo walk · Bandra',
      description: 'A free 2-hour walk through wet Bandra. Bring a waterproof bag.',
      body:
        '## What this is\n\nA two-hour photo walk through Bandra during peak monsoon. Free, casual, low-stakes. We meet at Bandstand promenade, walk Mount Mary lanes, end at Carter Road for chai and photo-sharing.\n\n## What to bring\n\n- A camera you\'re happy to risk in light rain (phone is fine — most of us bring phones)\n- A small dry-bag or zip-lock for the camera\n- Closed shoes — the lanes get slippery\n- A poncho > umbrella (umbrella in monsoon Mumbai = fight with the wind)\n\n## Format\n\nUnstructured. We walk together but you stop where you want. After 2 hours we settle at Carter Road, swap photos, and trade Lightroom tips informally.\n\n## RSVP\n\nFree event, RSVP only so we know how big the group is. Cancel if you can\'t make it (someone on waitlist will appreciate).',
      cover: 'photo-1599661046289-e31897846e41',
      venue: 'Bandstand promenade',
      venueAddress: 'Bandra West, Mumbai',
      startsInDays: 5,
      durationHours: 2,
      capacity: 40,
      isFree: true,
    },
  },
  {
    creator: 4,
    data: {
      type: 'event',
      subCategory: 'travel.food_trails',
      city: C.bengaluru,
      title: 'Bangalore filter coffee meetup · 5 cafés in 1 morning',
      description: 'A free walk-tour. Buy your own coffee, share notes, swap recommendations.',
      body:
        '## The route\n\nFive Bangalore filter-coffee institutions in one morning. We walk between them when we can, take auto when the lanes don\'t cooperate. 7 a.m. to 10 a.m.\n\n**Stop 1.** Brahmin\'s Coffee Bar, Shankarapuram — opens 7. The classic; foam-on-decoction perfectly balanced.\n\n**Stop 2.** CTR (Central Tiffin Room), Malleshwaram — coffee + a benne masala dosa for the buffer.\n\n**Stop 3.** Veena Stores, Malleshwaram — 100m down the road. Different coffee technique entirely.\n\n**Stop 4.** Vidyarthi Bhavan, Gandhi Bazaar — by far the most-photographed; the queue is part of the experience.\n\n**Stop 5.** Asha Sweets — the wildcard. Decaf-style, more chicory.\n\n## Format\n\nFree event. Buy your own coffee at each stop (~₹40 each = ₹200 total). RSVP so we keep the group walkable (max 25).',
      cover: 'photo-1495474472287-4d71bcdd2085',
      venue: 'Brahmin\'s Coffee Bar, Shankarapuram',
      venueAddress: '15 Ranga Rao Road, Shankarapuram, Bengaluru',
      startsInDays: 9,
      durationHours: 3,
      capacity: 25,
      isFree: true,
    },
  },
  {
    creator: 5,
    data: {
      type: 'event',
      subCategory: 'travel.heritage_culture',
      city: C.delhi,
      title: 'Sufi qawwali at Nizamuddin — group attend',
      description: 'Thursday evening dargah qawwali. We meet at 5:30 p.m. at the entrance.',
      body:
        '## The qawwali\n\nThursday evening at Hazrat Nizamuddin Auliya Dargah is the longest-running open-air sufi qawwali in Delhi. The Nizami brothers — direct descendants of the dargah\'s original musicians — sing for two hours. Free entry.\n\n## What we do\n\nMeet at 5:30 p.m. at the dargah\'s east gate. We walk the gully together (it\'s easy to get lost the first time), find a spot near the qawwals, and sit. Qawwali starts around 6.\n\n## What to wear\n\nCover your head (scarf, dupatta, or any cap). Cover your shoulders + knees. Remove shoes before entering. ₹20 in cash for the shoe-keeper. Bring a small rupee donation for the qawwals if you can.\n\n## Etiquette\n\nDon\'t take flash photos. Quiet phones. Stand for the salaam at the start. Don\'t leave during a particular phrase the qawwals call out — the local crowd notices.\n\n## RSVP cap\n\nMax 20. Free, but RSVP so I can find you near the gate.',
      cover: 'photo-1567427017947-545c5f8d16ad',
      venue: 'Hazrat Nizamuddin Dargah',
      venueAddress: 'Nizamuddin West, New Delhi',
      startsInDays: 3,
      durationHours: 3,
      capacity: 20,
      isFree: true,
    },
  },
  {
    creator: 1,
    data: {
      type: 'event',
      subCategory: 'stories.personal',
      city: C.mumbai,
      title: 'Sunday slow brunch · Bandra',
      description: 'A monthly slow brunch for travel writers. Bring a story to share.',
      body:
        '## The format\n\nMonthly. Sunday. 11 a.m. to 3 p.m. The Pantry, Kala Ghoda. We sit, we eat, we read each other\'s travel writing. No PowerPoints, no panels, no networking-speak. Just food and stories.\n\n## What you bring\n\nOne piece of travel writing. Yours. Anything from 200 words to 2,000 — we\'ll only have time for ~6 readings so prepare for the possibility you read aloud.\n\n## Who comes\n\nMix of working travel writers, journalists, people who keep a Substack, and a few who just write in their notebooks. Everyone\'s welcome. We\'ve had a pediatrician who writes the best Konkan-coast travel essays I\'ve read.\n\n## What\'s included\n\n- Brunch (₹950 per head — covers food + drinks)\n- A copy of one favourite-piece I\'m reading that month\n\n## Cap\n\n18 seats. Pre-payment required (helps me commit to the venue).',
      cover: 'photo-1564507592333-c60657eea523',
      venue: 'The Pantry',
      venueAddress: 'Kala Ghoda, Fort, Mumbai',
      startsInDays: 12,
      durationHours: 4,
      capacity: 18,
      isFree: false,
    },
  },
  {
    creator: 3,
    data: {
      type: 'event',
      subCategory: 'travel.trekking_hiking',
      city: C.delhi,
      title: 'Kedarkantha winter trek meetup',
      description: 'Group sign-up evening. Plan the Dec 2026 expedition together.',
      body:
        '## What this is\n\nA pre-trek meetup for people who\'ve signed up — or are thinking about signing up — for the Dec 2026 Kedarkantha winter trek. We meet, we plan, we figure out who\'s sharing transport from Dehradun, who\'s bringing what gear.\n\n## What we cover\n\n- Itinerary walkthrough (5 days, Sankri → Juda ka Talab → Kedarkantha base → summit → descent)\n- Gear list (the ten things people forget; the five things you don\'t need)\n- Fitness baseline (be honest about your level — we\'ll calibrate as a group)\n- Logistics — Dehradun ↔ Sankri taxi sharing, food, who\'s done it before\n- Q&A with two people who\'ve done it twice\n\n## What to bring\n\nNothing. A notebook if you want. Beer\'s on me.\n\n## Format\n\n2 hours. Antisocial in HKV — back patio. Casual.',
      cover: 'photo-1551632811-561732d1e306',
      venue: 'Antisocial Hauz Khas Village',
      venueAddress: 'Hauz Khas Village, New Delhi',
      startsInDays: 8,
      durationHours: 2,
      capacity: 30,
      isFree: true,
    },
  },
]

// ── Helpers ─────────────────────────────────────────────────────────
function resolvePricing(d: Seed): 'free' | 'paid' {
  if ('pricing' in d && d.pricing) return d.pricing
  if ('pricePaisa' in d && d.pricePaisa && d.pricePaisa > 0) return 'paid'
  return 'free'
}

function isoDays(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString()
}
function dateOnlyDays(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

// City lat/lngs for meeting_points + event_occurrences (PostGIS POINT).
const cityCoords: Record<string, [number, number]> = {
  [C.delhi]: [77.209, 28.6139],
  [C.mumbai]: [72.8777, 19.076],
  [C.bengaluru]: [77.5946, 12.9716],
  [C.hyderabad]: [78.4867, 17.385],
  [C.pune]: [73.8567, 18.5204],
  [C.jaipur]: [75.7873, 26.9124],
  [C.chennai]: [80.2707, 13.0827],
  [C.kolkata]: [88.3639, 22.5726],
  [C.ahmedabad]: [72.5714, 23.0225],
  [C.varanasi]: [82.9739, 25.3176],
  [C.agra]: [78.0081, 27.1767],
  [C.srinagar]: [74.7973, 34.0837],
  [C.lucknow]: [80.9462, 26.8467],
  [C.bhopal]: [77.4126, 23.2599],
  [C.indore]: [75.8577, 22.7196],
  [C.nashik]: [73.7898, 19.9975],
  [C.thane]: [72.9781, 19.2183],
  [C.vadodara]: [73.2081, 22.3072],
}
function pointWKT(cityId: string): string {
  const c = cityCoords[cityId] ?? cityCoords[C.delhi]
  if (!c) throw new Error(`No coords for city ${cityId}`)
  return `SRID=4326;POINT(${String(c[0])} ${String(c[1])})`
}

// ── Main ────────────────────────────────────────────────────────────
async function wipe() {
  console.log('▸ wiping previous seed content (Postgres UUID rejects LIKE — using explicit lists)')

  const allCreatorIds = creators.map((c) => c.id)
  const allContentIds = seeds.map((_, i) => contentId(i + 1))
  // Legacy IDs from the older seed_content.sql so a fresh seed clears them too.
  const legacyContentIds = [
    'c0000001-0001-0001-0001-000000000001',
    'c0000001-0001-0001-0001-000000000002',
    'c0000001-0001-0001-0001-000000000003',
    'c0000001-0001-0001-0001-000000000004',
    'c0000001-0001-0001-0001-000000000005',
    'c0000002-0002-0002-0002-000000000001',
    'c0000002-0002-0002-0002-000000000002',
    'c0000002-0002-0002-0002-000000000003',
    'c0000003-0003-0003-0003-000000000001',
    'c0000003-0003-0003-0003-000000000002',
    'c0000004-0004-0004-0004-000000000001',
    'c0000004-0004-0004-0004-000000000002',
    'c0000004-0004-0004-0004-000000000003',
    'c0000004-0004-0004-0004-000000000004',
  ]
  // E5.2/BUG-003: BDD test rows that leaked into prod DB and never cleaned up.
  // Use placehold.co cover URLs which Next.js rejects → console errors on every
  // page that surfaces them. Wipe explicitly each seed run.
  const leakedTestRowIds = [
    '08f0e56e-fe13-4655-9759-70111b5324fb',
    '7ddadffb-7913-4eb6-a873-f26d1b28dac2',
    'cc9408b6-da31-4fd0-866d-42267bdf0d9f',
  ]

  // Auto-discovery: every additional row that's clearly E2E suite output —
  // either authored by the dedicated E2E user, or whose title starts with the
  // E2E suite's "E2E Test " prefix.
  const E2E_TEST_USER_ID = '02ac1a6b-5f4d-4817-8a64-aa5acd611c05'
  const { data: e2eByUser } = await supabase
    .from('content')
    .select('id')
    .eq('user_id', E2E_TEST_USER_ID)
  const { data: e2eByTitle } = await supabase
    .from('content')
    .select('id')
    .ilike('title', 'E2E Test%')
  const e2eIds = [...(e2eByUser ?? []), ...(e2eByTitle ?? [])].map((r) => r.id as string)

  // Abandoned drafts — null or empty titles. Safe to wipe; if they were
  // intentional drafts the author can re-create them.
  const { data: nullTitle } = await supabase.from('content').select('id').is('title', null)
  const { data: emptyTitle } = await supabase.from('content').select('id').eq('title', '')
  const orphanIds = [...(nullTitle ?? []), ...(emptyTitle ?? [])].map((r) => r.id as string)

  const allIds = [
    ...allContentIds,
    ...legacyContentIds,
    ...leakedTestRowIds,
    ...e2eIds,
    ...orphanIds,
  ]
  if (e2eIds.length > 0 || orphanIds.length > 0) {
    console.log(
      `  · auto-discovered: ${String(e2eIds.length)} E2E rows + ${String(orphanIds.length)} orphan/empty-title rows to clean`,
    )
  }

  const inner = [
    'content_media',
    'event_occurrences',
    'meeting_points',
    'scheduled_dates',
    'itinerary_spots',
    'itinerary_days',
  ]
  for (const t of inner) {
    const { error } = await supabase.from(t).delete().in('content_id', allIds)
    if (error) console.warn(`  ! ${t}: ${error.message}`)
  }

  // itinerary_spots is parent → child (itinerary_days), so delete via the days first.
  const { data: dayRows } = await supabase
    .from('itinerary_days')
    .select('id')
    .in('content_id', allIds)
  const dayIds = (dayRows ?? []).map((r) => r.id as string)
  if (dayIds.length > 0) {
    await supabase.from('itinerary_spots').delete().in('itinerary_day_id', dayIds)
    await supabase.from('itinerary_days').delete().in('id', dayIds)
  }

  const { error: contErr } = await supabase.from('content').delete().in('id', allIds)
  if (contErr) console.warn(`  ! content: ${contErr.message}`)

  await supabase.from('user_active_verticals').delete().in('user_id', allCreatorIds)
  const { error: userErr } = await supabase.from('users').delete().in('id', allCreatorIds)
  if (userErr) console.warn(`  ! users: ${userErr.message}`)
}

async function insertCreators() {
  console.log(`▸ inserting ${String(creators.length)} creators`)
  const userRows = creators.map((c) => ({
    id: c.id,
    phone: c.phone,
    display_name: c.display_name,
    username: c.username,
    bio: c.bio,
    is_creator: true,
    onboarding_completed_at: new Date().toISOString(),
    avatar_url: `https://i.pravatar.cc/200?u=${c.username}`,
  }))
  const { error: ue } = await supabase.from('users').upsert(userRows, { onConflict: 'id' })
  if (ue) throw ue

  const verticalRows = creators.flatMap((c) =>
    c.verticals.map((v) => ({ user_id: c.id, vertical: v })),
  )
  const { error: ve } = await supabase
    .from('user_active_verticals')
    .upsert(verticalRows, { onConflict: 'user_id,vertical' })
  if (ve) throw ve
}

async function insertContent() {
  console.log(`▸ inserting ${String(seeds.length)} content rows + media`)

  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i]
    if (!s) continue
    const cid = contentId(i + 1)
    const creator = creators[s.creator - 1]
    if (!creator) throw new Error(`creator ${String(s.creator)} not found`)
    const data = s.data

    const baseRow = {
      id: cid,
      user_id: creator.id,
      type: data.type,
      vertical:
        'vertical' in data
          ? data.vertical
          : data.type === 'scheduled_experience' || data.type === 'self_paced_itinerary' || data.type === 'event'
            ? 'travel'
            : 'travel',
      sub_category_id: data.subCategory,
      title: data.title,
      description: data.description,
      status: 'published' as const,
      visibility: 'public' as const,
      pricing_model: resolvePricing(data),
      price_paisa: 'pricePaisa' in data && data.pricePaisa ? data.pricePaisa : 0,
      published_at: isoDays(-Math.floor(Math.random() * 30) - 1),
      starting_city_id: data.city,
      view_count: 200 + Math.floor(Math.random() * 4000),
      like_count: 10 + Math.floor(Math.random() * 200),
      save_count: 5 + Math.floor(Math.random() * 100),
      comment_count: Math.floor(Math.random() * 30),
      ...('body' in data ? { body: data.body } : {}),
      ...('durationDays' in data
        ? { duration_minutes: data.durationDays * 24 * 60 }
        : 'durationMinutes' in data
          ? { duration_minutes: data.durationMinutes }
          : {}),
    }

    const { error: ce } = await supabase.from('content').insert(baseRow)
    if (ce) {
      console.error(`  ✗ content ${data.title}: ${ce.message}`)
      continue
    }

    // Cover image
    const { error: me } = await supabase.from('content_media').insert({
      content_id: cid,
      media_type: 'image',
      url: photo(data.cover),
      display_order: 0,
    })
    if (me) console.error(`  ✗ media for ${data.title}: ${me.message}`)

    // Type-specific extras
    if (data.type === 'self_paced_itinerary') {
      const dayRows = data.days.map((d) => ({
        content_id: cid,
        day_number: d.dayNumber,
        title: d.title,
        description: d.description,
      }))
      const { data: insertedDays, error: de } = await supabase
        .from('itinerary_days')
        .insert(dayRows)
        .select('id, day_number')
      if (de) {
        console.error(`  ✗ days for ${data.title}: ${de.message}`)
      } else if (insertedDays) {
        // ── Itinerary spots — distributed across days by day_number ──
        const dayIdByNumber = new Map<number, string>()
        for (const d of insertedDays) dayIdByNumber.set(d.day_number, d.id)

        const spotRows = data.spots
          .map((sp, idx) => {
            const dayId = dayIdByNumber.get(sp.dayNumber)
            if (!dayId) return null
            return {
              itinerary_day_id: dayId,
              spot_order: sp.spotOrder,
              name: sp.name,
              category: sp.category,
              point: `SRID=4326;POINT(${String(sp.lng)} ${String(sp.lat)})`,
              thumbnail_url: sp.thumbnailId ? photo(sp.thumbnailId) : null,
              creator_note: sp.creatorNote ?? null,
              duration_minutes: sp.durationMinutes ?? null,
              stop_type: sp.stopType ?? 'regular',
              // Day 1 spots auto-preview for paid itineraries (FR-046).
              is_free_preview:
                sp.isFreePreview ?? (sp.dayNumber === 1 && data.pricing === 'paid'),
            }
          })
          .filter((r): r is NonNullable<typeof r> => r !== null)

        if (spotRows.length > 0) {
          const { error: spe } = await supabase.from('itinerary_spots').insert(spotRows)
          if (spe) console.error(`  ✗ spots for ${data.title}: ${spe.message}`)
        }
      }

      // ── Scheduled departure dates for paid itineraries (E5.4/BUG-001) ──
      if (data.pricing === 'paid' && data.scheduledDates && data.scheduledDates.length > 0) {
        const cap = data.scheduledCapacity ?? 8
        const itinDateRows = data.scheduledDates.map((offset) => {
          const start = dateOnlyDays(offset)
          const end = dateOnlyDays(offset + data.durationDays - 1)
          return {
            content_id: cid,
            start_date: start,
            end_date: end,
            capacity: cap,
            spots_booked: Math.floor(Math.random() * Math.floor(cap * 0.4)),
            is_active: true,
          }
        })
        const { error: ide } = await supabase.from('scheduled_dates').insert(itinDateRows)
        if (ide) console.error(`  ✗ scheduled dates for ${data.title}: ${ide.message}`)
      }
    }

    if (data.type === 'scheduled_experience') {
      const dateRows = data.dates.map((offset) => ({
        content_id: cid,
        start_date: dateOnlyDays(offset),
        end_date: dateOnlyDays(offset),
        capacity: data.capacity,
        spots_booked: Math.floor(Math.random() * Math.floor(data.capacity * 0.6)),
        is_active: true,
      }))
      const { error: sde } = await supabase.from('scheduled_dates').insert(dateRows)
      if (sde) console.error(`  ✗ dates for ${data.title}: ${sde.message}`)

      const { error: mpe } = await supabase.from('meeting_points').insert({
        content_id: cid,
        city_id: data.city,
        location_description: data.meetingArea,
        area_point: pointWKT(data.city),
        exact_location: data.exactLocation,
        exact_shared_hours_before: 24,
      })
      if (mpe) console.error(`  ✗ meeting point for ${data.title}: ${mpe.message}`)
    }

    if (data.type === 'event') {
      const startsAt = isoDays(data.startsInDays)
      const endsAt = new Date(
        new Date(startsAt).getTime() + data.durationHours * 60 * 60 * 1000,
      ).toISOString()
      const { error: eoe } = await supabase.from('event_occurrences').insert({
        content_id: cid,
        start_at: startsAt,
        end_at: endsAt,
        timezone: 'Asia/Kolkata',
        venue_name: data.venue,
        venue_address: data.venueAddress,
        venue_point: pointWKT(data.city),
        city_id: data.city,
        capacity: data.capacity,
        spots_booked: Math.floor(Math.random() * Math.floor(data.capacity * 0.7)),
        rsvp_count: Math.floor(Math.random() * data.capacity),
        is_free: data.isFree,
      })
      if (eoe) console.error(`  ✗ occurrence for ${data.title}: ${eoe.message}`)
    }
  }
}

async function counts() {
  const allContentIds = seeds.map((_, i) => contentId(i + 1))
  const { data, error } = await supabase
    .from('content')
    .select('type, starting_city_id')
    .in('id', allContentIds)
  if (error) {
    console.error('count failed:', error.message)
    return
  }
  const types: Record<string, number> = {}
  const cities: Record<string, number> = {}
  for (const r of data ?? []) {
    const tt = r.type as string
    const cc = (r.starting_city_id as string | null) ?? 'unknown'
    types[tt] = (types[tt] ?? 0) + 1
    cities[cc] = (cities[cc] ?? 0) + 1
  }
  console.log(`\n▸ inserted ${String(data?.length ?? 0)} content rows:`)
  for (const [t, c] of Object.entries(types).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${t.padEnd(28)} ${String(c)}`)
  }
  console.log(`\n▸ across ${String(Object.keys(cities).length)} cities:`)
  for (const [c, n] of Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 18)) {
    console.log(`    ${c.padEnd(28)} ${String(n)}`)
  }
}

async function main() {
  console.log('▸ creatorhub dummy content seed\n')
  await wipe()
  await insertCreators()
  await insertContent()
  await counts()
  console.log('\n✓ done\n')
}

main().catch((e) => {
  console.error('seed failed:', e)
  process.exit(1)
})
