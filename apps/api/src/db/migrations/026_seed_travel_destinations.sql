-- ═══════════════════════════════════════════════════════════════════
-- Migration 026: Seed Maharashtra/Konkan/Western Ghats destinations
-- Fixes "Diveagar"-style search misses — these popular travel
-- destinations are missing from the main cities seed (which only
-- includes administrative cities) so destination search dies silently.
-- All rows: country='IN', state='Maharashtra' (or 'Goa' where noted),
-- population set to a small default for non-administrative localities.
-- Idempotent: ON CONFLICT DO NOTHING.
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO cities (id, name, state, country, point, population) VALUES
  -- Konkan coast — beach destinations
  ('in.mh.diveagar',     'Diveagar',     'Maharashtra', 'IN', ST_MakePoint(72.9870, 18.1660)::geography, 5000),
  ('in.mh.harihareshwar','Harihareshwar','Maharashtra', 'IN', ST_MakePoint(73.0150, 18.0010)::geography, 4000),
  ('in.mh.shrivardhan',  'Shrivardhan',  'Maharashtra', 'IN', ST_MakePoint(73.0290, 18.0450)::geography, 9000),
  ('in.mh.murud',        'Murud',        'Maharashtra', 'IN', ST_MakePoint(72.9650, 18.3260)::geography, 12000),
  ('in.mh.kashid',       'Kashid',       'Maharashtra', 'IN', ST_MakePoint(72.9050, 18.4170)::geography, 3000),
  ('in.mh.alibaug',      'Alibaug',      'Maharashtra', 'IN', ST_MakePoint(72.8722, 18.6414)::geography, 20743),
  ('in.mh.ganpatipule',  'Ganpatipule',  'Maharashtra', 'IN', ST_MakePoint(73.2670, 17.1450)::geography, 5000),
  ('in.mh.tarkarli',     'Tarkarli',     'Maharashtra', 'IN', ST_MakePoint(73.4720, 16.0270)::geography, 5000),
  ('in.mh.malvan',       'Malvan',       'Maharashtra', 'IN', ST_MakePoint(73.4661, 16.0580)::geography, 18648),
  ('in.mh.vengurla',     'Vengurla',     'Maharashtra', 'IN', ST_MakePoint(73.6363, 15.8597)::geography, 12000),
  ('in.mh.dapoli',       'Dapoli',       'Maharashtra', 'IN', ST_MakePoint(73.1850, 17.7600)::geography, 16000),
  ('in.mh.velneshwar',   'Velneshwar',   'Maharashtra', 'IN', ST_MakePoint(73.2520, 17.5670)::geography, 3000),
  ('in.mh.anjarle',      'Anjarle',      'Maharashtra', 'IN', ST_MakePoint(73.1170, 17.8500)::geography, 3000),
  ('in.mh.guhagar',      'Guhagar',      'Maharashtra', 'IN', ST_MakePoint(73.1900, 17.4830)::geography, 8000),
  ('in.mh.velas',        'Velas',        'Maharashtra', 'IN', ST_MakePoint(73.0420, 17.9620)::geography, 2000),
  ('in.mh.suvarnadurg',  'Suvarnadurg',  'Maharashtra', 'IN', ST_MakePoint(73.1170, 17.8090)::geography, 1000),

  -- Western Ghats — hill stations
  ('in.mh.lonavla',       'Lonavla',       'Maharashtra', 'IN', ST_MakePoint(73.4071, 18.7546)::geography, 56000),
  ('in.mh.khandala',      'Khandala',      'Maharashtra', 'IN', ST_MakePoint(73.3833, 18.7600)::geography, 5000),
  ('in.mh.mahabaleshwar', 'Mahabaleshwar', 'Maharashtra', 'IN', ST_MakePoint(73.6580, 17.9237)::geography, 13000),
  ('in.mh.panchgani',     'Panchgani',     'Maharashtra', 'IN', ST_MakePoint(73.7997, 17.9243)::geography, 13000),
  ('in.mh.tapola',        'Tapola',        'Maharashtra', 'IN', ST_MakePoint(73.6020, 17.8690)::geography, 2000),
  ('in.mh.matheran',      'Matheran',      'Maharashtra', 'IN', ST_MakePoint(73.2700, 18.9870)::geography, 4393),
  ('in.mh.karjat',        'Karjat',        'Maharashtra', 'IN', ST_MakePoint(73.3208, 18.9117)::geography, 30000),
  ('in.mh.igatpuri',      'Igatpuri',      'Maharashtra', 'IN', ST_MakePoint(73.5586, 19.6967)::geography, 11000),
  ('in.mh.bhandardara',   'Bhandardara',   'Maharashtra', 'IN', ST_MakePoint(73.7570, 19.5450)::geography, 2000),
  ('in.mh.amboli',        'Amboli',        'Maharashtra', 'IN', ST_MakePoint(74.0025, 15.9540)::geography, 3000),
  ('in.mh.jawhar',        'Jawhar',        'Maharashtra', 'IN', ST_MakePoint(73.2208, 19.9117)::geography, 12000),
  ('in.mh.tamhini',       'Tamhini',       'Maharashtra', 'IN', ST_MakePoint(73.4060, 18.4280)::geography, 1000),
  ('in.mh.purushwadi',    'Purushwadi',    'Maharashtra', 'IN', ST_MakePoint(74.1380, 19.4640)::geography, 1000),
  ('in.mh.rajmachi',      'Rajmachi',      'Maharashtra', 'IN', ST_MakePoint(73.4270, 18.8340)::geography, 500),
  ('in.mh.vasota',        'Vasota',        'Maharashtra', 'IN', ST_MakePoint(73.7200, 17.5900)::geography, 500),
  ('in.mh.pawna',         'Pawna',         'Maharashtra', 'IN', ST_MakePoint(73.4670, 18.6660)::geography, 2000),
  ('in.mh.kamshet',       'Kamshet',       'Maharashtra', 'IN', ST_MakePoint(73.5400, 18.7530)::geography, 6000),
  ('in.mh.mulshi',        'Mulshi',        'Maharashtra', 'IN', ST_MakePoint(73.5170, 18.5060)::geography, 4000),

  -- Konkan / Sindhudurg / interior
  ('in.mh.ratnagiri',     'Ratnagiri',     'Maharashtra', 'IN', ST_MakePoint(73.3000, 16.9902)::geography, 76229),
  ('in.mh.sindhudurg',    'Sindhudurg',    'Maharashtra', 'IN', ST_MakePoint(73.5670, 16.0367)::geography, 5000),
  ('in.mh.sawantwadi',    'Sawantwadi',    'Maharashtra', 'IN', ST_MakePoint(73.8167, 15.9000)::geography, 26283),
  ('in.mh.chiplun',       'Chiplun',       'Maharashtra', 'IN', ST_MakePoint(73.5117, 17.5333)::geography, 56792),
  ('in.mh.mhasla',        'Mhasla',        'Maharashtra', 'IN', ST_MakePoint(73.1280, 18.1290)::geography, 8000),

  -- Goa popular spots (commonly searched alongside Maharashtra trips)
  ('in.ga.palolem',       'Palolem',       'Goa', 'IN', ST_MakePoint(74.0237, 15.0099)::geography, 5000),
  ('in.ga.arambol',       'Arambol',       'Goa', 'IN', ST_MakePoint(73.7044, 15.6850)::geography, 5000),
  ('in.ga.anjuna',        'Anjuna',        'Goa', 'IN', ST_MakePoint(73.7400, 15.5746)::geography, 9805),
  ('in.ga.morjim',        'Morjim',        'Goa', 'IN', ST_MakePoint(73.7311, 15.6306)::geography, 5000),
  ('in.ga.agonda',        'Agonda',        'Goa', 'IN', ST_MakePoint(73.9889, 15.0411)::geography, 3000),
  ('in.ga.canacona',      'Canacona',      'Goa', 'IN', ST_MakePoint(74.0550, 15.0093)::geography, 14000),

  -- Gujarat trekking
  ('in.gj.saputara',      'Saputara',      'Gujarat',     'IN', ST_MakePoint(73.7500, 20.5667)::geography, 3030)
ON CONFLICT (id) DO NOTHING;
