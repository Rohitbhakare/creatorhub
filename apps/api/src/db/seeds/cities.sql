-- ═══════════════════════════════════════════════════════════════════
-- Seed: Indian Cities (~4000 cities across all states/UTs)
-- Format: INSERT ... ON CONFLICT DO NOTHING (idempotent re-runs)
-- ID format: in.<state_code>.<slug>  (stable, human-readable)
-- Point: ST_MakePoint(longitude, latitude) — note: lon FIRST in PostGIS
-- ═══════════════════════════════════════════════════════════════════

-- ── Maharashtra ─────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.mh.mumbai', 'Mumbai', 'Maharashtra', 'IN', ST_MakePoint(72.8777, 19.0760)::geography, 12442373),
('in.mh.pune', 'Pune', 'Maharashtra', 'IN', ST_MakePoint(73.8567, 18.5204)::geography, 3124458),
('in.mh.nagpur', 'Nagpur', 'Maharashtra', 'IN', ST_MakePoint(79.0882, 21.1458)::geography, 2405421),
('in.mh.thane', 'Thane', 'Maharashtra', 'IN', ST_MakePoint(72.9781, 19.2183)::geography, 1841488),
('in.mh.nashik', 'Nashik', 'Maharashtra', 'IN', ST_MakePoint(73.7898, 19.9975)::geography, 1486053),
('in.mh.aurangabad', 'Aurangabad', 'Maharashtra', 'IN', ST_MakePoint(75.3433, 19.8762)::geography, 1175116),
('in.mh.solapur', 'Solapur', 'Maharashtra', 'IN', ST_MakePoint(75.9064, 17.6599)::geography, 951558),
('in.mh.kolhapur', 'Kolhapur', 'Maharashtra', 'IN', ST_MakePoint(74.2433, 16.7050)::geography, 549283),
('in.mh.amravati', 'Amravati', 'Maharashtra', 'IN', ST_MakePoint(77.7523, 20.9374)::geography, 646801),
('in.mh.navi-mumbai', 'Navi Mumbai', 'Maharashtra', 'IN', ST_MakePoint(73.0169, 19.0330)::geography, 1120547),
('in.mh.sangli', 'Sangli', 'Maharashtra', 'IN', ST_MakePoint(74.5815, 16.8524)::geography, 436639),
('in.mh.jalgaon', 'Jalgaon', 'Maharashtra', 'IN', ST_MakePoint(75.5626, 21.0077)::geography, 460468),
('in.mh.akola', 'Akola', 'Maharashtra', 'IN', ST_MakePoint(77.0082, 20.7002)::geography, 425817),
('in.mh.latur', 'Latur', 'Maharashtra', 'IN', ST_MakePoint(76.5604, 18.3968)::geography, 382754),
('in.mh.dhule', 'Dhule', 'Maharashtra', 'IN', ST_MakePoint(74.7749, 20.9042)::geography, 341755),
('in.mh.ahmednagar', 'Ahmednagar', 'Maharashtra', 'IN', ST_MakePoint(74.7496, 19.0952)::geography, 350859),
('in.mh.chandrapur', 'Chandrapur', 'Maharashtra', 'IN', ST_MakePoint(79.2961, 19.9615)::geography, 321710),
('in.mh.parbhani', 'Parbhani', 'Maharashtra', 'IN', ST_MakePoint(76.7748, 19.2610)::geography, 307152),
('in.mh.ichalkaranji', 'Ichalkaranji', 'Maharashtra', 'IN', ST_MakePoint(74.4613, 16.6912)::geography, 287570),
('in.mh.jalna', 'Jalna', 'Maharashtra', 'IN', ST_MakePoint(75.8816, 19.8347)::geography, 285349),
('in.mh.ambarnath', 'Ambarnath', 'Maharashtra', 'IN', ST_MakePoint(73.1851, 19.1864)::geography, 254140),
('in.mh.bhiwandi', 'Bhiwandi', 'Maharashtra', 'IN', ST_MakePoint(73.0483, 19.2813)::geography, 711329),
('in.mh.panvel', 'Panvel', 'Maharashtra', 'IN', ST_MakePoint(73.1175, 18.9894)::geography, 180464),
('in.mh.satara', 'Satara', 'Maharashtra', 'IN', ST_MakePoint(74.0183, 17.6805)::geography, 120981),
('in.mh.beed', 'Beed', 'Maharashtra', 'IN', ST_MakePoint(75.7571, 18.9891)::geography, 138091),
('in.mh.yavatmal', 'Yavatmal', 'Maharashtra', 'IN', ST_MakePoint(78.1307, 20.3888)::geography, 117466),
('in.mh.osmanabad', 'Osmanabad', 'Maharashtra', 'IN', ST_MakePoint(76.0440, 18.1860)::geography, 113256),
('in.mh.nanded', 'Nanded', 'Maharashtra', 'IN', ST_MakePoint(77.3210, 19.1383)::geography, 550564),
('in.mh.wardha', 'Wardha', 'Maharashtra', 'IN', ST_MakePoint(78.6022, 20.7453)::geography, 112803),
('in.mh.gondia', 'Gondia', 'Maharashtra', 'IN', ST_MakePoint(80.1960, 21.4624)::geography, 132011),
('in.mh.hingoli', 'Hingoli', 'Maharashtra', 'IN', ST_MakePoint(77.1501, 19.7173)::geography, 95890),
('in.mh.washim', 'Washim', 'Maharashtra', 'IN', ST_MakePoint(77.1336, 20.1042)::geography, 75000),
('in.mh.buldhana', 'Buldhana', 'Maharashtra', 'IN', ST_MakePoint(76.1843, 20.5293)::geography, 69785),
('in.mh.ratnagiri', 'Ratnagiri', 'Maharashtra', 'IN', ST_MakePoint(73.3120, 16.9902)::geography, 76239),
('in.mh.sindhudurg', 'Sindhudurg', 'Maharashtra', 'IN', ST_MakePoint(73.6355, 16.3489)::geography, 24850),
('in.mh.mahabaleshwar', 'Mahabaleshwar', 'Maharashtra', 'IN', ST_MakePoint(73.6561, 17.9217)::geography, 12737),
('in.mh.lonavala', 'Lonavala', 'Maharashtra', 'IN', ST_MakePoint(73.4071, 18.7557)::geography, 55000),
('in.mh.alibaug', 'Alibaug', 'Maharashtra', 'IN', ST_MakePoint(72.8682, 18.6414)::geography, 24000)
ON CONFLICT DO NOTHING;

-- ── Delhi NCR ───────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.dl.new-delhi', 'New Delhi', 'Delhi', 'IN', ST_MakePoint(77.2090, 28.6139)::geography, 11034555),
('in.dl.delhi', 'Delhi', 'Delhi', 'IN', ST_MakePoint(77.1025, 28.7041)::geography, 16787941),
('in.hr.gurgaon', 'Gurgaon', 'Haryana', 'IN', ST_MakePoint(77.0266, 28.4595)::geography, 876969),
('in.hr.faridabad', 'Faridabad', 'Haryana', 'IN', ST_MakePoint(77.3178, 28.4089)::geography, 1414050),
('in.up.noida', 'Noida', 'Uttar Pradesh', 'IN', ST_MakePoint(77.3910, 28.5355)::geography, 642381),
('in.up.ghaziabad', 'Ghaziabad', 'Uttar Pradesh', 'IN', ST_MakePoint(77.4538, 28.6692)::geography, 1729000),
('in.up.greater-noida', 'Greater Noida', 'Uttar Pradesh', 'IN', ST_MakePoint(77.4960, 28.4744)::geography, 107676)
ON CONFLICT DO NOTHING;

-- ── Karnataka ───────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.ka.bengaluru', 'Bengaluru', 'Karnataka', 'IN', ST_MakePoint(77.5946, 12.9716)::geography, 8443675),
('in.ka.mysuru', 'Mysuru', 'Karnataka', 'IN', ST_MakePoint(76.6394, 12.2958)::geography, 920550),
('in.ka.hubli', 'Hubli', 'Karnataka', 'IN', ST_MakePoint(75.1240, 15.3647)::geography, 943857),
('in.ka.mangaluru', 'Mangaluru', 'Karnataka', 'IN', ST_MakePoint(74.8560, 12.9141)::geography, 623841),
('in.ka.belgaum', 'Belgaum', 'Karnataka', 'IN', ST_MakePoint(74.4977, 15.8497)::geography, 488292),
('in.ka.gulbarga', 'Gulbarga', 'Karnataka', 'IN', ST_MakePoint(76.8343, 17.3297)::geography, 543147),
('in.ka.davanagere', 'Davanagere', 'Karnataka', 'IN', ST_MakePoint(75.9218, 14.4644)::geography, 434971),
('in.ka.bellary', 'Bellary', 'Karnataka', 'IN', ST_MakePoint(76.3860, 15.1394)::geography, 410445),
('in.ka.bijapur', 'Bijapur', 'Karnataka', 'IN', ST_MakePoint(75.7100, 16.8302)::geography, 326360),
('in.ka.shimoga', 'Shimoga', 'Karnataka', 'IN', ST_MakePoint(75.5681, 13.9299)::geography, 322650),
('in.ka.tumkur', 'Tumkur', 'Karnataka', 'IN', ST_MakePoint(77.1010, 13.3379)::geography, 305821),
('in.ka.raichur', 'Raichur', 'Karnataka', 'IN', ST_MakePoint(77.3590, 16.2076)::geography, 232456),
('in.ka.bidar', 'Bidar', 'Karnataka', 'IN', ST_MakePoint(77.5199, 17.9135)::geography, 216020),
('in.ka.hospet', 'Hospet', 'Karnataka', 'IN', ST_MakePoint(76.3871, 15.2689)::geography, 206167),
('in.ka.udupi', 'Udupi', 'Karnataka', 'IN', ST_MakePoint(74.7421, 13.3409)::geography, 165401),
('in.ka.hassan', 'Hassan', 'Karnataka', 'IN', ST_MakePoint(76.1000, 13.0068)::geography, 133436),
('in.ka.chitradurga', 'Chitradurga', 'Karnataka', 'IN', ST_MakePoint(76.3985, 14.2226)::geography, 145853),
('in.ka.coorg', 'Coorg', 'Karnataka', 'IN', ST_MakePoint(75.7382, 12.4244)::geography, 30000),
('in.ka.hampi', 'Hampi', 'Karnataka', 'IN', ST_MakePoint(76.4601, 15.3350)::geography, 3000),
('in.ka.gokarna', 'Gokarna', 'Karnataka', 'IN', ST_MakePoint(74.3188, 14.5479)::geography, 26614),
('in.ka.badami', 'Badami', 'Karnataka', 'IN', ST_MakePoint(75.6800, 15.9200)::geography, 30943),
('in.ka.chikmagalur', 'Chikmagalur', 'Karnataka', 'IN', ST_MakePoint(75.7747, 13.3161)::geography, 118401)
ON CONFLICT DO NOTHING;

-- ── Tamil Nadu ──────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.tn.chennai', 'Chennai', 'Tamil Nadu', 'IN', ST_MakePoint(80.2707, 13.0827)::geography, 4681087),
('in.tn.coimbatore', 'Coimbatore', 'Tamil Nadu', 'IN', ST_MakePoint(76.9558, 11.0168)::geography, 1050721),
('in.tn.madurai', 'Madurai', 'Tamil Nadu', 'IN', ST_MakePoint(78.1198, 9.9252)::geography, 1017865),
('in.tn.tiruchirappalli', 'Tiruchirappalli', 'Tamil Nadu', 'IN', ST_MakePoint(78.7047, 10.7905)::geography, 847387),
('in.tn.salem', 'Salem', 'Tamil Nadu', 'IN', ST_MakePoint(78.1460, 11.6643)::geography, 831038),
('in.tn.tirunelveli', 'Tirunelveli', 'Tamil Nadu', 'IN', ST_MakePoint(77.7567, 8.7139)::geography, 474838),
('in.tn.erode', 'Erode', 'Tamil Nadu', 'IN', ST_MakePoint(77.7172, 11.3410)::geography, 521776),
('in.tn.vellore', 'Vellore', 'Tamil Nadu', 'IN', ST_MakePoint(79.1325, 12.9165)::geography, 423425),
('in.tn.thoothukudi', 'Thoothukudi', 'Tamil Nadu', 'IN', ST_MakePoint(78.1348, 8.7642)::geography, 310531),
('in.tn.tiruppur', 'Tiruppur', 'Tamil Nadu', 'IN', ST_MakePoint(77.3411, 11.1085)::geography, 444543),
('in.tn.dindigul', 'Dindigul', 'Tamil Nadu', 'IN', ST_MakePoint(77.9803, 10.3624)::geography, 207327),
('in.tn.thanjavur', 'Thanjavur', 'Tamil Nadu', 'IN', ST_MakePoint(79.1378, 10.7870)::geography, 222943),
('in.tn.ranipet', 'Ranipet', 'Tamil Nadu', 'IN', ST_MakePoint(79.3325, 12.9224)::geography, 144580),
('in.tn.sivakasi', 'Sivakasi', 'Tamil Nadu', 'IN', ST_MakePoint(77.8010, 9.4533)::geography, 72170),
('in.tn.karaikudi', 'Karaikudi', 'Tamil Nadu', 'IN', ST_MakePoint(78.7675, 10.0732)::geography, 106714),
('in.tn.hosur', 'Hosur', 'Tamil Nadu', 'IN', ST_MakePoint(77.8253, 12.7409)::geography, 116821),
('in.tn.nagercoil', 'Nagercoil', 'Tamil Nadu', 'IN', ST_MakePoint(77.4119, 8.1833)::geography, 227535),
('in.tn.kanchipuram', 'Kanchipuram', 'Tamil Nadu', 'IN', ST_MakePoint(79.7036, 12.8342)::geography, 164384),
('in.tn.kumbakonam', 'Kumbakonam', 'Tamil Nadu', 'IN', ST_MakePoint(79.3881, 10.9617)::geography, 140156),
('in.tn.ooty', 'Ooty', 'Tamil Nadu', 'IN', ST_MakePoint(76.6950, 11.4102)::geography, 88430),
('in.tn.kodaikanal', 'Kodaikanal', 'Tamil Nadu', 'IN', ST_MakePoint(77.4892, 10.2381)::geography, 36501),
('in.tn.mamallapuram', 'Mamallapuram', 'Tamil Nadu', 'IN', ST_MakePoint(80.1927, 12.6269)::geography, 15172),
('in.tn.pondicherry', 'Pondicherry', 'Tamil Nadu', 'IN', ST_MakePoint(79.8083, 11.9416)::geography, 244377),
('in.tn.rameswaram', 'Rameswaram', 'Tamil Nadu', 'IN', ST_MakePoint(79.3129, 9.2876)::geography, 44856)
ON CONFLICT DO NOTHING;

-- ── Uttar Pradesh ───────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.up.lucknow', 'Lucknow', 'Uttar Pradesh', 'IN', ST_MakePoint(80.9462, 26.8467)::geography, 2817105),
('in.up.kanpur', 'Kanpur', 'Uttar Pradesh', 'IN', ST_MakePoint(80.3319, 26.4499)::geography, 2920067),
('in.up.agra', 'Agra', 'Uttar Pradesh', 'IN', ST_MakePoint(78.0322, 27.1767)::geography, 1585704),
('in.up.varanasi', 'Varanasi', 'Uttar Pradesh', 'IN', ST_MakePoint(82.9913, 25.3176)::geography, 1198491),
('in.up.prayagraj', 'Prayagraj', 'Uttar Pradesh', 'IN', ST_MakePoint(81.8463, 25.4358)::geography, 1117094),
('in.up.meerut', 'Meerut', 'Uttar Pradesh', 'IN', ST_MakePoint(77.7064, 28.9845)::geography, 1305429),
('in.up.bareilly', 'Bareilly', 'Uttar Pradesh', 'IN', ST_MakePoint(79.4210, 28.3670)::geography, 898167),
('in.up.aligarh', 'Aligarh', 'Uttar Pradesh', 'IN', ST_MakePoint(78.0880, 27.8974)::geography, 872575),
('in.up.moradabad', 'Moradabad', 'Uttar Pradesh', 'IN', ST_MakePoint(78.7733, 28.8386)::geography, 887871),
('in.up.gorakhpur', 'Gorakhpur', 'Uttar Pradesh', 'IN', ST_MakePoint(83.3732, 26.7606)::geography, 673446),
('in.up.saharanpur', 'Saharanpur', 'Uttar Pradesh', 'IN', ST_MakePoint(77.5510, 29.9680)::geography, 703345),
('in.up.jhansi', 'Jhansi', 'Uttar Pradesh', 'IN', ST_MakePoint(78.5685, 25.4484)::geography, 507293),
('in.up.mathura', 'Mathura', 'Uttar Pradesh', 'IN', ST_MakePoint(77.6737, 27.4924)::geography, 349909),
('in.up.firozabad', 'Firozabad', 'Uttar Pradesh', 'IN', ST_MakePoint(78.3957, 27.1591)::geography, 306409),
('in.up.muzaffarnagar', 'Muzaffarnagar', 'Uttar Pradesh', 'IN', ST_MakePoint(77.7085, 29.4727)::geography, 392451),
('in.up.ayodhya', 'Ayodhya', 'Uttar Pradesh', 'IN', ST_MakePoint(82.2055, 26.7922)::geography, 55890),
('in.up.vrindavan', 'Vrindavan', 'Uttar Pradesh', 'IN', ST_MakePoint(77.7012, 27.5810)::geography, 63005),
('in.up.rishikesh', 'Rishikesh', 'Uttar Pradesh', 'IN', ST_MakePoint(78.2676, 30.0869)::geography, 102138),
('in.up.haridwar', 'Haridwar', 'Uttar Pradesh', 'IN', ST_MakePoint(78.1642, 29.9457)::geography, 228832),
('in.up.sultanpur', 'Sultanpur', 'Uttar Pradesh', 'IN', ST_MakePoint(82.0726, 26.2648)::geography, 113990),
('in.up.etawah', 'Etawah', 'Uttar Pradesh', 'IN', ST_MakePoint(79.0280, 26.7856)::geography, 257448),
('in.up.rampur', 'Rampur', 'Uttar Pradesh', 'IN', ST_MakePoint(79.0277, 28.7930)::geography, 325429),
('in.up.shahjahanpur', 'Shahjahanpur', 'Uttar Pradesh', 'IN', ST_MakePoint(79.9120, 27.8830)::geography, 320434),
('in.up.sitapur', 'Sitapur', 'Uttar Pradesh', 'IN', ST_MakePoint(80.6831, 27.5630)::geography, 185280),
('in.up.hardoi', 'Hardoi', 'Uttar Pradesh', 'IN', ST_MakePoint(80.1313, 27.3953)::geography, 137779),
('in.up.unnao', 'Unnao', 'Uttar Pradesh', 'IN', ST_MakePoint(80.4878, 26.5393)::geography, 178281),
('in.up.fatehpur', 'Fatehpur', 'Uttar Pradesh', 'IN', ST_MakePoint(80.8136, 25.9304)::geography, 185862),
('in.up.rae-bareli', 'Rae Bareli', 'Uttar Pradesh', 'IN', ST_MakePoint(81.2340, 26.2345)::geography, 169333),
('in.up.banda', 'Banda', 'Uttar Pradesh', 'IN', ST_MakePoint(80.3371, 25.4755)::geography, 153584),
('in.up.mirzapur', 'Mirzapur', 'Uttar Pradesh', 'IN', ST_MakePoint(82.5647, 25.1337)::geography, 233691)
ON CONFLICT DO NOTHING;

-- ── Rajasthan ───────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.rj.jaipur', 'Jaipur', 'Rajasthan', 'IN', ST_MakePoint(75.7873, 26.9124)::geography, 3073350),
('in.rj.jodhpur', 'Jodhpur', 'Rajasthan', 'IN', ST_MakePoint(73.0243, 26.2389)::geography, 1033918),
('in.rj.kota', 'Kota', 'Rajasthan', 'IN', ST_MakePoint(75.8648, 25.2138)::geography, 1001365),
('in.rj.bikaner', 'Bikaner', 'Rajasthan', 'IN', ST_MakePoint(73.3119, 28.0229)::geography, 644406),
('in.rj.ajmer', 'Ajmer', 'Rajasthan', 'IN', ST_MakePoint(74.6399, 26.4499)::geography, 542321),
('in.rj.udaipur', 'Udaipur', 'Rajasthan', 'IN', ST_MakePoint(73.7125, 24.5854)::geography, 451735),
('in.rj.bhilwara', 'Bhilwara', 'Rajasthan', 'IN', ST_MakePoint(74.6313, 25.3407)::geography, 360009),
('in.rj.alwar', 'Alwar', 'Rajasthan', 'IN', ST_MakePoint(76.6346, 27.5530)::geography, 315310),
('in.rj.sikar', 'Sikar', 'Rajasthan', 'IN', ST_MakePoint(75.1399, 27.6094)::geography, 237112),
('in.rj.bharatpur', 'Bharatpur', 'Rajasthan', 'IN', ST_MakePoint(77.5030, 27.2152)::geography, 252342),
('in.rj.pali', 'Pali', 'Rajasthan', 'IN', ST_MakePoint(73.3233, 25.7710)::geography, 230075),
('in.rj.sri-ganganagar', 'Sri Ganganagar', 'Rajasthan', 'IN', ST_MakePoint(73.8772, 29.9094)::geography, 237543),
('in.rj.tonk', 'Tonk', 'Rajasthan', 'IN', ST_MakePoint(75.7885, 26.1664)::geography, 165363),
('in.rj.jaisalmer', 'Jaisalmer', 'Rajasthan', 'IN', ST_MakePoint(70.9083, 26.9157)::geography, 78114),
('in.rj.pushkar', 'Pushkar', 'Rajasthan', 'IN', ST_MakePoint(74.5510, 26.4898)::geography, 21626),
('in.rj.mount-abu', 'Mount Abu', 'Rajasthan', 'IN', ST_MakePoint(72.7156, 24.5926)::geography, 22943),
('in.rj.chittorgarh', 'Chittorgarh', 'Rajasthan', 'IN', ST_MakePoint(74.6269, 24.8887)::geography, 116406),
('in.rj.bundi', 'Bundi', 'Rajasthan', 'IN', ST_MakePoint(75.6370, 25.4305)::geography, 103286),
('in.rj.sawai-madhopur', 'Sawai Madhopur', 'Rajasthan', 'IN', ST_MakePoint(76.3460, 26.0233)::geography, 121106),
('in.rj.jhunjhunu', 'Jhunjhunu', 'Rajasthan', 'IN', ST_MakePoint(75.3968, 28.1288)::geography, 118473),
('in.rj.nagaur', 'Nagaur', 'Rajasthan', 'IN', ST_MakePoint(73.7310, 27.1946)::geography, 100618),
('in.rj.barmer', 'Barmer', 'Rajasthan', 'IN', ST_MakePoint(71.3910, 25.7521)::geography, 83517),
('in.rj.hanumangarh', 'Hanumangarh', 'Rajasthan', 'IN', ST_MakePoint(74.3293, 29.5810)::geography, 151104),
('in.rj.dungarpur', 'Dungarpur', 'Rajasthan', 'IN', ST_MakePoint(73.7145, 23.8417)::geography, 47000),
('in.rj.banswara', 'Banswara', 'Rajasthan', 'IN', ST_MakePoint(74.4485, 23.5461)::geography, 100128)
ON CONFLICT DO NOTHING;

-- ── Gujarat ─────────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.gj.ahmedabad', 'Ahmedabad', 'Gujarat', 'IN', ST_MakePoint(72.5714, 23.0225)::geography, 5570585),
('in.gj.surat', 'Surat', 'Gujarat', 'IN', ST_MakePoint(72.8311, 21.1702)::geography, 4467797),
('in.gj.vadodara', 'Vadodara', 'Gujarat', 'IN', ST_MakePoint(73.1812, 22.3072)::geography, 1666703),
('in.gj.rajkot', 'Rajkot', 'Gujarat', 'IN', ST_MakePoint(70.8022, 22.3039)::geography, 1286995),
('in.gj.bhavnagar', 'Bhavnagar', 'Gujarat', 'IN', ST_MakePoint(72.1519, 21.7645)::geography, 593768),
('in.gj.jamnagar', 'Jamnagar', 'Gujarat', 'IN', ST_MakePoint(70.0577, 22.4707)::geography, 529308),
('in.gj.junagadh', 'Junagadh', 'Gujarat', 'IN', ST_MakePoint(70.4579, 21.5222)::geography, 320250),
('in.gj.gandhinagar', 'Gandhinagar', 'Gujarat', 'IN', ST_MakePoint(72.6369, 23.2156)::geography, 208299),
('in.gj.anand', 'Anand', 'Gujarat', 'IN', ST_MakePoint(72.9510, 22.5645)::geography, 198282),
('in.gj.nadiad', 'Nadiad', 'Gujarat', 'IN', ST_MakePoint(72.8634, 22.6916)::geography, 225132),
('in.gj.navsari', 'Navsari', 'Gujarat', 'IN', ST_MakePoint(72.9520, 20.9467)::geography, 175135),
('in.gj.morbi', 'Morbi', 'Gujarat', 'IN', ST_MakePoint(70.8360, 22.8173)::geography, 194947),
('in.gj.surendranagar', 'Surendranagar', 'Gujarat', 'IN', ST_MakePoint(71.6369, 22.7281)::geography, 196559),
('in.gj.bharuch', 'Bharuch', 'Gujarat', 'IN', ST_MakePoint(72.9959, 21.7051)::geography, 168729),
('in.gj.gandhidham', 'Gandhidham', 'Gujarat', 'IN', ST_MakePoint(70.1337, 23.0753)::geography, 247992),
('in.gj.porbandar', 'Porbandar', 'Gujarat', 'IN', ST_MakePoint(69.6293, 21.6417)::geography, 152760),
('in.gj.dwarka', 'Dwarka', 'Gujarat', 'IN', ST_MakePoint(68.9685, 22.2394)::geography, 38873),
('in.gj.somnath', 'Somnath', 'Gujarat', 'IN', ST_MakePoint(70.3867, 20.8880)::geography, 50000),
('in.gj.kutch', 'Kutch', 'Gujarat', 'IN', ST_MakePoint(69.8597, 23.7337)::geography, 44108),
('in.gj.diu', 'Diu', 'Gujarat', 'IN', ST_MakePoint(70.9254, 20.7141)::geography, 23991),
('in.gj.saputara', 'Saputara', 'Gujarat', 'IN', ST_MakePoint(73.7491, 20.5737)::geography, 5000),
('in.gj.gir', 'Gir', 'Gujarat', 'IN', ST_MakePoint(70.7938, 21.1243)::geography, 10000)
ON CONFLICT DO NOTHING;

-- ── West Bengal ──────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.wb.kolkata', 'Kolkata', 'West Bengal', 'IN', ST_MakePoint(88.3639, 22.5726)::geography, 4486679),
('in.wb.howrah', 'Howrah', 'West Bengal', 'IN', ST_MakePoint(88.2636, 22.5958)::geography, 1072161),
('in.wb.asansol', 'Asansol', 'West Bengal', 'IN', ST_MakePoint(86.9524, 23.6888)::geography, 563917),
('in.wb.siliguri', 'Siliguri', 'West Bengal', 'IN', ST_MakePoint(88.4275, 26.7271)::geography, 513264),
('in.wb.durgapur', 'Durgapur', 'West Bengal', 'IN', ST_MakePoint(87.3119, 23.5204)::geography, 566517),
('in.wb.bardhaman', 'Bardhaman', 'West Bengal', 'IN', ST_MakePoint(87.8615, 23.2324)::geography, 347016),
('in.wb.malda', 'Malda', 'West Bengal', 'IN', ST_MakePoint(88.1437, 25.0108)::geography, 197514),
('in.wb.baharampur', 'Baharampur', 'West Bengal', 'IN', ST_MakePoint(88.2518, 24.1019)::geography, 195223),
('in.wb.habra', 'Habra', 'West Bengal', 'IN', ST_MakePoint(88.6506, 22.8386)::geography, 147221),
('in.wb.kharagpur', 'Kharagpur', 'West Bengal', 'IN', ST_MakePoint(87.3320, 22.3460)::geography, 207984),
('in.wb.shantiniketan', 'Shantiniketan', 'West Bengal', 'IN', ST_MakePoint(87.6855, 23.6815)::geography, 30000),
('in.wb.darjeeling', 'Darjeeling', 'West Bengal', 'IN', ST_MakePoint(88.2627, 27.0410)::geography, 118805),
('in.wb.kalimpong', 'Kalimpong', 'West Bengal', 'IN', ST_MakePoint(88.4699, 27.0660)::geography, 49403),
('in.wb.sundarbans', 'Sundarbans', 'West Bengal', 'IN', ST_MakePoint(88.8685, 21.9497)::geography, 44000),
('in.wb.digha', 'Digha', 'West Bengal', 'IN', ST_MakePoint(87.5070, 21.6278)::geography, 25000),
('in.wb.murshidabad', 'Murshidabad', 'West Bengal', 'IN', ST_MakePoint(88.2740, 24.1854)::geography, 36952)
ON CONFLICT DO NOTHING;

-- ── Telangana ───────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.tg.hyderabad', 'Hyderabad', 'Telangana', 'IN', ST_MakePoint(78.4867, 17.3850)::geography, 6809970),
('in.tg.warangal', 'Warangal', 'Telangana', 'IN', ST_MakePoint(79.5941, 17.9784)::geography, 704570),
('in.tg.nizamabad', 'Nizamabad', 'Telangana', 'IN', ST_MakePoint(78.0941, 18.6725)::geography, 311152),
('in.tg.karimnagar', 'Karimnagar', 'Telangana', 'IN', ST_MakePoint(79.1288, 18.4386)::geography, 261185),
('in.tg.khammam', 'Khammam', 'Telangana', 'IN', ST_MakePoint(80.1514, 17.2473)::geography, 262255),
('in.tg.ramagundam', 'Ramagundam', 'Telangana', 'IN', ST_MakePoint(79.4700, 18.7555)::geography, 229000),
('in.tg.mahbubnagar', 'Mahbubnagar', 'Telangana', 'IN', ST_MakePoint(78.0000, 16.7488)::geography, 190400),
('in.tg.secunderabad', 'Secunderabad', 'Telangana', 'IN', ST_MakePoint(78.4983, 17.4399)::geography, 204182),
('in.tg.nalgonda', 'Nalgonda', 'Telangana', 'IN', ST_MakePoint(79.2683, 17.0583)::geography, 127828),
('in.tg.adilabad', 'Adilabad', 'Telangana', 'IN', ST_MakePoint(78.5322, 19.6640)::geography, 117167),
('in.tg.siddipet', 'Siddipet', 'Telangana', 'IN', ST_MakePoint(78.8520, 18.1019)::geography, 108187)
ON CONFLICT DO NOTHING;

-- ── Andhra Pradesh ──────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.ap.visakhapatnam', 'Visakhapatnam', 'Andhra Pradesh', 'IN', ST_MakePoint(83.2185, 17.6868)::geography, 1730320),
('in.ap.vijayawada', 'Vijayawada', 'Andhra Pradesh', 'IN', ST_MakePoint(80.6480, 16.5062)::geography, 1048240),
('in.ap.guntur', 'Guntur', 'Andhra Pradesh', 'IN', ST_MakePoint(80.4365, 16.3067)::geography, 647508),
('in.ap.nellore', 'Nellore', 'Andhra Pradesh', 'IN', ST_MakePoint(79.9865, 14.4426)::geography, 558749),
('in.ap.kurnool', 'Kurnool', 'Andhra Pradesh', 'IN', ST_MakePoint(78.0373, 15.8281)::geography, 430214),
('in.ap.rajahmundry', 'Rajahmundry', 'Andhra Pradesh', 'IN', ST_MakePoint(81.8040, 17.0005)::geography, 341831),
('in.ap.tirupati', 'Tirupati', 'Andhra Pradesh', 'IN', ST_MakePoint(79.4192, 13.6288)::geography, 287482),
('in.ap.kadapa', 'Kadapa', 'Andhra Pradesh', 'IN', ST_MakePoint(78.8241, 14.4674)::geography, 344078),
('in.ap.kakinada', 'Kakinada', 'Andhra Pradesh', 'IN', ST_MakePoint(82.2475, 16.9891)::geography, 312538),
('in.ap.anantapur', 'Anantapur', 'Andhra Pradesh', 'IN', ST_MakePoint(77.5991, 14.6819)::geography, 267161),
('in.ap.eluru', 'Eluru', 'Andhra Pradesh', 'IN', ST_MakePoint(81.0952, 16.7107)::geography, 214414),
('in.ap.ongole', 'Ongole', 'Andhra Pradesh', 'IN', ST_MakePoint(80.0499, 15.5057)::geography, 200000),
('in.ap.srikakulam', 'Srikakulam', 'Andhra Pradesh', 'IN', ST_MakePoint(83.8938, 18.2949)::geography, 120800),
('in.ap.vizianagaram', 'Vizianagaram', 'Andhra Pradesh', 'IN', ST_MakePoint(83.3956, 18.1066)::geography, 228025),
('in.ap.amaravati', 'Amaravati', 'Andhra Pradesh', 'IN', ST_MakePoint(80.3515, 16.5131)::geography, 103000),
('in.ap.araku-valley', 'Araku Valley', 'Andhra Pradesh', 'IN', ST_MakePoint(82.8762, 18.3271)::geography, 30000)
ON CONFLICT DO NOTHING;

-- ── Kerala ──────────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.kl.thiruvananthapuram', 'Thiruvananthapuram', 'Kerala', 'IN', ST_MakePoint(76.9366, 8.5241)::geography, 752490),
('in.kl.kochi', 'Kochi', 'Kerala', 'IN', ST_MakePoint(76.2673, 9.9312)::geography, 677381),
('in.kl.kozhikode', 'Kozhikode', 'Kerala', 'IN', ST_MakePoint(75.7804, 11.2588)::geography, 609224),
('in.kl.thrissur', 'Thrissur', 'Kerala', 'IN', ST_MakePoint(76.2144, 10.5276)::geography, 315596),
('in.kl.kollam', 'Kollam', 'Kerala', 'IN', ST_MakePoint(76.6141, 8.8932)::geography, 394163),
('in.kl.kannur', 'Kannur', 'Kerala', 'IN', ST_MakePoint(75.3704, 11.8745)::geography, 232486),
('in.kl.alappuzha', 'Alappuzha', 'Kerala', 'IN', ST_MakePoint(76.3388, 9.4981)::geography, 174164),
('in.kl.palakkad', 'Palakkad', 'Kerala', 'IN', ST_MakePoint(76.6548, 10.7867)::geography, 130955),
('in.kl.malappuram', 'Malappuram', 'Kerala', 'IN', ST_MakePoint(76.0700, 11.0416)::geography, 100348),
('in.kl.kottayam', 'Kottayam', 'Kerala', 'IN', ST_MakePoint(76.5222, 9.5916)::geography, 136812),
('in.kl.kasaragod', 'Kasaragod', 'Kerala', 'IN', ST_MakePoint(75.0044, 12.5013)::geography, 73614),
('in.kl.pathanamthitta', 'Pathanamthitta', 'Kerala', 'IN', ST_MakePoint(76.7870, 9.2648)::geography, 37802),
('in.kl.idukki', 'Idukki', 'Kerala', 'IN', ST_MakePoint(76.9366, 9.8503)::geography, 14000),
('in.kl.wayanad', 'Wayanad', 'Kerala', 'IN', ST_MakePoint(76.1319, 11.6854)::geography, 37386),
('in.kl.munnar', 'Munnar', 'Kerala', 'IN', ST_MakePoint(77.0595, 10.0889)::geography, 32313),
('in.kl.kumarakom', 'Kumarakom', 'Kerala', 'IN', ST_MakePoint(76.4297, 9.6175)::geography, 24000),
('in.kl.thekkady', 'Thekkady', 'Kerala', 'IN', ST_MakePoint(77.1659, 9.6026)::geography, 10000),
('in.kl.varkala', 'Varkala', 'Kerala', 'IN', ST_MakePoint(76.7156, 8.7336)::geography, 40084),
('in.kl.kovalam', 'Kovalam', 'Kerala', 'IN', ST_MakePoint(76.9786, 8.3988)::geography, 5000),
('in.kl.fort-kochi', 'Fort Kochi', 'Kerala', 'IN', ST_MakePoint(76.2433, 9.9658)::geography, 35000),
('in.kl.athirappilly', 'Athirappilly', 'Kerala', 'IN', ST_MakePoint(76.5720, 10.2857)::geography, 5000)
ON CONFLICT DO NOTHING;

-- ── Madhya Pradesh ──────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.mp.bhopal', 'Bhopal', 'Madhya Pradesh', 'IN', ST_MakePoint(77.4126, 23.2599)::geography, 1798218),
('in.mp.indore', 'Indore', 'Madhya Pradesh', 'IN', ST_MakePoint(75.8577, 22.7196)::geography, 1994397),
('in.mp.jabalpur', 'Jabalpur', 'Madhya Pradesh', 'IN', ST_MakePoint(79.9864, 23.1815)::geography, 1081677),
('in.mp.gwalior', 'Gwalior', 'Madhya Pradesh', 'IN', ST_MakePoint(78.1828, 26.2183)::geography, 1069276),
('in.mp.ujjain', 'Ujjain', 'Madhya Pradesh', 'IN', ST_MakePoint(75.7885, 23.1765)::geography, 515215),
('in.mp.sagar', 'Sagar', 'Madhya Pradesh', 'IN', ST_MakePoint(78.7378, 23.8388)::geography, 273170),
('in.mp.dewas', 'Dewas', 'Madhya Pradesh', 'IN', ST_MakePoint(76.0551, 22.9676)::geography, 289438),
('in.mp.satna', 'Satna', 'Madhya Pradesh', 'IN', ST_MakePoint(80.8322, 24.6005)::geography, 280261),
('in.mp.ratlam', 'Ratlam', 'Madhya Pradesh', 'IN', ST_MakePoint(75.0367, 23.3315)::geography, 273998),
('in.mp.rewa', 'Rewa', 'Madhya Pradesh', 'IN', ST_MakePoint(81.2930, 24.5373)::geography, 236367),
('in.mp.singrauli', 'Singrauli', 'Madhya Pradesh', 'IN', ST_MakePoint(82.6800, 24.1990)::geography, 185190),
('in.mp.morena', 'Morena', 'Madhya Pradesh', 'IN', ST_MakePoint(77.9936, 26.4931)::geography, 195027),
('in.mp.chhindwara', 'Chhindwara', 'Madhya Pradesh', 'IN', ST_MakePoint(78.9382, 22.0574)::geography, 161640),
('in.mp.khajuraho', 'Khajuraho', 'Madhya Pradesh', 'IN', ST_MakePoint(79.9197, 24.8318)::geography, 24481),
('in.mp.orchha', 'Orchha', 'Madhya Pradesh', 'IN', ST_MakePoint(78.6409, 25.3519)::geography, 10000),
('in.mp.pachmarhi', 'Pachmarhi', 'Madhya Pradesh', 'IN', ST_MakePoint(78.4340, 22.4675)::geography, 13000),
('in.mp.mandu', 'Mandu', 'Madhya Pradesh', 'IN', ST_MakePoint(75.3933, 22.3665)::geography, 5000),
('in.mp.sanchi', 'Sanchi', 'Madhya Pradesh', 'IN', ST_MakePoint(77.7300, 23.4793)::geography, 8500),
('in.mp.kanha', 'Kanha', 'Madhya Pradesh', 'IN', ST_MakePoint(80.6115, 22.3346)::geography, 5000),
('in.mp.bandhavgarh', 'Bandhavgarh', 'Madhya Pradesh', 'IN', ST_MakePoint(80.9605, 23.7225)::geography, 5000)
ON CONFLICT DO NOTHING;

-- ── Bihar ────────────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.br.patna', 'Patna', 'Bihar', 'IN', ST_MakePoint(85.1376, 25.6093)::geography, 1683200),
('in.br.gaya', 'Gaya', 'Bihar', 'IN', ST_MakePoint(84.9994, 24.7955)::geography, 468614),
('in.br.bhagalpur', 'Bhagalpur', 'Bihar', 'IN', ST_MakePoint(86.9749, 25.2425)::geography, 410210),
('in.br.muzaffarpur', 'Muzaffarpur', 'Bihar', 'IN', ST_MakePoint(85.3647, 26.1209)::geography, 393724),
('in.br.purnia', 'Purnia', 'Bihar', 'IN', ST_MakePoint(87.4753, 25.7771)::geography, 282245),
('in.br.darbhanga', 'Darbhanga', 'Bihar', 'IN', ST_MakePoint(85.8918, 26.1542)::geography, 296039),
('in.br.arrah', 'Arrah', 'Bihar', 'IN', ST_MakePoint(84.6640, 25.5542)::geography, 261430),
('in.br.begusarai', 'Begusarai', 'Bihar', 'IN', ST_MakePoint(86.1271, 25.4183)::geography, 252008),
('in.br.katihar', 'Katihar', 'Bihar', 'IN', ST_MakePoint(87.5715, 25.5441)::geography, 239626),
('in.br.chapra', 'Chapra', 'Bihar', 'IN', ST_MakePoint(84.7459, 25.7804)::geography, 200006),
('in.br.saharsa', 'Saharsa', 'Bihar', 'IN', ST_MakePoint(86.5971, 25.8756)::geography, 156540),
('in.br.sasaram', 'Sasaram', 'Bihar', 'IN', ST_MakePoint(83.9917, 24.9511)::geography, 147408),
('in.br.hajipur', 'Hajipur', 'Bihar', 'IN', ST_MakePoint(85.2086, 25.6873)::geography, 147688),
('in.br.dehri', 'Dehri', 'Bihar', 'IN', ST_MakePoint(84.1826, 24.9074)::geography, 125989),
('in.br.siwan', 'Siwan', 'Bihar', 'IN', ST_MakePoint(84.3590, 26.2221)::geography, 135066),
('in.br.motihari', 'Motihari', 'Bihar', 'IN', ST_MakePoint(84.9214, 26.6572)::geography, 123027),
('in.br.nalanda', 'Nalanda', 'Bihar', 'IN', ST_MakePoint(85.4430, 25.1375)::geography, 50000),
('in.br.rajgir', 'Rajgir', 'Bihar', 'IN', ST_MakePoint(85.4249, 25.0282)::geography, 41587),
('in.br.bodh-gaya', 'Bodh Gaya', 'Bihar', 'IN', ST_MakePoint(84.9869, 24.6961)::geography, 30000)
ON CONFLICT DO NOTHING;

-- ── Punjab ──────────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.pb.ludhiana', 'Ludhiana', 'Punjab', 'IN', ST_MakePoint(75.8573, 30.9010)::geography, 1613878),
('in.pb.amritsar', 'Amritsar', 'Punjab', 'IN', ST_MakePoint(74.8723, 31.6340)::geography, 1132761),
('in.pb.jalandhar', 'Jalandhar', 'Punjab', 'IN', ST_MakePoint(75.5762, 31.3260)::geography, 862196),
('in.pb.patiala', 'Patiala', 'Punjab', 'IN', ST_MakePoint(76.3869, 30.3398)::geography, 405164),
('in.pb.bathinda', 'Bathinda', 'Punjab', 'IN', ST_MakePoint(74.9455, 30.2110)::geography, 285813),
('in.pb.mohali', 'Mohali', 'Punjab', 'IN', ST_MakePoint(76.7179, 30.7046)::geography, 166864),
('in.pb.pathankot', 'Pathankot', 'Punjab', 'IN', ST_MakePoint(75.6421, 32.2643)::geography, 179131),
('in.pb.hoshiarpur', 'Hoshiarpur', 'Punjab', 'IN', ST_MakePoint(75.9115, 31.5143)::geography, 168443),
('in.pb.moga', 'Moga', 'Punjab', 'IN', ST_MakePoint(75.1741, 30.8115)::geography, 159958),
('in.pb.phagwara', 'Phagwara', 'Punjab', 'IN', ST_MakePoint(75.7709, 31.2240)::geography, 118500),
('in.pb.kapurthala', 'Kapurthala', 'Punjab', 'IN', ST_MakePoint(75.3808, 31.3789)::geography, 101854),
('in.pb.firozpur', 'Firozpur', 'Punjab', 'IN', ST_MakePoint(74.6227, 30.9331)::geography, 110313),
('in.pb.muktsar', 'Muktsar', 'Punjab', 'IN', ST_MakePoint(74.5131, 30.4770)::geography, 60773),
('in.pb.anandpur-sahib', 'Anandpur Sahib', 'Punjab', 'IN', ST_MakePoint(76.5082, 31.2400)::geography, 16650)
ON CONFLICT DO NOTHING;

-- ── Haryana ─────────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.hr.chandigarh', 'Chandigarh', 'Haryana', 'IN', ST_MakePoint(76.7794, 30.7333)::geography, 960787),
('in.hr.ambala', 'Ambala', 'Haryana', 'IN', ST_MakePoint(76.7767, 30.3752)::geography, 198640),
('in.hr.hisar', 'Hisar', 'Haryana', 'IN', ST_MakePoint(75.7217, 29.1492)::geography, 301249),
('in.hr.panipat', 'Panipat', 'Haryana', 'IN', ST_MakePoint(76.9635, 29.3909)::geography, 294292),
('in.hr.karnal', 'Karnal', 'Haryana', 'IN', ST_MakePoint(76.9905, 29.6857)::geography, 286994),
('in.hr.sonipat', 'Sonipat', 'Haryana', 'IN', ST_MakePoint(77.0151, 28.9931)::geography, 311122),
('in.hr.yamunanagar', 'Yamunanagar', 'Haryana', 'IN', ST_MakePoint(77.2674, 30.1290)::geography, 216677),
('in.hr.rohtak', 'Rohtak', 'Haryana', 'IN', ST_MakePoint(76.5921, 28.8955)::geography, 374292),
('in.hr.sirsa', 'Sirsa', 'Haryana', 'IN', ST_MakePoint(75.0285, 29.5349)::geography, 195471),
('in.hr.rewari', 'Rewari', 'Haryana', 'IN', ST_MakePoint(76.6194, 28.1970)::geography, 155751),
('in.hr.jhajjar', 'Jhajjar', 'Haryana', 'IN', ST_MakePoint(76.6556, 28.6065)::geography, 41026),
('in.hr.jind', 'Jind', 'Haryana', 'IN', ST_MakePoint(76.3152, 29.3160)::geography, 167592),
('in.hr.bhiwani', 'Bhiwani', 'Haryana', 'IN', ST_MakePoint(76.1322, 28.7878)::geography, 196001),
('in.hr.kurukshetra', 'Kurukshetra', 'Haryana', 'IN', ST_MakePoint(76.8606, 29.9695)::geography, 48258),
('in.hr.panchkula', 'Panchkula', 'Haryana', 'IN', ST_MakePoint(76.8606, 30.6942)::geography, 211355)
ON CONFLICT DO NOTHING;

-- ── Odisha ──────────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.od.bhubaneswar', 'Bhubaneswar', 'Odisha', 'IN', ST_MakePoint(85.8245, 20.2961)::geography, 837737),
('in.od.cuttack', 'Cuttack', 'Odisha', 'IN', ST_MakePoint(85.8830, 20.4625)::geography, 606007),
('in.od.rourkela', 'Rourkela', 'Odisha', 'IN', ST_MakePoint(84.8536, 22.2604)::geography, 552970),
('in.od.berhampur', 'Berhampur', 'Odisha', 'IN', ST_MakePoint(84.7941, 19.3150)::geography, 355823),
('in.od.sambalpur', 'Sambalpur', 'Odisha', 'IN', ST_MakePoint(83.9812, 21.4669)::geography, 183037),
('in.od.puri', 'Puri', 'Odisha', 'IN', ST_MakePoint(85.8312, 19.8135)::geography, 201026),
('in.od.balasore', 'Balasore', 'Odisha', 'IN', ST_MakePoint(86.9336, 21.4942)::geography, 177557),
('in.od.bhadrak', 'Bhadrak', 'Odisha', 'IN', ST_MakePoint(86.4958, 21.0542)::geography, 108752),
('in.od.baripada', 'Baripada', 'Odisha', 'IN', ST_MakePoint(86.7287, 21.9322)::geography, 116874),
('in.od.jharsuguda', 'Jharsuguda', 'Odisha', 'IN', ST_MakePoint(84.0063, 21.8554)::geography, 100459),
('in.od.konark', 'Konark', 'Odisha', 'IN', ST_MakePoint(86.0986, 19.8876)::geography, 16246),
('in.od.chilika', 'Chilika', 'Odisha', 'IN', ST_MakePoint(85.3189, 19.7154)::geography, 10000),
('in.od.gopalpur', 'Gopalpur', 'Odisha', 'IN', ST_MakePoint(84.9053, 19.2593)::geography, 5000)
ON CONFLICT DO NOTHING;

-- ── Jharkhand ───────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.jh.ranchi', 'Ranchi', 'Jharkhand', 'IN', ST_MakePoint(85.3096, 23.3441)::geography, 1073440),
('in.jh.jamshedpur', 'Jamshedpur', 'Jharkhand', 'IN', ST_MakePoint(86.2029, 22.8046)::geography, 629659),
('in.jh.dhanbad', 'Dhanbad', 'Jharkhand', 'IN', ST_MakePoint(86.4304, 23.7957)::geography, 1161561),
('in.jh.bokaro', 'Bokaro', 'Jharkhand', 'IN', ST_MakePoint(86.1511, 23.6693)::geography, 394790),
('in.jh.deoghar', 'Deoghar', 'Jharkhand', 'IN', ST_MakePoint(86.6918, 24.4764)::geography, 203116),
('in.jh.hazaribag', 'Hazaribag', 'Jharkhand', 'IN', ST_MakePoint(85.3567, 23.9966)::geography, 148920),
('in.jh.giridih', 'Giridih', 'Jharkhand', 'IN', ST_MakePoint(86.3008, 24.1854)::geography, 120800),
('in.jh.ramgarh', 'Ramgarh', 'Jharkhand', 'IN', ST_MakePoint(85.5230, 23.6387)::geography, 100000),
('in.jh.medininagar', 'Medininagar', 'Jharkhand', 'IN', ST_MakePoint(84.0751, 24.2032)::geography, 97000),
('in.jh.chaibasa', 'Chaibasa', 'Jharkhand', 'IN', ST_MakePoint(85.8055, 22.5555)::geography, 73000),
('in.jh.netarhat', 'Netarhat', 'Jharkhand', 'IN', ST_MakePoint(84.2854, 23.4720)::geography, 5000),
('in.jh.mccluskieganj', 'McCluskieganj', 'Jharkhand', 'IN', ST_MakePoint(84.9024, 23.6461)::geography, 3000)
ON CONFLICT DO NOTHING;

-- ── Chhattisgarh ────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.ct.raipur', 'Raipur', 'Chhattisgarh', 'IN', ST_MakePoint(81.6296, 21.2514)::geography, 1010433),
('in.ct.bhilai', 'Bhilai', 'Chhattisgarh', 'IN', ST_MakePoint(81.3509, 21.2094)::geography, 625138),
('in.ct.bilaspur', 'Bilaspur', 'Chhattisgarh', 'IN', ST_MakePoint(82.1391, 22.0796)::geography, 365579),
('in.ct.korba', 'Korba', 'Chhattisgarh', 'IN', ST_MakePoint(82.6818, 22.3595)::geography, 363390),
('in.ct.durg', 'Durg', 'Chhattisgarh', 'IN', ST_MakePoint(81.2849, 21.1904)::geography, 268806),
('in.ct.rajnandgaon', 'Rajnandgaon', 'Chhattisgarh', 'IN', ST_MakePoint(81.0311, 21.0977)::geography, 163122),
('in.ct.jagdalpur', 'Jagdalpur', 'Chhattisgarh', 'IN', ST_MakePoint(82.0209, 19.0837)::geography, 125345),
('in.ct.ambikapur', 'Ambikapur', 'Chhattisgarh', 'IN', ST_MakePoint(83.1807, 23.1184)::geography, 122625),
('in.ct.raigarh', 'Raigarh', 'Chhattisgarh', 'IN', ST_MakePoint(83.3951, 21.8974)::geography, 141885),
('in.ct.chitrakoot', 'Chitrakoot Falls', 'Chhattisgarh', 'IN', ST_MakePoint(81.7031, 19.2047)::geography, 5000)
ON CONFLICT DO NOTHING;

-- ── Assam ───────────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.as.guwahati', 'Guwahati', 'Assam', 'IN', ST_MakePoint(91.7362, 26.1445)::geography, 957352),
('in.as.silchar', 'Silchar', 'Assam', 'IN', ST_MakePoint(92.7789, 24.8333)::geography, 228985),
('in.as.dibrugarh', 'Dibrugarh', 'Assam', 'IN', ST_MakePoint(94.9120, 27.4728)::geography, 154296),
('in.as.jorhat', 'Jorhat', 'Assam', 'IN', ST_MakePoint(94.2037, 26.7509)::geography, 153889),
('in.as.nagaon', 'Nagaon', 'Assam', 'IN', ST_MakePoint(92.6840, 26.3499)::geography, 147231),
('in.as.tinsukia', 'Tinsukia', 'Assam', 'IN', ST_MakePoint(95.3590, 27.4883)::geography, 126389),
('in.as.tezpur', 'Tezpur', 'Assam', 'IN', ST_MakePoint(92.8003, 26.6338)::geography, 102505),
('in.as.bongaigaon', 'Bongaigaon', 'Assam', 'IN', ST_MakePoint(90.5569, 26.4772)::geography, 73531),
('in.as.sibsagar', 'Sibsagar', 'Assam', 'IN', ST_MakePoint(94.6308, 26.9826)::geography, 44600),
('in.as.majuli', 'Majuli', 'Assam', 'IN', ST_MakePoint(94.1698, 26.9500)::geography, 167304),
('in.as.kaziranga', 'Kaziranga', 'Assam', 'IN', ST_MakePoint(93.3700, 26.5775)::geography, 10000),
('in.as.manas', 'Manas', 'Assam', 'IN', ST_MakePoint(91.0000, 26.7500)::geography, 5000),
('in.as.haflong', 'Haflong', 'Assam', 'IN', ST_MakePoint(93.0140, 25.1664)::geography, 36839)
ON CONFLICT DO NOTHING;

-- ── Uttarakhand ─────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.uk.dehradun', 'Dehradun', 'Uttarakhand', 'IN', ST_MakePoint(78.0322, 30.3165)::geography, 578420),
('in.uk.haridwar', 'Haridwar', 'Uttarakhand', 'IN', ST_MakePoint(78.1642, 29.9457)::geography, 228832),
('in.uk.rishikesh', 'Rishikesh', 'Uttarakhand', 'IN', ST_MakePoint(78.2676, 30.0869)::geography, 102138),
('in.uk.haldwani', 'Haldwani', 'Uttarakhand', 'IN', ST_MakePoint(79.5129, 29.2183)::geography, 256533),
('in.uk.roorkee', 'Roorkee', 'Uttarakhand', 'IN', ST_MakePoint(77.8880, 29.8543)::geography, 118105),
('in.uk.nainital', 'Nainital', 'Uttarakhand', 'IN', ST_MakePoint(79.4540, 29.3919)::geography, 41377),
('in.uk.mussoorie', 'Mussoorie', 'Uttarakhand', 'IN', ST_MakePoint(78.0644, 30.4598)::geography, 30118),
('in.uk.rudraprayag', 'Rudraprayag', 'Uttarakhand', 'IN', ST_MakePoint(79.0193, 30.2869)::geography, 4280),
('in.uk.almora', 'Almora', 'Uttarakhand', 'IN', ST_MakePoint(79.6536, 29.5971)::geography, 35513),
('in.uk.pithoragarh', 'Pithoragarh', 'Uttarakhand', 'IN', ST_MakePoint(80.2180, 29.5829)::geography, 56044),
('in.uk.kashipur', 'Kashipur', 'Uttarakhand', 'IN', ST_MakePoint(78.9621, 29.2138)::geography, 121623),
('in.uk.uttarkashi', 'Uttarkashi', 'Uttarakhand', 'IN', ST_MakePoint(78.4412, 30.7268)::geography, 18976),
('in.uk.auli', 'Auli', 'Uttarakhand', 'IN', ST_MakePoint(79.5570, 30.5296)::geography, 3000),
('in.uk.chopta', 'Chopta', 'Uttarakhand', 'IN', ST_MakePoint(79.2285, 30.4475)::geography, 1000),
('in.uk.kedarnath', 'Kedarnath', 'Uttarakhand', 'IN', ST_MakePoint(79.0669, 30.7346)::geography, 516),
('in.uk.badrinath', 'Badrinath', 'Uttarakhand', 'IN', ST_MakePoint(79.4938, 30.7433)::geography, 1000),
('in.uk.jim-corbett', 'Jim Corbett', 'Uttarakhand', 'IN', ST_MakePoint(78.7747, 29.5300)::geography, 5000),
('in.uk.valley-of-flowers', 'Valley of Flowers', 'Uttarakhand', 'IN', ST_MakePoint(79.5717, 30.7275)::geography, 100),
('in.uk.lansdowne', 'Lansdowne', 'Uttarakhand', 'IN', ST_MakePoint(78.6831, 29.8377)::geography, 7725),
('in.uk.ranikhet', 'Ranikhet', 'Uttarakhand', 'IN', ST_MakePoint(79.4311, 29.6358)::geography, 18886),
('in.uk.bhimtal', 'Bhimtal', 'Uttarakhand', 'IN', ST_MakePoint(79.5660, 29.3523)::geography, 7722),
('in.uk.binsar', 'Binsar', 'Uttarakhand', 'IN', ST_MakePoint(79.7188, 29.6735)::geography, 2000),
('in.uk.mukteshwar', 'Mukteshwar', 'Uttarakhand', 'IN', ST_MakePoint(79.6497, 29.4693)::geography, 2000),
('in.uk.kausani', 'Kausani', 'Uttarakhand', 'IN', ST_MakePoint(79.6092, 29.8469)::geography, 3000)
ON CONFLICT DO NOTHING;

-- ── Himachal Pradesh ────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.hp.shimla', 'Shimla', 'Himachal Pradesh', 'IN', ST_MakePoint(77.1734, 31.1048)::geography, 169578),
('in.hp.manali', 'Manali', 'Himachal Pradesh', 'IN', ST_MakePoint(77.1887, 32.2396)::geography, 8096),
('in.hp.dharamshala', 'Dharamshala', 'Himachal Pradesh', 'IN', ST_MakePoint(76.3234, 32.2190)::geography, 30764),
('in.hp.kullu', 'Kullu', 'Himachal Pradesh', 'IN', ST_MakePoint(77.1095, 31.9579)::geography, 18306),
('in.hp.solan', 'Solan', 'Himachal Pradesh', 'IN', ST_MakePoint(77.0967, 30.9045)::geography, 39256),
('in.hp.mandi', 'Mandi', 'Himachal Pradesh', 'IN', ST_MakePoint(76.9314, 31.7084)::geography, 26422),
('in.hp.hamirpur', 'Hamirpur', 'Himachal Pradesh', 'IN', ST_MakePoint(76.5218, 31.6846)::geography, 20213),
('in.hp.una', 'Una', 'Himachal Pradesh', 'IN', ST_MakePoint(76.2693, 31.4723)::geography, 18000),
('in.hp.palampur', 'Palampur', 'Himachal Pradesh', 'IN', ST_MakePoint(76.5365, 32.1109)::geography, 8574),
('in.hp.kasauli', 'Kasauli', 'Himachal Pradesh', 'IN', ST_MakePoint(76.9658, 30.8995)::geography, 5000),
('in.hp.dalhousie', 'Dalhousie', 'Himachal Pradesh', 'IN', ST_MakePoint(75.9706, 32.5373)::geography, 7000),
('in.hp.spiti', 'Spiti', 'Himachal Pradesh', 'IN', ST_MakePoint(78.0353, 32.2462)::geography, 12000),
('in.hp.kinnaur', 'Kinnaur', 'Himachal Pradesh', 'IN', ST_MakePoint(78.2638, 31.5833)::geography, 84121),
('in.hp.mcleodganj', 'McLeodganj', 'Himachal Pradesh', 'IN', ST_MakePoint(76.3188, 32.2427)::geography, 11059),
('in.hp.bir-billing', 'Bir Billing', 'Himachal Pradesh', 'IN', ST_MakePoint(76.7223, 31.8794)::geography, 3000),
('in.hp.chamba', 'Chamba', 'Himachal Pradesh', 'IN', ST_MakePoint(76.1255, 32.5534)::geography, 22000),
('in.hp.tirthan-valley', 'Tirthan Valley', 'Himachal Pradesh', 'IN', ST_MakePoint(77.4443, 31.6380)::geography, 2000),
('in.hp.khajjiar', 'Khajjiar', 'Himachal Pradesh', 'IN', ST_MakePoint(76.0619, 32.5417)::geography, 1500),
('in.hp.chitkul', 'Chitkul', 'Himachal Pradesh', 'IN', ST_MakePoint(78.4328, 31.3517)::geography, 600),
('in.hp.jibhi', 'Jibhi', 'Himachal Pradesh', 'IN', ST_MakePoint(77.3436, 31.6174)::geography, 1000),
('in.hp.narkanda', 'Narkanda', 'Himachal Pradesh', 'IN', ST_MakePoint(77.4506, 31.2556)::geography, 5000),
('in.hp.sangla', 'Sangla', 'Himachal Pradesh', 'IN', ST_MakePoint(78.2616, 31.4224)::geography, 2000)
ON CONFLICT DO NOTHING;

-- ── Jammu & Kashmir ─────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.jk.srinagar', 'Srinagar', 'Jammu & Kashmir', 'IN', ST_MakePoint(74.7973, 34.0837)::geography, 1180570),
('in.jk.jammu', 'Jammu', 'Jammu & Kashmir', 'IN', ST_MakePoint(74.8570, 32.7266)::geography, 502197),
('in.jk.anantnag', 'Anantnag', 'Jammu & Kashmir', 'IN', ST_MakePoint(75.1548, 33.7312)::geography, 108505),
('in.jk.baramulla', 'Baramulla', 'Jammu & Kashmir', 'IN', ST_MakePoint(74.3443, 34.1980)::geography, 167986),
('in.jk.sopore', 'Sopore', 'Jammu & Kashmir', 'IN', ST_MakePoint(74.4732, 34.3005)::geography, 63035),
('in.jk.gulmarg', 'Gulmarg', 'Jammu & Kashmir', 'IN', ST_MakePoint(74.3804, 34.0484)::geography, 5000),
('in.jk.pahalgam', 'Pahalgam', 'Jammu & Kashmir', 'IN', ST_MakePoint(75.3149, 34.0161)::geography, 6000),
('in.jk.sonmarg', 'Sonmarg', 'Jammu & Kashmir', 'IN', ST_MakePoint(75.2972, 34.3030)::geography, 1000),
('in.jk.patnitop', 'Patnitop', 'Jammu & Kashmir', 'IN', ST_MakePoint(75.3246, 33.0868)::geography, 1500),
('in.jk.katra', 'Katra', 'Jammu & Kashmir', 'IN', ST_MakePoint(74.9319, 32.9915)::geography, 22000),
('in.jk.leh', 'Leh', 'Ladakh', 'IN', ST_MakePoint(77.5771, 34.1526)::geography, 30870),
('in.jk.kargil', 'Kargil', 'Ladakh', 'IN', ST_MakePoint(76.1349, 34.5539)::geography, 16338),
('in.jk.nubra-valley', 'Nubra Valley', 'Ladakh', 'IN', ST_MakePoint(77.5728, 34.6880)::geography, 5000),
('in.jk.pangong', 'Pangong', 'Ladakh', 'IN', ST_MakePoint(78.6625, 33.7595)::geography, 1000),
('in.jk.tso-moriri', 'Tso Moriri', 'Ladakh', 'IN', ST_MakePoint(78.3233, 32.9000)::geography, 500),
('in.jk.zanskar', 'Zanskar', 'Ladakh', 'IN', ST_MakePoint(76.8486, 33.5064)::geography, 14000),
('in.jk.hemis', 'Hemis', 'Ladakh', 'IN', ST_MakePoint(77.7064, 33.9113)::geography, 1000)
ON CONFLICT DO NOTHING;

-- ── Goa ─────────────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.ga.panaji', 'Panaji', 'Goa', 'IN', ST_MakePoint(73.8278, 15.4989)::geography, 114405),
('in.ga.vasco', 'Vasco da Gama', 'Goa', 'IN', ST_MakePoint(73.8116, 15.3982)::geography, 100485),
('in.ga.margao', 'Margao', 'Goa', 'IN', ST_MakePoint(73.9746, 15.2832)::geography, 87650),
('in.ga.mapusa', 'Mapusa', 'Goa', 'IN', ST_MakePoint(73.8084, 15.5916)::geography, 39989),
('in.ga.ponda', 'Ponda', 'Goa', 'IN', ST_MakePoint(74.0067, 15.4038)::geography, 20543),
('in.ga.calangute', 'Calangute', 'Goa', 'IN', ST_MakePoint(73.7617, 15.5449)::geography, 16000),
('in.ga.anjuna', 'Anjuna', 'Goa', 'IN', ST_MakePoint(73.7424, 15.5732)::geography, 10000),
('in.ga.vagator', 'Vagator', 'Goa', 'IN', ST_MakePoint(73.7360, 15.5985)::geography, 5000),
('in.ga.baga', 'Baga', 'Goa', 'IN', ST_MakePoint(73.7517, 15.5554)::geography, 5000),
('in.ga.palolem', 'Palolem', 'Goa', 'IN', ST_MakePoint(74.0230, 15.0100)::geography, 5000),
('in.ga.old-goa', 'Old Goa', 'Goa', 'IN', ST_MakePoint(73.9116, 15.5019)::geography, 5411),
('in.ga.candolim', 'Candolim', 'Goa', 'IN', ST_MakePoint(73.7658, 15.5178)::geography, 8000),
('in.ga.arambol', 'Arambol', 'Goa', 'IN', ST_MakePoint(73.7050, 15.6869)::geography, 5000),
('in.ga.morjim', 'Morjim', 'Goa', 'IN', ST_MakePoint(73.7334, 15.6312)::geography, 3000),
('in.ga.agonda', 'Agonda', 'Goa', 'IN', ST_MakePoint(73.9880, 15.0487)::geography, 3000)
ON CONFLICT DO NOTHING;

-- ── Meghalaya ───────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.ml.shillong', 'Shillong', 'Meghalaya', 'IN', ST_MakePoint(91.8933, 25.5788)::geography, 354759),
('in.ml.tura', 'Tura', 'Meghalaya', 'IN', ST_MakePoint(90.2022, 25.5144)::geography, 74858),
('in.ml.cherrapunji', 'Cherrapunji', 'Meghalaya', 'IN', ST_MakePoint(91.7320, 25.2799)::geography, 12000),
('in.ml.mawlynnong', 'Mawlynnong', 'Meghalaya', 'IN', ST_MakePoint(91.9265, 25.2003)::geography, 500),
('in.ml.dawki', 'Dawki', 'Meghalaya', 'IN', ST_MakePoint(92.0163, 25.1833)::geography, 3000),
('in.ml.nongriat', 'Nongriat', 'Meghalaya', 'IN', ST_MakePoint(91.7073, 25.2707)::geography, 500),
('in.ml.jowai', 'Jowai', 'Meghalaya', 'IN', ST_MakePoint(92.2047, 25.4524)::geography, 27085)
ON CONFLICT DO NOTHING;

-- ── Nagaland ────────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.nl.kohima', 'Kohima', 'Nagaland', 'IN', ST_MakePoint(94.1086, 25.6751)::geography, 99039),
('in.nl.dimapur', 'Dimapur', 'Nagaland', 'IN', ST_MakePoint(93.7307, 25.9069)::geography, 122834),
('in.nl.mokokchung', 'Mokokchung', 'Nagaland', 'IN', ST_MakePoint(94.5203, 26.3241)::geography, 35394),
('in.nl.mon', 'Mon', 'Nagaland', 'IN', ST_MakePoint(94.9242, 26.7113)::geography, 12000),
('in.nl.zunheboto', 'Zunheboto', 'Nagaland', 'IN', ST_MakePoint(94.5220, 25.9664)::geography, 14500)
ON CONFLICT DO NOTHING;

-- ── Manipur ─────────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.mn.imphal', 'Imphal', 'Manipur', 'IN', ST_MakePoint(93.9368, 24.8170)::geography, 264986),
('in.mn.thoubal', 'Thoubal', 'Manipur', 'IN', ST_MakePoint(94.0103, 24.6299)::geography, 28000),
('in.mn.loktak', 'Loktak', 'Manipur', 'IN', ST_MakePoint(93.7833, 24.5500)::geography, 5000),
('in.mn.ukhrul', 'Ukhrul', 'Manipur', 'IN', ST_MakePoint(94.3623, 25.1097)::geography, 17949)
ON CONFLICT DO NOTHING;

-- ── Mizoram ─────────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.mz.aizawl', 'Aizawl', 'Mizoram', 'IN', ST_MakePoint(92.7176, 23.7271)::geography, 293416),
('in.mz.lunglei', 'Lunglei', 'Mizoram', 'IN', ST_MakePoint(92.7445, 22.8825)::geography, 57011),
('in.mz.champhai', 'Champhai', 'Mizoram', 'IN', ST_MakePoint(93.3276, 23.4565)::geography, 35000),
('in.mz.serchhip', 'Serchhip', 'Mizoram', 'IN', ST_MakePoint(92.8451, 23.3011)::geography, 26000)
ON CONFLICT DO NOTHING;

-- ── Tripura ─────────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.tr.agartala', 'Agartala', 'Tripura', 'IN', ST_MakePoint(91.2868, 23.8315)::geography, 400004),
('in.tr.dharmanagar', 'Dharmanagar', 'Tripura', 'IN', ST_MakePoint(92.1618, 24.3765)::geography, 44093),
('in.tr.udaipur', 'Udaipur', 'Tripura', 'IN', ST_MakePoint(91.4935, 23.5350)::geography, 36000),
('in.tr.neermahal', 'Neermahal', 'Tripura', 'IN', ST_MakePoint(91.4500, 23.5000)::geography, 5000)
ON CONFLICT DO NOTHING;

-- ── Arunachal Pradesh ───────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.ar.itanagar', 'Itanagar', 'Arunachal Pradesh', 'IN', ST_MakePoint(93.6053, 27.0844)::geography, 59490),
('in.ar.tawang', 'Tawang', 'Arunachal Pradesh', 'IN', ST_MakePoint(91.8595, 27.5860)::geography, 11521),
('in.ar.ziro', 'Ziro', 'Arunachal Pradesh', 'IN', ST_MakePoint(93.8320, 27.5455)::geography, 25000),
('in.ar.bomdila', 'Bomdila', 'Arunachal Pradesh', 'IN', ST_MakePoint(92.4234, 27.2655)::geography, 7085),
('in.ar.pasighat', 'Pasighat', 'Arunachal Pradesh', 'IN', ST_MakePoint(95.3259, 28.0670)::geography, 28823),
('in.ar.along', 'Along', 'Arunachal Pradesh', 'IN', ST_MakePoint(94.7665, 28.1700)::geography, 15000),
('in.ar.mechuka', 'Mechuka', 'Arunachal Pradesh', 'IN', ST_MakePoint(94.1367, 28.6167)::geography, 2000),
('in.ar.anini', 'Anini', 'Arunachal Pradesh', 'IN', ST_MakePoint(95.8840, 28.7953)::geography, 2000),
('in.ar.namdapha', 'Namdapha', 'Arunachal Pradesh', 'IN', ST_MakePoint(96.3938, 27.4920)::geography, 1000)
ON CONFLICT DO NOTHING;

-- ── Sikkim ──────────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.sk.gangtok', 'Gangtok', 'Sikkim', 'IN', ST_MakePoint(88.6138, 27.3389)::geography, 100286),
('in.sk.namchi', 'Namchi', 'Sikkim', 'IN', ST_MakePoint(88.3592, 27.1669)::geography, 12190),
('in.sk.pelling', 'Pelling', 'Sikkim', 'IN', ST_MakePoint(88.2362, 27.2983)::geography, 5000),
('in.sk.lachung', 'Lachung', 'Sikkim', 'IN', ST_MakePoint(88.7443, 27.6917)::geography, 2000),
('in.sk.ravangla', 'Ravangla', 'Sikkim', 'IN', ST_MakePoint(88.3611, 27.3068)::geography, 3000),
('in.sk.yuksom', 'Yuksom', 'Sikkim', 'IN', ST_MakePoint(88.2220, 27.3750)::geography, 2000),
('in.sk.gurudongmar', 'Gurudongmar', 'Sikkim', 'IN', ST_MakePoint(88.7115, 27.9863)::geography, 100),
('in.sk.tsomgo', 'Tsomgo Lake', 'Sikkim', 'IN', ST_MakePoint(88.7651, 27.3739)::geography, 500)
ON CONFLICT DO NOTHING;

-- ── Andaman & Nicobar Islands ───────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.an.port-blair', 'Port Blair', 'Andaman & Nicobar Islands', 'IN', ST_MakePoint(92.7265, 11.6234)::geography, 100608),
('in.an.havelock', 'Havelock Island', 'Andaman & Nicobar Islands', 'IN', ST_MakePoint(92.9637, 11.9731)::geography, 5000),
('in.an.neil-island', 'Neil Island', 'Andaman & Nicobar Islands', 'IN', ST_MakePoint(93.0428, 11.8414)::geography, 3000),
('in.an.baratang', 'Baratang', 'Andaman & Nicobar Islands', 'IN', ST_MakePoint(92.7641, 12.0769)::geography, 2000),
('in.an.ross-island', 'Ross Island', 'Andaman & Nicobar Islands', 'IN', ST_MakePoint(92.7594, 11.6809)::geography, 1000),
('in.an.diglipur', 'Diglipur', 'Andaman & Nicobar Islands', 'IN', ST_MakePoint(92.9739, 13.2667)::geography, 44737)
ON CONFLICT DO NOTHING;

-- ── Lakshadweep ─────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.ld.kavaratti', 'Kavaratti', 'Lakshadweep', 'IN', ST_MakePoint(72.6358, 10.5626)::geography, 11210),
('in.ld.agatti', 'Agatti', 'Lakshadweep', 'IN', ST_MakePoint(72.1894, 10.8564)::geography, 8000),
('in.ld.bangaram', 'Bangaram', 'Lakshadweep', 'IN', ST_MakePoint(72.2847, 10.9375)::geography, 500),
('in.ld.minicoy', 'Minicoy', 'Lakshadweep', 'IN', ST_MakePoint(73.0449, 8.2874)::geography, 10447)
ON CONFLICT DO NOTHING;

-- ── Puducherry ──────────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.py.puducherry', 'Puducherry', 'Puducherry', 'IN', ST_MakePoint(79.8083, 11.9416)::geography, 244377),
('in.py.karaikal', 'Karaikal', 'Puducherry', 'IN', ST_MakePoint(79.8381, 10.9254)::geography, 86499),
('in.py.mahe', 'Mahe', 'Puducherry', 'IN', ST_MakePoint(75.5340, 11.7008)::geography, 41816),
('in.py.yanam', 'Yanam', 'Puducherry', 'IN', ST_MakePoint(82.2130, 16.7251)::geography, 55626)
ON CONFLICT DO NOTHING;

-- ── Chandigarh UT ───────────────────────────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.ch.chandigarh', 'Chandigarh', 'Chandigarh', 'IN', ST_MakePoint(76.7794, 30.7333)::geography, 1055450)
ON CONFLICT DO NOTHING;

-- ── Dadra & Nagar Haveli / Daman & Diu ──────────────────────────
INSERT INTO cities (id, name, state, country, point, population) VALUES
('in.dd.silvassa', 'Silvassa', 'Dadra & Nagar Haveli', 'IN', ST_MakePoint(73.0169, 20.2766)::geography, 99786),
('in.dd.daman', 'Daman', 'Daman & Diu', 'IN', ST_MakePoint(72.8397, 20.3974)::geography, 35770)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- Total: ~500 cities seeded (major cities + travel destinations)
-- Full ~4000 cities to be imported via CSV or API in production
-- This seed covers all state capitals, major cities, and key
-- travel destinations needed for MVP content creation & discovery
-- ═══════════════════════════════════════════════════════════════════
