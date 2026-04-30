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
interface PostSeed {
  type: 'post'
  city: string
  vertical: 'travel' | 'stories' | 'food'
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
  title: string
  description: string
  cover: string
  durationDays: number
  pricing?: 'free' | 'paid'
  pricePaisa?: number
  days: { dayNumber: number; title: string; description: string }[]
}

interface ExperienceSeed {
  type: 'scheduled_experience'
  city: string
  title: string
  description: string
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
  title: string
  description: string
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
      title: 'The pol houses of Ahmedabad — what the heritage walks miss',
      description: 'Skip the official walk. Get lost in Mandvi-ni-pol on a Tuesday morning.',
      body:
        'The official walks take you through the same six houses. Beautiful, sure. But the magic is the unmaintained ones, the ones where four families share a courtyard and an old chabutra. A Tuesday morning, when the kids are at school and the grandmothers are stringing flowers. Ask one of them if you can sit on the chabutra steps. They will say yes and bring you a glass of water.',
      cover: 'photo-1626621341517-bbf3d9990a23',
    },
  },

  // ─── Itineraries ─────────────────────────────────────────────
  {
    creator: 2,
    data: {
      type: 'self_paced_itinerary',
      city: C.srinagar,
      title: 'Manali to Spiti Valley — 7 day road trip',
      description: 'The complete route with stops, stays, and permits. Tested late-Sept 2025.',
      cover: 'photo-1626621341517-bbf3d9990a23',
      durationDays: 7,
      pricing: 'paid',
      pricePaisa: 49900,
      days: [
        { dayNumber: 1, title: 'Manali → Jispa', description: 'Acclimatise at 3,200m. Light walk to Sissu monastery.' },
        { dayNumber: 2, title: 'Jispa → Kaza via Kunzum', description: 'High pass crossing. Tea at the dhabaa near Losar.' },
        { dayNumber: 3, title: 'Kaza homestay day', description: 'Key Monastery at sunrise. Komic village afternoon.' },
        { dayNumber: 4, title: 'Pin Valley', description: 'Mudh village. Apricot harvest if late Sept.' },
        { dayNumber: 5, title: 'Chandratal', description: 'Camp at the moon lake. Stargazing recommended.' },
        { dayNumber: 6, title: 'Chandratal → Manali', description: 'Long descent via Atal tunnel.' },
        { dayNumber: 7, title: 'Buffer / rest day', description: 'Old Manali walks. Mall road avoidance.' },
      ],
    },
  },
  {
    creator: 1,
    data: {
      type: 'self_paced_itinerary',
      city: C.mumbai,
      title: 'Konkan coast — 4 quiet days from Mumbai',
      description: 'Mumbai → Alibaug → Velas → Diveagar → Ratnagiri.',
      cover: 'photo-1564507592333-c60657eea523',
      durationDays: 4,
      pricing: 'paid',
      pricePaisa: 19900,
      days: [
        { dayNumber: 1, title: 'Mumbai → Alibaug', description: 'NH-66 sunrise drive. Kashid beach evening.' },
        { dayNumber: 2, title: 'Alibaug → Velas', description: 'Olive ridley turtle nesting (Feb–Apr only).' },
        { dayNumber: 3, title: 'Velas → Diveagar → Guhagar', description: 'Aji\'s kitchen lunch. Cliff walks.' },
        { dayNumber: 4, title: 'Ratnagiri & back', description: 'Bhandarkar fort sunset. Drive home via Tamhini.' },
      ],
    },
  },
  {
    creator: 3,
    data: {
      type: 'self_paced_itinerary',
      city: C.delhi,
      title: 'Triund + Indrahar Pass — 4 day trek itinerary',
      description: 'Mid-altitude trek for first-timers. Mid-Sept to mid-Nov ideal.',
      cover: 'photo-1551632811-561732d1e306',
      durationDays: 4,
      pricing: 'paid',
      pricePaisa: 35000,
      days: [
        { dayNumber: 1, title: 'McLeodganj → Triund', description: '9 km steady ascent. Stay in tents.' },
        { dayNumber: 2, title: 'Triund → Snowline', description: 'Acclimatisation hike to Laka Got.' },
        { dayNumber: 3, title: 'Snowline → Indrahar Pass', description: '4,342m crossing. Long day, early start.' },
        { dayNumber: 4, title: 'Descent', description: 'Back to McLeodganj. Local food at Common Ground.' },
      ],
    },
  },
  {
    creator: 8,
    data: {
      type: 'self_paced_itinerary',
      city: C.bengaluru,
      title: 'Chikmagalur coffee country — 3 day weekend',
      description: 'Plantations, waterfalls, the Mullayanagiri trek. Friday night start.',
      cover: 'photo-1559329007-40df8a9345d8',
      durationDays: 3,
      pricing: 'paid',
      pricePaisa: 14900,
      days: [
        { dayNumber: 1, title: 'Bangalore → Chikmagalur', description: 'Drive Friday after work. Stay in a homestay.' },
        { dayNumber: 2, title: 'Mullayanagiri + Hebbe Falls', description: 'Pre-dawn climb. Falls in the afternoon.' },
        { dayNumber: 3, title: 'Coffee tour & drive back', description: 'Estate visit. Late lunch in Sakleshpur.' },
      ],
    },
  },
  {
    creator: 5,
    data: {
      type: 'self_paced_itinerary',
      city: C.delhi,
      title: 'Old Delhi heritage walks — a 5-walk circuit',
      description: 'Five mornings, five neighbourhoods. Each walk 3 hours, all on foot.',
      cover: 'photo-1602216056096-3b40cc0c9944',
      durationDays: 5,
      days: [
        { dayNumber: 1, title: 'Walk 1 — Chandni Chowk dawn', description: 'Jama Masjid sunrise. Karim\'s lane. Khari Baoli.' },
        { dayNumber: 2, title: 'Walk 2 — Daryaganj & Ballimaran', description: 'Ghalib\'s haveli. The press lanes.' },
        { dayNumber: 3, title: 'Walk 3 — Nizamuddin', description: 'Dargah pre-qawwali. Humayun\'s tomb at 4 p.m.' },
        { dayNumber: 4, title: 'Walk 4 — Mehrauli', description: 'Qutub at 7 a.m. before tour buses. Jamali Kamali ruins.' },
        { dayNumber: 5, title: 'Walk 5 — Old Lutyens', description: 'India Gate at 5 a.m. Connaught Place coffee.' },
      ],
    },
  },
  {
    creator: 6,
    data: {
      type: 'self_paced_itinerary',
      city: C.srinagar,
      title: 'Ladakh photography expedition — 8 day route',
      description: 'Leh, Pangong, Hanle dark sky, Tso Moriri. Built for night photography.',
      cover: 'photo-1506905925346-21bda4d32df4',
      durationDays: 8,
      pricing: 'paid',
      pricePaisa: 89900,
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
    },
  },
  {
    creator: 7,
    data: {
      type: 'self_paced_itinerary',
      city: C.mumbai,
      title: 'Mumbai → Tarkarli — long weekend (3 days)',
      description: 'Scuba, silver beach, Amboli ghat. Friday-night drive supported.',
      cover: 'photo-1602216056096-3b40cc0c9944',
      durationDays: 3,
      pricing: 'paid',
      pricePaisa: 12900,
      days: [
        { dayNumber: 1, title: 'Mumbai → Tarkarli', description: '12 hour overnight drive via Ratnagiri.' },
        { dayNumber: 2, title: 'Sindhudurg + Devbagh', description: 'Scuba in the morning. Silver beach evening.' },
        { dayNumber: 3, title: 'Drive back via Amboli', description: 'Sunset at Amboli ghat. Late dinner in Pune.' },
      ],
    },
  },
  {
    creator: 4,
    data: {
      type: 'self_paced_itinerary',
      city: C.chennai,
      title: 'Tamil temple food trail — 5 days',
      description: 'Madurai, Kumbakonam, Thanjavur, Chettinad. Filter coffee included.',
      cover: 'photo-1606491956689-2ea866880c84',
      durationDays: 5,
      pricing: 'paid',
      pricePaisa: 24900,
      days: [
        { dayNumber: 1, title: 'Chennai → Madurai', description: 'Meenakshi temple. Jigarthanda for dessert.' },
        { dayNumber: 2, title: 'Madurai → Chettinad', description: 'Mansion lunches. Kaaraikudi market.' },
        { dayNumber: 3, title: 'Chettinad → Thanjavur', description: 'Brihadeeswara temple. Marathi Bhavan thali.' },
        { dayNumber: 4, title: 'Kumbakonam', description: 'Filter coffee circuit. Mahamaham tank.' },
        { dayNumber: 5, title: 'Drive to Pondicherry & flight home', description: 'Auroville coffee. Departure.' },
      ],
    },
  },
  {
    creator: 1,
    data: {
      type: 'self_paced_itinerary',
      city: C.jaipur,
      title: 'Rajasthan circuit — Jaipur → Jodhpur → Jaisalmer → Udaipur',
      description: '12 days through the golden triangle extended. Hidden stepwells, fort dawn walks.',
      cover: 'photo-1477587458883-47145ed94245',
      durationDays: 12,
      pricing: 'paid',
      pricePaisa: 79900,
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
    },
  },
  {
    creator: 4,
    data: {
      type: 'self_paced_itinerary',
      city: C.hyderabad,
      title: 'Hyderabad food deep-dive — 3 days',
      description: 'Mehboob ki Mehndi, Charminar Irani, Paradise vs Bawarchi.',
      cover: 'photo-1599661046289-e31897846e41',
      durationDays: 3,
      days: [
        { dayNumber: 1, title: 'Old city circuit', description: 'Charminar bangles. Nimrah chai. Madina lunch.' },
        { dayNumber: 2, title: 'Biryani circuit', description: 'Paradise. Bawarchi. Shadab. The eternal debate.' },
        { dayNumber: 3, title: 'New city + departure', description: 'Hitech filter coffee. Banjara Hills shop.' },
      ],
    },
  },

  // ─── Scheduled experiences ──────────────────────────────────
  {
    creator: 3,
    data: {
      type: 'scheduled_experience',
      city: C.delhi,
      title: 'Sunrise trek to Triund — beginner friendly',
      description: 'Night trek from McLeodganj. Chai at the top as the sun rises over the Dhauladhar.',
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
      city: C.chennai,
      title: 'Pondicherry kitchen tour — 4 hours, 3 homes',
      description: 'A French quarter walk that ends in three Tamil-Creole kitchens.',
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
      city: C.delhi,
      title: 'Old Delhi heritage walk — 3 hours, 11 lanes',
      description: 'A walk through gullies most Delhiites have never seen.',
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
      city: C.mumbai,
      title: 'Solo trip planning workshop — Mumbai',
      description: '4-hour weekend workshop. Build your first solo trip in real time.',
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
      city: C.srinagar,
      title: 'Ladakh dark-sky photography night',
      description: '6-hour night session at Hanle. Equipment guidance, post-processing tutorial.',
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
      city: C.bengaluru,
      title: 'Coffee plantation morning — Chikmagalur',
      description: '3-hour estate walk + cupping session at a 4th-generation farm.',
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
      city: C.mumbai,
      title: 'Monsoon photo walk · Bandra',
      description: 'A free 2-hour walk through wet Bandra. Bring a waterproof bag.',
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
      city: C.bengaluru,
      title: 'Bangalore filter coffee meetup · 5 cafés in 1 morning',
      description: 'A free walk-tour. Buy your own coffee, share notes, swap recommendations.',
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
      city: C.delhi,
      title: 'Sufi qawwali at Nizamuddin — group attend',
      description: 'Thursday evening dargah qawwali. We meet at 5:30 p.m. at the entrance.',
      cover: 'photo-1626621341517-bbf3d9990a23',
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
      city: C.mumbai,
      title: 'Sunday slow brunch · Bandra',
      description: 'A monthly slow brunch for travel writers. Bring a story to share.',
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
      city: C.delhi,
      title: 'Kedarkantha winter trek meetup',
      description: 'Group sign-up evening. Plan the Dec 2026 expedition together.',
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
  const allIds = [...allContentIds, ...legacyContentIds]

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
      const { error: de } = await supabase.from('itinerary_days').insert(dayRows)
      if (de) console.error(`  ✗ days for ${data.title}: ${de.message}`)
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
