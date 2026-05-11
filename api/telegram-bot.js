/**
 * KaranjAuto Parts Finder — Telegram Bot
 * Vercel Serverless Function: api/telegram-bot.js
 *
 * Webhook URL to set:
 *   https://YOUR-VERCEL-URL.vercel.app/api/telegram-bot
 *
 * Environment variables needed in Vercel:
 *   TELEGRAM_TOKEN   — your bot token
 *   AUTHORIZED_CHAT_IDS — optional comma-separated chat IDs to restrict access
 */

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const INVENTORY_URL  = 'https://raw.githubusercontent.com/karanja9/workshop-inventory/main/inventory_data.json';
const TELEGRAM_API   = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// ─── Simple in-memory inventory cache (survives warm function instances) ───────
let inventoryCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getInventory() {
  if (inventoryCache && Date.now() - cacheTimestamp < CACHE_TTL_MS) return inventoryCache;
  try {
    const r = await fetch(INVENTORY_URL + '?t=' + Date.now());
    if (!r.ok) throw new Error('HTTP ' + r.status);
    inventoryCache = await r.json();
    cacheTimestamp = Date.now();
    return inventoryCache;
  } catch (e) {
    console.error('Inventory fetch failed:', e.message);
    return inventoryCache || []; // stale cache is better than nothing
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CROSS-REFERENCE DATABASE
// Structure: each entry has searchTerms (lowercase, for matching) + part info
// ─────────────────────────────────────────────────────────────────────────────
const PARTS_KNOWLEDGE = [

  // ═══════════════════════════════════════════════════════
  // BEARINGS — TAPERED ROLLER (metric)
  // ═══════════════════════════════════════════════════════
  {
    partNumbers: ['30204'],
    name: 'Tapered Roller Bearing 30204',
    type: 'bearing', dimensions: '20×47×15.25mm',
    searchTerms: ['30204','small furrow wheel','furrow wheel small','mf 135 furrow small',
      'small plough wheel','harrow bearing small','20x47'],
    applications: ['MF 135 small furrow wheel', 'Light implement furrow wheels', 'Harrow disc'],
  },
  {
    partNumbers: ['30205'],
    name: 'Tapered Roller Bearing 30205',
    type: 'bearing', dimensions: '25×52×16.25mm',
    searchTerms: ['30205','furrow wheel bearing','mf furrow','mf 135 furrow','ford 3000 furrow',
      'plough furrow wheel','furrow','kingpin small','25x52'],
    applications: ['MF 135 furrow wheel (outer)', 'Ford 3000 furrow wheel', 'Small plough furrow wheels'],
  },
  {
    partNumbers: ['30206'],
    name: 'Tapered Roller Bearing 30206',
    type: 'bearing', dimensions: '30×62×16mm',
    searchTerms: ['30206','mf 135 front wheel','mf135','massey ferguson 135','massey 135',
      'mf front wheel','ford 3000 front wheel','ford 4000','furrow wheel large','furgerson',
      'furrow bearing','front wheel mf','front bearing mf 135','30206 bearing',
      'baldan furrow','chambuli bearing small','mf 165 front'],
    applications: ['MF 135 front wheel (inner)', 'MF 165 front wheel', 'Ford 3000/4000 front wheel', 'Large furrow wheels', 'Ford 5000'],
  },
  {
    partNumbers: ['30207'],
    name: 'Tapered Roller Bearing 30207',
    type: 'bearing', dimensions: '35×72×18.25mm',
    searchTerms: ['30207','mf 135 front outer','mf front outer','ford 3000 outer',
      'ford 4000 outer','ford 5000 front','front wheel outer mf','front bearing outer',
      'ford front bearing','35x72','mf 165 front outer','new holland 6610 front'],
    applications: ['MF 135 front wheel (outer)', 'MF 165 front wheel', 'Ford 3000/4000/5000 front wheel', 'New Holland 6610'],
  },
  {
    partNumbers: ['30208'],
    name: 'Tapered Roller Bearing 30208',
    type: 'bearing', dimensions: '40×80×19.75mm',
    searchTerms: ['30208','mf 290 front','mf 375 front','ford 6600 front','ford 6610 front',
      'ford 7610 front','new holland 7610','ford 6 series front','40x80','large front bearing'],
    applications: ['MF 290 front wheel', 'MF 375/385 front wheel', 'Ford 6600/6610/7610 front wheel', 'New Holland TT75'],
  },
  {
    partNumbers: ['30209'],
    name: 'Tapered Roller Bearing 30209',
    type: 'bearing', dimensions: '45×85×20.75mm',
    searchTerms: ['30209','mf 390 front','mf 395 front','case jx front','case jx75','case jx80',
      'landini front bearing','45x85','heavy front bearing','case front wheel'],
    applications: ['MF 390/395/399 front wheel', 'Case JX75/JX80 front wheel', 'Landini Powermaster'],
  },
  {
    partNumbers: ['30210'],
    name: 'Tapered Roller Bearing 30210',
    type: 'bearing', dimensions: '50×90×21.75mm',
    searchTerms: ['30210','mf 399 front large','case jx90','case jx95','heavy tractor front',
      'landini legend','50x90','case 95 front'],
    applications: ['MF 399 (heavy) front wheel', 'Case JX90/JX95 front wheel', 'Landini Legend'],
  },
  {
    partNumbers: ['32205'],
    name: 'Tapered Roller Bearing 32205',
    type: 'bearing', dimensions: '25×52×19.25mm',
    searchTerms: ['32205','hub bearing','small hub','25x52 wide'],
    applications: ['Light trailer hubs', 'Small implement wheel hubs'],
  },
  {
    partNumbers: ['32206'],
    name: 'Tapered Roller Bearing 32206',
    type: 'bearing', dimensions: '30×62×21.25mm',
    searchTerms: ['32206','mf 135 hub','hub bearing mf','tractor hub small','plough hub',
      '30x62 wide','chambuliwide'],
    applications: ['MF 135 rear hub', 'Plough implement hubs', 'Trailer axle (light)'],
  },
  {
    partNumbers: ['32207'],
    name: 'Tapered Roller Bearing 32207',
    type: 'bearing', dimensions: '35×72×24.25mm',
    searchTerms: ['32207','mf 290 hub','ford hub','trailer hub medium','35x72 wide',
      'mf290 hub','mf 375 hub'],
    applications: ['MF 290/375 hub bearing', 'Ford 6600 hub', 'Medium trailers'],
  },
  {
    partNumbers: ['32208'],
    name: 'Tapered Roller Bearing 32208',
    type: 'bearing', dimensions: '40×80×24.75mm',
    searchTerms: ['32208','heavy hub','large hub bearing','fuso hub','truck hub light',
      '40x80 wide'],
    applications: ['Light truck hubs', 'Canter/Fuso front hub', 'Heavy trailer'],
  },
  {
    partNumbers: ['32209'],
    name: 'Tapered Roller Bearing 32209',
    type: 'bearing', dimensions: '45×85×24.75mm',
    searchTerms: ['32209','truck hub medium','fvr front hub','ftr hub','45x85 wide'],
    applications: ['FTR/FVR front hub', 'Medium truck hub bearings'],
  },
  {
    partNumbers: ['32210'],
    name: 'Tapered Roller Bearing 32210',
    type: 'bearing', dimensions: '50×90×24.75mm',
    searchTerms: ['32210','land cruiser front','hilux front bearing','pickup front hub',
      'land cruiser hub','toyota hub bearing','50x90 wide','4wd front'],
    applications: ['Land Cruiser front wheel hub', 'Hilux front hub', 'Toyota 4WD front axle'],
  },
  {
    partNumbers: ['32211'],
    name: 'Tapered Roller Bearing 32211',
    type: 'bearing', dimensions: '55×100×26.75mm',
    searchTerms: ['32211','heavy truck hub','55x100','large hub','land cruiser rear',
      'hilux rear hub','patrol hub'],
    applications: ['Land Cruiser rear hub', 'Hilux rear axle hub', 'Heavy truck front wheel'],
  },
  {
    partNumbers: ['32213'],
    name: 'Tapered Roller Bearing 32213',
    type: 'bearing', dimensions: '65×120×32.75mm',
    searchTerms: ['32213','fuso rear hub','canter rear','truck rear hub','large truck',
      '65x120'],
    applications: ['Fuso/Canter rear hub', 'Heavy truck rear wheel hub'],
  },

  // ═══════════════════════════════════════════════════════
  // BEARINGS — IMPERIAL TAPERED (common in older tractors)
  // ═══════════════════════════════════════════════════════
  {
    partNumbers: ['LM11949', 'LM11910', 'LM11949/10'],
    name: 'Imperial Tapered Bearing LM11949/LM11910',
    type: 'bearing', dimensions: '19.05×45.24×15.49mm (imperial)',
    searchTerms: ['lm11949','lm11910','ford 3000 front imperial','ford front imperial',
      'imperial front bearing ford','ford 2000','ford 4000 imperial'],
    applications: ['Ford 2000/3000/4000 front wheel (imperial)', 'Older Ford tractors'],
  },
  {
    partNumbers: ['LM12749', 'LM12710', 'LM12749/10'],
    name: 'Imperial Tapered Bearing LM12749/LM12710',
    type: 'bearing', dimensions: '21.43×45.24×15.88mm',
    searchTerms: ['lm12749','lm12710','ford 5000 front','ford 6000 front','ford imperial large',
      'ford 5000 imperial'],
    applications: ['Ford 5000/6000 front wheel', 'County tractors'],
  },
  {
    partNumbers: ['387A', '382A', '387/382'],
    name: 'Imperial Tapered Bearing 387A/382A',
    type: 'bearing', dimensions: '44.45×88.9×24.5mm (imperial)',
    searchTerms: ['387a','382a','387 382','ford 5000 hub','ford 6000 hub','ford rear hub',
      'ford big hub','county hub'],
    applications: ['Ford 5000/6000 rear hub', 'Heavy Ford tractor hub'],
  },
  {
    partNumbers: ['HM218248', 'HM218210', 'HM218248/10'],
    name: 'Imperial Tapered Bearing HM218248/HM218210',
    type: 'bearing', dimensions: '88.9×160.3×42.86mm (imperial)',
    searchTerms: ['hm218248','hm218210','big tractor rear','rear axle bearing','differential bearing',
      'mf 290 rear','john deere 3440 rear','jd 4020 rear','case rear bearing'],
    applications: ['MF 290/375 rear axle', 'John Deere 3440/4020 rear', 'Case 385/395 rear axle'],
  },

  // ═══════════════════════════════════════════════════════
  // BEARINGS — DEEP GROOVE BALL (common sizes)
  // ═══════════════════════════════════════════════════════
  {
    partNumbers: ['6200', '6200-2RS', '6200-ZZ'],
    name: 'Deep Groove Ball Bearing 6200',
    type: 'bearing', dimensions: '10×30×9mm',
    searchTerms: ['6200','small ball bearing','10x30','water pump small','alternator bearing small'],
    applications: ['Water pumps', 'Small alternators', 'Electric motors'],
  },
  {
    partNumbers: ['6201', '6201-2RS'],
    name: 'Deep Groove Ball Bearing 6201',
    type: 'bearing', dimensions: '12×32×10mm',
    searchTerms: ['6201','12x32','small pump bearing','garden pump'],
    applications: ['Small pumps', 'Light machinery'],
  },
  {
    partNumbers: ['6202', '6202-2RS'],
    name: 'Deep Groove Ball Bearing 6202',
    type: 'bearing', dimensions: '15×35×11mm',
    searchTerms: ['6202','15x35','mower bearing','small motor bearing'],
    applications: ['Lawn mowers', 'Small motors', 'Light implements'],
  },
  {
    partNumbers: ['6203', '6203-2RS'],
    name: 'Deep Groove Ball Bearing 6203',
    type: 'bearing', dimensions: '17×40×12mm',
    searchTerms: ['6203','17x40','vitz bearing','nze bearing','toyota small front',
      'probox inner','premio inner','alternator front bearing'],
    applications: ['Toyota Vitz/NZE front wheel (inner)', 'Probox front (inner)', 'Alternators', 'Water pumps'],
  },
  {
    partNumbers: ['6204', '6204-2RS', '6204-ZZ'],
    name: 'Deep Groove Ball Bearing 6204',
    type: 'bearing', dimensions: '20×47×14mm',
    searchTerms: ['6204','planter bearing','seeder bearing','maize planter','planter',
      '20x47','probox front bearing','caldina front bearing','toyota planter',
      'light planter','sunflower planter','kubota planter','light implement'],
    applications: ['Maize/sunflower planters', 'Probox front wheel', 'Caldina front wheel', 'Light implements', 'Kubota compact tractors'],
  },
  {
    partNumbers: ['6205', '6205-2RS', '6205-ZZ'],
    name: 'Deep Groove Ball Bearing 6205',
    type: 'bearing', dimensions: '25×52×15mm',
    searchTerms: ['6205','planter bearing large','maize planter large','disc planter bearing',
      '25x52','water pump bearing','harrow small ball','honda water pump',
      'kubota water pump','irrigation pump'],
    applications: ['Heavy planters', 'Water pumps', 'Kubota/Honda generators', 'Irrigation equipment'],
  },
  {
    partNumbers: ['6206', '6206-2RS'],
    name: 'Deep Groove Ball Bearing 6206',
    type: 'bearing', dimensions: '30×62×16mm',
    searchTerms: ['6206','kubota bearing','water pump mf','mf water pump','irrigation bearing',
      'pump bearing','electric motor bearing','30x62 ball','generator bearing'],
    applications: ['Kubota tractor water pump', 'MF water pump', 'Irrigation pumps', 'Electric motors (7.5kW)'],
  },
  {
    partNumbers: ['6207', '6207-2RS'],
    name: 'Deep Groove Ball Bearing 6207',
    type: 'bearing', dimensions: '35×72×17mm',
    searchTerms: ['6207','heavy pump bearing','tractor water pump bearing','ford water pump',
      '35x72 ball','large electric motor','mf 135 water pump'],
    applications: ['Ford/MF water pump bearing', 'Large electric motors (11-15kW)', 'Heavy pumps'],
  },
  {
    partNumbers: ['6208', '6208-2RS'],
    name: 'Deep Groove Ball Bearing 6208',
    type: 'bearing', dimensions: '40×80×18mm',
    searchTerms: ['6208','40x80 ball','large pump','heavy motor bearing','generator large'],
    applications: ['Large generators', 'Heavy electric motors', 'Industrial pumps'],
  },
  {
    partNumbers: ['6305', '6305-2RS'],
    name: 'Deep Groove Ball Bearing 6305',
    type: 'bearing', dimensions: '25×62×17mm',
    searchTerms: ['6305','disc bearing small','baldan disc small','nardi disc','plough disc small',
      'disc plough bearing small','25x62','mersey disc bearing'],
    applications: ['Disc plough (light) — Baldan/Nardi/Mersey', 'Small disc implements', 'Disc harrow (light)'],
  },
  {
    partNumbers: ['6306', '6306-2RS'],
    name: 'Deep Groove Ball Bearing 6306',
    type: 'bearing', dimensions: '30×72×19mm',
    searchTerms: ['6306','baldan disc','disc plough bearing','baldan bearing','nardi disc bearing',
      'plough disc bearing','disc bearing','mersey disc','30x72','disc plough'],
    applications: ['Baldan disc plough', 'Nardi disc plough', 'Mersey disc plough', 'Standard disc plough bearing'],
  },
  {
    partNumbers: ['6307', '6307-2RS'],
    name: 'Deep Groove Ball Bearing 6307',
    type: 'bearing', dimensions: '35×80×21mm',
    searchTerms: ['6307','heavy disc bearing','baldan heavy disc','large disc plough',
      '35x80','disc harrow heavy','heavy implement disc'],
    applications: ['Heavy Baldan disc plough', 'Disc harrow (heavy)', 'Large implement discs'],
  },
  {
    partNumbers: ['6308', '6308-2RS'],
    name: 'Deep Groove Ball Bearing 6308',
    type: 'bearing', dimensions: '40×90×23mm',
    searchTerms: ['6308','very heavy disc','40x90 ball','large disc implement','heavy harrow'],
    applications: ['Very heavy disc implements', 'Industrial machinery'],
  },
  {
    partNumbers: ['6309', '6309-2RS'],
    name: 'Deep Groove Ball Bearing 6309',
    type: 'bearing', dimensions: '45×100×25mm',
    searchTerms: ['6309','45x100 ball','heavy industrial'],
    applications: ['Heavy industrial applications'],
  },

  // ═══════════════════════════════════════════════════════
  // BEARINGS — DISC PLOUGH SPECIFIC (tapered)
  // ═══════════════════════════════════════════════════════
  {
    partNumbers: ['1985/1932', '25590/25520'],
    name: 'Disc Plough Tapered Bearing Set 1985/1932',
    type: 'bearing', dimensions: '22.23×57.15×17.46mm (imperial)',
    searchTerms: ['1985','1932','25590','25520','baldan tapered','disc plough tapered',
      'nardi tapered disc','disc plough imperial','chambuli baldan'],
    applications: ['Baldan disc plough (OEM tapered set)', 'Nardi disc plough', 'Some Mersey models'],
  },
  {
    partNumbers: ['JD8869', 'AM107552'],
    name: 'John Deere Disc Bearing JD8869',
    type: 'bearing', dimensions: 'Replaces OEM disc bearing',
    searchTerms: ['jd8869','john deere disc','jd disc bearing','john deere plough disc',
      'deere disc','jd 3440 disc','jd 4020 disc'],
    applications: ['John Deere disc ploughs', 'JD 3440/4020 implements'],
  },

  // ═══════════════════════════════════════════════════════
  // BEARINGS — VEHICLE SPECIFIC
  // ═══════════════════════════════════════════════════════
  {
    partNumbers: ['90363-40021', '40TRK29', 'SET35'],
    name: 'Probox/Corolla Front Wheel Bearing',
    type: 'bearing', dimensions: '40×74×36mm (double row)',
    searchTerms: ['probox front wheel','probox bearing','corolla front wheel','nze front',
      'premio front bearing','yaris front bearing','caldina front','vitz front',
      'toyota probox','90363-40021'],
    applications: ['Toyota Probox', 'Toyota Corolla NZE', 'Toyota Premio', 'Toyota Vitz', 'Toyota Caldina'],
  },
  {
    partNumbers: ['43550-60060', 'SET354', 'LM104949/LM104910'],
    name: 'Hilux Front Wheel Bearing',
    type: 'bearing', dimensions: '50.8×82.55×22.22mm',
    searchTerms: ['hilux front bearing','hilux wheel bearing','toyota hilux front','hilux bearing',
      'surf front bearing','4runner front','pickup front bearing','lm104949'],
    applications: ['Toyota Hilux (all years)', 'Toyota Surf/4Runner', 'Land Cruiser Prado (front)'],
  },
  {
    partNumbers: ['43550-69045', 'SET412'],
    name: 'Land Cruiser Front Wheel Bearing',
    type: 'bearing', dimensions: '55.575×90×25.4mm',
    searchTerms: ['land cruiser front bearing','lc front bearing','land cruiser 70 front',
      'land cruiser 80 front','lcv front bearing','land cruiser bearing','toyota lc'],
    applications: ['Land Cruiser 70 series', 'Land Cruiser 80 series', 'Land Cruiser HZJ/FZJ'],
  },
  {
    partNumbers: ['90369-55002', 'HUB168-T'],
    name: 'Land Cruiser Rear Differential Bearing',
    type: 'bearing', dimensions: 'Rear diff / pinion bearing set',
    searchTerms: ['land cruiser diff bearing','lc diff','differential bearing land cruiser',
      'diff bearing hilux','rear diff bearing','pinion bearing','diff pinion'],
    applications: ['Land Cruiser rear differential', 'Hilux rear differential', '4WD rear diff pinion'],
  },
  {
    partNumbers: ['43550-35011', 'SET357'],
    name: 'Hilux Rear Wheel Bearing',
    type: 'bearing', dimensions: '45.23×82.55×21.43mm',
    searchTerms: ['hilux rear bearing','pickup rear bearing','toyota hilux rear',
      'surf rear bearing','rear wheel bearing hilux'],
    applications: ['Toyota Hilux rear wheel', 'Toyota Surf rear wheel'],
  },
  {
    partNumbers: ['B35-77', 'DAC35770045'],
    name: 'Nissan Navara/Pickup Front Bearing',
    type: 'bearing', dimensions: '35×77×45mm',
    searchTerms: ['navara front bearing','nissan navara','nissan pickup front',
      'nissan d22 bearing','nissan np300 bearing'],
    applications: ['Nissan Navara D22/D40', 'Nissan NP300 pickup', 'Nissan D21 Hardbody'],
  },
  {
    partNumbers: ['8973652210', 'VKBA3568'],
    name: 'Isuzu D-Max Front Wheel Bearing',
    type: 'bearing', dimensions: ''  ,
    searchTerms: ['isuzu dmax front bearing','dmax bearing','isuzu front wheel','dmax front',
      'isuzu dmax','isuzu d-max','rodeo bearing'],
    applications: ['Isuzu D-Max', 'Isuzu Rodeo (3rd gen)', 'Chevrolet Colorado (common)'],
  },
  {
    partNumbers: ['MR992374', 'VKBA3413'],
    name: 'Canter/Rosa Front Wheel Bearing',
    type: 'bearing', dimensions: '40×80×33mm',
    searchTerms: ['canter front bearing','fuso front bearing','rosa front bearing',
      'canter wheel bearing','fuso canter','mitsubishi canter','mini bus bearing'],
    applications: ['Fuso Canter FE', 'Mitsubishi Rosa bus', 'Canter FE639/FE849'],
  },
  {
    partNumbers: ['1695874', 'VKBA5415'],
    name: 'FTR/FVR Front Wheel Bearing',
    type: 'bearing', dimensions: '55×100×45mm',
    searchTerms: ['ftr bearing','fvr bearing','isuzu ftr','isuzu fvr','truck front bearing',
      'isuzu truck bearing','npq bearing','nqr bearing','nps bearing'],
    applications: ['Isuzu FTR', 'Isuzu FVR', 'Isuzu NPS/NQR/NPQ trucks'],
  },

  // ═══════════════════════════════════════════════════════
  // FILTERS — OIL
  // ═══════════════════════════════════════════════════════
  {
    partNumbers: ['3312753', 'LF3349', 'W940/25'],
    name: 'Oil Filter — MF 135/165/Ford 3000/4000',
    type: 'filter_oil',
    searchTerms: ['mf 135 oil filter','mf135 oil filter','massey 135 filter','ford 3000 oil filter',
      'ford 4000 oil filter','perkins a4 filter','mf oil filter','ford tractor oil filter',
      'massey ferguson oil filter','perkins 4 cylinder','3312753','lf3349'],
    applications: ['MF 135 (Perkins A4.212)', 'MF 165 (Perkins A4.236)', 'Ford 3000/4000 (3-cyl Ford)', 'Ford 5000 (4-cyl)'],
  },
  {
    partNumbers: ['3313279', 'LF3874', 'W920/11'],
    name: 'Oil Filter — MF 290/375/Ford 6600',
    type: 'filter_oil',
    searchTerms: ['mf 290 oil filter','mf290 filter','mf 375 oil filter','mf 385 filter',
      'mf 390 filter','mf 395 filter','ford 6600 oil filter','ford 6610 filter',
      'ford 7610 oil filter','perkins 6 cylinder','3313279','lf3874'],
    applications: ['MF 290/375/385/390/395/399 (Perkins 6cyl)', 'Ford 6600/6610/7610', 'New Holland TT75'],
  },
  {
    partNumbers: ['84258488', 'P550776', 'BT8445-MPG'],
    name: 'Oil Filter — Case JX75/JX80/New Holland TT',
    type: 'filter_oil',
    searchTerms: ['case jx75 oil filter','case jx80 filter','case jx90 filter',
      'new holland tt55 oil filter','new holland tt75 filter','new holland oil filter',
      'case oil filter','case ih filter','84258488','p550776'],
    applications: ['Case JX75/JX80/JX90/JX95', 'New Holland TT55/TT75', 'New Holland Boomer series'],
  },
  {
    partNumbers: ['6005016561', 'RE504836', 'P551311'],
    name: 'Oil Filter — John Deere 3440/4020/5050',
    type: 'filter_oil',
    searchTerms: ['john deere oil filter','jd oil filter','john deere 3440 filter',
      'jd 3440 filter','john deere 4020 filter','jd 5050 filter','deere filter',
      're504836','6005016561'],
    applications: ['John Deere 3440', 'John Deere 4020/5020', 'John Deere 5050/5055/5065E'],
  },
  {
    partNumbers: ['3A011-74932', '15601-32430', 'HH164-32430'],
    name: 'Oil Filter — Kubota L/M Series',
    type: 'filter_oil',
    searchTerms: ['kubota oil filter','kubota filter','kubota l series filter','kubota m series filter',
      'kubota tractor filter','kubota b series oil','3a011-74932','hh164-32430'],
    applications: ['Kubota L1500/L2000/L2500/L3000', 'Kubota M5040/M6040/M7040', 'Kubota B-series compact'],
  },
  {
    partNumbers: ['6002114330', 'LF3878', 'RE62418'],
    name: 'Oil Filter — Landini Powermaster/Legend',
    type: 'filter_oil',
    searchTerms: ['landini oil filter','landini filter','landini powermaster filter',
      'landini technofarm filter','landini legend filter','landini rex filter'],
    applications: ['Landini Powermaster', 'Landini Legend 130/145', 'Landini Technofarm', 'Landini Rex series'],
  },
  {
    partNumbers: ['90915-YZZE2', '90915-10001', 'C-111'],
    name: 'Oil Filter — Toyota (Probox/NZE/Vitz/Premio)',
    type: 'filter_oil',
    searchTerms: ['probox oil filter','nze oil filter','vitz oil filter','premio oil filter',
      'yaris filter','corolla oil filter','toyota oil filter','90915-yzze2','c111'],
    applications: ['Toyota Probox (1NZ/2NZ)', 'Toyota Vitz', 'Toyota NZE Corolla', 'Toyota Premio (1ZZ)'],
  },
  {
    partNumbers: ['90915-10004', '90915-20001'],
    name: 'Oil Filter — Toyota Hilux/Land Cruiser',
    type: 'filter_oil',
    searchTerms: ['hilux oil filter','land cruiser oil filter','toyota hilux filter',
      'landcruiser filter','surf filter','toyota prado filter','land cruiser oil',
      '90915-10004'],
    applications: ['Toyota Hilux (1KZ/1GD/2TR)', 'Land Cruiser 70/80 series', 'Toyota Surf', 'Toyota Prado'],
  },
  {
    partNumbers: ['8-97034-0780', '8-97040-6160', 'W9025'],
    name: 'Oil Filter — Isuzu D-Max/4JB1/4JA1',
    type: 'filter_oil',
    searchTerms: ['isuzu dmax oil filter','isuzu oil filter','dmax filter',
      '4jb1 filter','4ja1 filter','isuzu rodeo filter','isuzu pickup filter',
      'isuzu 4jb1','isuzu engine filter'],
    applications: ['Isuzu D-Max 2.5TD', 'Isuzu 4JB1/4JA1 engines', 'Isuzu KB pickup', 'Isuzu MU'],
  },
  {
    partNumbers: ['1012010-A01', 'ME013340', 'W712/75'],
    name: 'Oil Filter — Fuso Canter/Rosa',
    type: 'filter_oil',
    searchTerms: ['canter oil filter','fuso oil filter','rosa oil filter',
      'mitsubishi canter filter','4d34 filter','4m50 filter','4d30 oil filter',
      'fuso 4d34'],
    applications: ['Fuso Canter 4D34/4M50', 'Mitsubishi Rosa (4D30)', 'Canter FE649/FE849'],
  },
  {
    partNumbers: ['8-94396108-1', '8943961081', 'W1140/4'],
    name: 'Oil Filter — Isuzu FTR/FVR/NPS/NQR',
    type: 'filter_oil',
    searchTerms: ['ftr oil filter','fvr oil filter','isuzu ftr filter','isuzu fvr filter',
      '6he1 filter','6hh1 filter','nqr filter','nps filter','isuzu truck filter',
      'isuzu 6 cylinder filter'],
    applications: ['Isuzu FTR/FVR (6HE1/6HH1)', 'Isuzu NPS 4×4', 'Isuzu NQR', 'Isuzu ELF 200'],
  },
  {
    partNumbers: ['8-98254-850-0', 'P558615'],
    name: 'Oil Filter — Isuzu D-Max (4JK1/4JJ1 Common Rail)',
    type: 'filter_oil',
    searchTerms: ['dmax common rail filter','4jk1 filter','4jj1 filter','new dmax filter',
      'isuzu common rail filter','vcdi filter'],
    applications: ['Isuzu D-Max 3.0VCDi (4JK1/4JJ1)', 'New generation Isuzu D-Max'],
  },
  {
    partNumbers: ['1230A039', 'ME999863', 'P553193'],
    name: 'Oil Filter — Nissan Navara/Patrol (common diesel)',
    type: 'filter_oil',
    searchTerms: ['navara oil filter','nissan navara filter','nissan patrol filter',
      'nissan diesel filter','zd30 filter','yd25 filter','td27 filter',
      'nissan pickup filter'],
    applications: ['Nissan Navara YD25', 'Nissan Patrol ZD30', 'Nissan Hardbody TD27', 'Nissan NP300'],
  },

  // ═══════════════════════════════════════════════════════
  // FILTERS — FUEL
  // ═══════════════════════════════════════════════════════
  {
    partNumbers: ['3310891', 'FF5018', 'KL87'],
    name: 'Fuel Filter — MF 135/165 (Perkins)',
    type: 'filter_fuel',
    searchTerms: ['mf 135 fuel filter','mf fuel filter','massey 135 fuel filter',
      'perkins fuel filter','mf 165 fuel filter','perkins a4 fuel'],
    applications: ['MF 135/165 (Perkins A4.212/A4.236)', 'Any Perkins 4-cylinder'],
  },
  {
    partNumbers: ['3313280', 'FF5035', 'KC64/1'],
    name: 'Fuel Filter — MF 290/375/Ford 6600 (Perkins 6-cyl)',
    type: 'filter_fuel',
    searchTerms: ['mf 290 fuel filter','mf 375 fuel filter','ford 6600 fuel filter',
      'perkins 6 cyl fuel','mf 390 fuel filter','ford 6610 fuel filter'],
    applications: ['MF 290/375/385/390/395 (Perkins 6cyl)', 'Ford 6600/6610/7610'],
  },
  {
    partNumbers: ['84558601', 'P550399', 'BF7590'],
    name: 'Fuel Filter — Case JX/New Holland TT',
    type: 'filter_fuel',
    searchTerms: ['case jx fuel filter','new holland tt fuel filter','case fuel filter',
      'new holland fuel filter','case jx75 fuel','nh tt55 fuel'],
    applications: ['Case JX75/JX80/JX90/JX95', 'New Holland TT55/TT75'],
  },
  {
    partNumbers: ['RE539465', 'P551010', 'BF9887'],
    name: 'Fuel Filter — John Deere',
    type: 'filter_fuel',
    searchTerms: ['john deere fuel filter','jd fuel filter','deere fuel','jd 3440 fuel',
      'john deere 5050 fuel','re539465'],
    applications: ['John Deere 3440/5050/5055/5065E'],
  },
  {
    partNumbers: ['16403-60010', 'WK820/16'],
    name: 'Fuel Filter — Toyota Hilux/Land Cruiser diesel',
    type: 'filter_fuel',
    searchTerms: ['hilux fuel filter','land cruiser fuel filter','toyota diesel fuel filter',
      'hilux diesel filter','1kz fuel filter','5l fuel filter','toyota land cruiser fuel'],
    applications: ['Toyota Hilux 1KZ-TE/5L diesel', 'Land Cruiser (all diesel)', 'Toyota Surf diesel'],
  },
  {
    partNumbers: ['23300-64010', '23390-64010'],
    name: 'Fuel Filter — Toyota 1GD/2GD (new Hilux)',
    type: 'filter_fuel',
    searchTerms: ['new hilux fuel filter','1gd fuel filter','2gd fuel filter',
      'hilux 2016 fuel filter','fortuner fuel filter','new land cruiser fuel'],
    applications: ['Toyota Hilux 1GD/2GD (2016+)', 'Toyota Fortuner (diesel)', 'Toyota Land Cruiser 1VD'],
  },
  {
    partNumbers: ['8-97306044-0', 'WK939/1'],
    name: 'Fuel Filter — Isuzu 4JB1/D-Max',
    type: 'filter_fuel',
    searchTerms: ['isuzu fuel filter','dmax fuel filter','4jb1 fuel filter','isuzu dmax fuel',
      'isuzu diesel fuel','isuzu rodeo fuel filter'],
    applications: ['Isuzu D-Max 4JB1/4JA1', 'Isuzu Rodeo', 'Isuzu KB pickup'],
  },
  {
    partNumbers: ['ME016859', 'WK950/21', 'BF7588'],
    name: 'Fuel Filter — Fuso Canter',
    type: 'filter_fuel',
    searchTerms: ['canter fuel filter','fuso fuel filter','4d34 fuel filter',
      'mitsubishi canter fuel','fuso diesel filter'],
    applications: ['Fuso Canter 4D34', 'Mitsubishi Rosa bus', 'Canter FE649'],
  },
  {
    partNumbers: ['8-97252032-0', 'FF5421'],
    name: 'Fuel Filter — Isuzu FTR/FVR truck',
    type: 'filter_fuel',
    searchTerms: ['ftr fuel filter','fvr fuel filter','isuzu truck fuel filter',
      '6he1 fuel filter','isuzu 6 cyl fuel'],
    applications: ['Isuzu FTR/FVR 6HE1/6HH1', 'Isuzu NQR/NPS'],
  },

  // ═══════════════════════════════════════════════════════
  // FILTERS — AIR
  // ═══════════════════════════════════════════════════════
  {
    partNumbers: ['1447061M1', 'AF872'],
    name: 'Air Filter — MF 135/165/290',
    type: 'filter_air',
    searchTerms: ['mf air filter','mf 135 air filter','massey air filter','mf 290 air filter',
      'tractor air filter mf','perkins air filter'],
    applications: ['MF 135/165/290/375/385 (Perkins engines)'],
  },
  {
    partNumbers: ['17801-0C010', '17801-30080'],
    name: 'Air Filter — Toyota Hilux/Land Cruiser',
    type: 'filter_air',
    searchTerms: ['hilux air filter','land cruiser air filter','toyota air filter',
      'toyota diesel air filter','surf air filter'],
    applications: ['Toyota Hilux (diesel)', 'Land Cruiser 70/80 series'],
  },
  {
    partNumbers: ['8-97095436-0', 'AF25550'],
    name: 'Air Filter — Isuzu D-Max/FTR',
    type: 'filter_air',
    searchTerms: ['isuzu air filter','dmax air filter','4jb1 air filter','isuzu truck air filter'],
    applications: ['Isuzu D-Max', 'Isuzu FTR/FVR', 'Isuzu 4JB1/6HE1'],
  },
  {
    partNumbers: ['MA1004', 'AF4557'],
    name: 'Air Filter — Kubota (L/M Series)',
    type: 'filter_air',
    searchTerms: ['kubota air filter','kubota l series air','kubota m series air filter'],
    applications: ['Kubota L-series', 'Kubota M-series'],
  },

  // ═══════════════════════════════════════════════════════
  // SEALS & GASKETS
  // ═══════════════════════════════════════════════════════
  {
    partNumbers: ['90311-35004', '9031135004'],
    name: 'Front Crankshaft Seal — Toyota Probox/Corolla',
    type: 'seal',
    searchTerms: ['probox crankshaft seal','probox crank seal','nze crank seal',
      'corolla crank seal','toyota crankshaft seal','1nz crank seal','2nz crank seal'],
    applications: ['Toyota Probox (1NZ/2NZ)', 'Toyota Vitz/Yaris', 'Toyota NZE/ZZE Corolla'],
  },
  {
    partNumbers: ['90311-38054', '90311-38053'],
    name: 'Rear Crankshaft Seal — Toyota Hilux/Land Cruiser',
    type: 'seal',
    searchTerms: ['hilux crankshaft seal','hilux rear crank seal','land cruiser crank seal',
      'toyota diesel crank seal','1kz seal','5l crank seal'],
    applications: ['Toyota Hilux diesel', 'Land Cruiser diesel', 'Toyota Surf diesel'],
  },
  {
    partNumbers: ['90311-40060'],
    name: 'Front Crankshaft Seal — Toyota Hilux 1KZ/2TR',
    type: 'seal',
    searchTerms: ['hilux front crank seal','1kz front seal','2tr front seal',
      'hilux front crankshaft','land cruiser front seal'],
    applications: ['Toyota Hilux 1KZ-TE', 'Toyota Hilux 2TR-FE', 'Toyota Land Cruiser (1KZ)'],
  },
  {
    partNumbers: ['8-94127-218-1', '8-94127-219-0'],
    name: 'Crankshaft Seal Set — Isuzu 4JB1/4JA1',
    type: 'seal',
    searchTerms: ['isuzu crank seal','4jb1 crank seal','4ja1 crank seal','dmax crank seal',
      'isuzu crankshaft seal','isuzu dmax seal','isuzu rodeo seal'],
    applications: ['Isuzu 4JB1/4JA1', 'Isuzu D-Max (older)', 'Isuzu KB/Rodeo'],
  },
  {
    partNumbers: ['901MF135', '1876440M1'],
    name: 'Front Axle Seal — MF 135',
    type: 'seal',
    searchTerms: ['mf 135 seal','mf axle seal','massey 135 front axle seal',
      'mf front axle seal','mf135 seal'],
    applications: ['MF 135 front axle trumpet housing seal'],
  },
  {
    partNumbers: ['SG2-35', 'SG2-40'],
    name: 'Kingpin Seal Kit',
    type: 'seal',
    searchTerms: ['kingpin seal','king pin seal','axle kingpin seal','steering kingpin seal',
      'hilux kingpin','land cruiser kingpin','tractor kingpin'],
    applications: ['Toyota Hilux/Land Cruiser kingpin', 'Tractor front axle kingpin'],
  },
  {
    partNumbers: ['MF135-HG', '1860286M2'],
    name: 'Head Gasket — MF 135 (Perkins A4.212)',
    type: 'gasket',
    searchTerms: ['mf 135 head gasket','massey 135 head gasket','perkins head gasket',
      'mf head gasket','a4.212 head gasket','mf135 head gasket'],
    applications: ['MF 135 (Perkins A4.212 engine)'],
  },
  {
    partNumbers: ['MF290-HG', '3638467M1'],
    name: 'Head Gasket — MF 290 (Perkins A6.354)',
    type: 'gasket',
    searchTerms: ['mf 290 head gasket','mf 375 head gasket','perkins 6 cylinder head gasket',
      'mf290 head gasket','a6.354 head gasket','mf 390 head gasket'],
    applications: ['MF 290/375/385/390 (Perkins A6.354)'],
  },
  {
    partNumbers: ['11115-54060', '11115-54061'],
    name: 'Head Gasket — Toyota 5L (Hilux)',
    type: 'gasket',
    searchTerms: ['hilux head gasket','toyota 5l head gasket','land cruiser head gasket',
      '5l head gasket','hilux diesel head gasket','surf head gasket'],
    applications: ['Toyota Hilux 5L diesel', 'Toyota Land Cruiser 5L', 'Toyota Surf 5L'],
  },
  {
    partNumbers: ['11115-67040', '11115-67041'],
    name: 'Head Gasket — Toyota 1KZ-TE',
    type: 'gasket',
    searchTerms: ['1kz head gasket','hilux 1kz head gasket','prado head gasket',
      '1kz-te head gasket','surf 1kz','hilux 3000 head gasket'],
    applications: ['Toyota Hilux 1KZ-TE', 'Toyota Prado 1KZ', 'Toyota Surf 1KZ'],
  },
  {
    partNumbers: ['8-94392-024-0', '8-94392-024-1'],
    name: 'Head Gasket — Isuzu 4JB1',
    type: 'gasket',
    searchTerms: ['isuzu head gasket','4jb1 head gasket','dmax head gasket','isuzu dmax head gasket',
      '4ja1 head gasket','isuzu rodeo head gasket'],
    applications: ['Isuzu 4JB1/4JA1', 'Isuzu D-Max (older)', 'Isuzu Rodeo/KB'],
  },

  // ═══════════════════════════════════════════════════════
  // AGRICULTURAL IMPLEMENT BEARINGS (local names)
  // ═══════════════════════════════════════════════════════
  {
    partNumbers: ['6306', '6307', '1985/1932'],
    name: 'Baldan / Disc Plough Bearing',
    type: 'bearing',
    searchTerms: ['baldan bearing','baldan disc bearing','baldan plough bearing',
      'disc plough bearing','baldan','plough bearing','disc bearing baldan',
      'baldan disc','nardi bearing','mersey bearing','nardi plough','mersey plough'],
    applications: ['Baldan disc ploughs', 'Nardi disc ploughs', 'Mersey disc ploughs', 'Generic 18-28" disc ploughs'],
  },
  {
    partNumbers: ['30206', '30207', '30205'],
    name: 'Furrow Wheel Bearing (MF/Ford)',
    type: 'bearing',
    searchTerms: ['furrow wheel','furrow wheel bearing','furgerson furrow','mf furrow wheel',
      'massey furrow','ford furrow wheel','plough furrow','furrow bearing'],
    applications: ['MF 135/165/290 furrow wheel', 'Ford 3000/4000/5000 furrow wheel', 'Generic mouldboard plough furrow wheel'],
  },
  {
    partNumbers: ['6204', '6205', '6206'],
    name: 'Planter / Seeder Bearing',
    type: 'bearing',
    searchTerms: ['planter bearing','seeder bearing','maize planter bearing','planter',
      'seed drill bearing','sunflower planter bearing','grain drill bearing',
      'kubota planter bearing'],
    applications: ['Maize planters', 'Sunflower planters', 'Seed drill/grain drill', 'Row crop planters'],
  },
  {
    partNumbers: ['6306', '6307', '6308'],
    name: 'Disc Harrow Bearing',
    type: 'bearing',
    searchTerms: ['disc harrow bearing','harrow bearing','harrow disc bearing',
      'offset disc harrow','tandem disc bearing','disc harrow'],
    applications: ['Disc harrows (offset/tandem)', 'Rotary harrows', 'Secondary tillage implements'],
  },
  {
    partNumbers: ['6205', '6206', '6204'],
    name: 'Chambuli Bearing (Generic small ball bearing)',
    type: 'bearing',
    searchTerms: ['chambuli','chambuli bearing','small bearing','general bearing',
      'generic ball bearing'],
    applications: ['Generic farm equipment', 'Small implements', 'Pumps and motors'],
  },

  // ═══════════════════════════════════════════════════════
  // CLUTCH RELATED
  // ═══════════════════════════════════════════════════════
  {
    partNumbers: ['MF135-CK', '1860186M1'],
    name: 'Clutch Kit — MF 135',
    type: 'clutch',
    searchTerms: ['mf 135 clutch','massey 135 clutch','mf135 clutch kit','mf clutch kit'],
    applications: ['MF 135 (11" clutch kit — plate, cover, bearing)'],
  },
  {
    partNumbers: ['31250-36160', '3125036160'],
    name: 'Clutch Release Bearing — Toyota Probox/Corolla',
    type: 'bearing',
    searchTerms: ['probox clutch bearing','nze clutch bearing','corolla clutch bearing',
      'probox clutch release','toyota clutch release bearing','clutch release bearing probox'],
    applications: ['Toyota Probox', 'Toyota Corolla NZE/ZZE', 'Toyota Premio'],
  },
  {
    partNumbers: ['31230-35200', '3123035200'],
    name: 'Clutch Release Bearing — Toyota Hilux',
    type: 'bearing',
    searchTerms: ['hilux clutch release bearing','hilux clutch bearing','land cruiser clutch bearing',
      'toyota hilux clutch bearing'],
    applications: ['Toyota Hilux (1KZ/5L/3L/1GD)', 'Land Cruiser 70 series'],
  },
  {
    partNumbers: ['ME521840', 'ME514600'],
    name: 'Clutch Release Bearing — Fuso Canter',
    type: 'bearing',
    searchTerms: ['canter clutch bearing','fuso canter clutch','canter clutch release',
      'fuso clutch bearing'],
    applications: ['Fuso Canter FE (4D34/4M50)', 'Mitsubishi Rosa bus'],
  },

  // ═══════════════════════════════════════════════════════
  // MISCELLANEOUS COMMON PARTS
  // ═══════════════════════════════════════════════════════
  {
    partNumbers: ['7701471788', 'B48', 'GFE102-5'],
    name: 'Alternator Belt (Probox/NZE)',
    type: 'belt',
    searchTerms: ['probox alternator belt','nze alternator belt','probox belt','corolla belt',
      'alternator belt probox','vitz belt','toyota small car belt','nze belt'],
    applications: ['Toyota Probox', 'Toyota NZE Corolla', 'Toyota Vitz 1.0/1.3', 'Toyota Platz'],
  },
  {
    partNumbers: ['7PK1975', '7PK2115'],
    name: 'Serpentine/Alternator Belt — Hilux/Land Cruiser',
    type: 'belt',
    searchTerms: ['hilux alternator belt','land cruiser alternator belt','hilux belt',
      'toyota diesel belt','alternator belt hilux','land cruiser belt'],
    applications: ['Toyota Hilux diesel (1KZ/5L/1GD)', 'Land Cruiser 70 series'],
  },
  {
    partNumbers: ['B38', 'B40', 'B42'],
    name: 'MF Tractor Fan Belt',
    type: 'belt',
    searchTerms: ['mf fan belt','mf 135 fan belt','massey fan belt','tractor fan belt',
      'perkins fan belt','mf 290 fan belt'],
    applications: ['MF 135/165/290/375 (Perkins engines)', 'Ford 3000/4000'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FUZZY / SCORED SEARCH ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function normalise(str) {
  return (str || '').toLowerCase()
    .replace(/[-–—\/\\()\[\],.!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenise(str) {
  return normalise(str).split(' ').filter(t => t.length >= 2);
}

// Returns 0-100 score for how well a knowledge entry matches the query
function scoreEntry(entry, queryNorm, queryTokens) {
  let score = 0;

  // Direct part number match — very high score
  for (const pn of entry.partNumbers) {
    const normPn = normalise(pn);
    if (queryNorm === normPn || queryNorm.includes(normPn) || normPn.includes(queryNorm)) {
      score += 80;
      break;
    }
  }

  // Search term match
  for (const term of entry.searchTerms) {
    const normTerm = normalise(term);
    if (queryNorm === normTerm) { score += 70; break; }
    if (queryNorm.includes(normTerm) || normTerm.includes(queryNorm)) { score += 50; break; }
  }

  // Token matching — count how many query tokens appear in any search term
  let tokenHits = 0;
  for (const token of queryTokens) {
    const inSearchTerms = entry.searchTerms.some(t => normalise(t).includes(token));
    const inName = normalise(entry.name).includes(token);
    const inApps = entry.applications.some(a => normalise(a).includes(token));
    const inParts = entry.partNumbers.some(p => normalise(p).includes(token));
    if (inParts) { tokenHits += 3; }
    else if (inSearchTerms) { tokenHits += 2; }
    else if (inName) { tokenHits += 1; }
    else if (inApps) { tokenHits += 1; }
  }
  // Bonus for hitting multiple tokens (longer query match = higher confidence)
  if (queryTokens.length > 0) {
    score += Math.round((tokenHits / queryTokens.length) * 30) + (tokenHits > 1 ? 10 : 0);
  }

  return Math.min(score, 100);
}

function searchKnowledge(rawQuery) {
  const qNorm = normalise(rawQuery);
  const qTokens = tokenise(rawQuery);
  if (!qNorm || qTokens.length === 0) return [];

  const scored = PARTS_KNOWLEDGE.map(entry => ({
    entry,
    score: scoreEntry(entry, qNorm, qTokens),
  }))
    .filter(r => r.score >= 15)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return scored;
}

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY MATCHING
// ─────────────────────────────────────────────────────────────────────────────

// Find inventory items that match a list of part numbers
function findInventoryItems(inventory, partNumbers) {
  const results = [];
  const normParts = partNumbers.map(p => normalise(p));

  for (const item of inventory) {
    const itemName = normalise(item.name || '');
    const itemSku = String(item.sku || '');

    for (const pn of normParts) {
      if (itemName === pn || itemName.includes(pn) || pn.includes(itemName) ||
          itemSku === pn) {
        if (!results.find(r => r.sku === item.sku)) results.push(item);
        break;
      }
    }
  }
  return results;
}

// Direct inventory search by query (fallback when no knowledge match)
function directInventorySearch(inventory, rawQuery) {
  const qNorm = normalise(rawQuery);
  const qTokens = tokenise(rawQuery);
  if (qTokens.length === 0) return [];

  return inventory.filter(item => {
    const name = normalise(item.name || '');
    const desc = normalise(item.description || '');
    const cat  = normalise(item.category || '');
    const combined = `${name} ${desc} ${cat}`;

    // All tokens must appear somewhere
    return qTokens.every(t => combined.includes(t)) ||
           name.includes(qNorm) ||
           qNorm.includes(name);
  }).slice(0, 5);
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE FORMATTER
// ─────────────────────────────────────────────────────────────────────────────

function formatInStock(item, knowledge) {
  const marginLine = knowledge ? `🔩 Part: ${knowledge.name}` : '';
  const dimsLine   = knowledge?.dimensions ? `📐 Dimensions: ${knowledge.dimensions}` : '';
  const appsLine   = knowledge?.applications?.length
    ? `🚜 Fits: ${knowledge.applications.slice(0, 4).join(' · ')}`
    : '';
  const partsLine  = knowledge?.partNumbers?.length > 1
    ? `🔄 Alt #: ${knowledge.partNumbers.slice(1, 4).join(', ')}`
    : '';

  return [
    `📦 *${item.name || 'Part'}*${knowledge && item.name !== knowledge.name ? `\n   (${knowledge.name})` : ''}`,
    `🔢 SKU: ${item.sku}`,
    `💰 Price: KSh ${(item.price || 0).toLocaleString()}`,
    `📊 Stock: *${item.stock}* units in stock`,
    dimsLine,
    appsLine,
    partsLine,
  ].filter(Boolean).join('\n');
}

function formatOutOfStock(item, knowledge) {
  const dimsLine  = knowledge?.dimensions ? `📐 Dimensions: ${knowledge.dimensions}` : '';
  const appsLine  = knowledge?.applications?.length
    ? `🚜 Fits: ${knowledge.applications.slice(0, 4).join(' · ')}`
    : '';

  return [
    `📦 *${item.name || 'Part'}*`,
    `🔢 SKU: ${item.sku}`,
    `📊 Currently *OUT OF STOCK*`,
    dimsLine,
    appsLine,
    `💡 We can order for you — WhatsApp us: wa.me/254726241408`,
  ].filter(Boolean).join('\n');
}

function formatKnownNotInInventory(knowledge) {
  const dimsLine = knowledge.dimensions ? `📐 Dimensions: ${knowledge.dimensions}` : '';
  const appsLine = knowledge.applications?.length
    ? `🚜 Fits: ${knowledge.applications.slice(0, 4).join(' · ')}`
    : '';
  const partsLine = knowledge.partNumbers?.length
    ? `🔢 Part #: ${knowledge.partNumbers.slice(0, 4).join(' / ')}`
    : '';

  return [
    `📦 *${knowledge.name}*`,
    partsLine,
    dimsLine,
    appsLine,
    `⚠️ Not currently in our stock`,
    `💬 We can source this for you — WhatsApp: wa.me/254726241408`,
  ].filter(Boolean).join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN QUERY HANDLER
// ─────────────────────────────────────────────────────────────────────────────

async function handleQuery(rawQuery) {
  const inventory = await getInventory();
  const scored = searchKnowledge(rawQuery);

  // Gather all candidate part numbers from top knowledge matches
  const topMatches = scored.filter(r => r.score >= 20);
  const allPartNumbers = [...new Set(topMatches.flatMap(r => r.entry.partNumbers))];

  // Find inventory items matching those part numbers
  const knownInvItems = findInventoryItems(inventory, allPartNumbers);

  // Also do a direct inventory search
  const directItems = directInventorySearch(inventory, rawQuery).filter(
    d => !knownInvItems.find(k => k.sku === d.sku)
  );

  const allInventoryMatches = [...knownInvItems, ...directItems];

  // ── Case 1: Multiple inventory matches ────────────────────────────────────
  if (allInventoryMatches.length > 3) {
    const lines = allInventoryMatches.slice(0, 6).map((item, i) => {
      const inStock = (item.stock || 0) > 0;
      const stockLabel = inStock ? `✅ ${item.stock} in stock · KSh ${(item.price||0).toLocaleString()}` : '❌ Out of stock';
      return `${i + 1}. *${item.name}* — ${stockLabel}`;
    });
    return `🔍 Found ${allInventoryMatches.length} matching parts:\n\n${lines.join('\n')}\n\nSend the number for full details, or be more specific.`;
  }

  // ── Case 2: One or two inventory matches ──────────────────────────────────
  if (allInventoryMatches.length >= 1 && allInventoryMatches.length <= 3) {
    // For exactly one match, show full detail
    if (allInventoryMatches.length === 1) {
      const item = allInventoryMatches[0];
      const knowledge = topMatches.find(r => r.entry.partNumbers.some(p =>
        normalise(p) === normalise(item.name) || normalise(item.name).includes(normalise(p)))
      )?.entry;

      if ((item.stock || 0) > 0) return formatInStock(item, knowledge);
      return formatOutOfStock(item, knowledge);
    }
    // Multiple matches — show compact list
    const lines = allInventoryMatches.map((item, i) => {
      const inStock = (item.stock || 0) > 0;
      const stockLabel = inStock ? `✅ KSh ${(item.price||0).toLocaleString()} · ${item.stock} in stock` : '❌ Out of stock';
      return `${i + 1}. *${item.name}* — ${stockLabel}`;
    });
    return `🔍 Found ${allInventoryMatches.length} matches:\n\n${lines.join('\n')}\n\nSend the number for full details.`;
  }

  // ── Case 3: Not in inventory, but we know the part ────────────────────────
  if (topMatches.length > 0) {
    const best = topMatches[0].entry;

    // If there are multiple distinct knowledge matches, list them
    if (topMatches.length > 1 && topMatches[1].score >= 40) {
      const lines = topMatches.slice(0, 4).map((r, i) => {
        const { entry } = r;
        return `${i + 1}. *${entry.name}* — ${entry.partNumbers.slice(0, 2).join('/')}${entry.dimensions ? ' · ' + entry.dimensions : ''}`;
      });
      return `🔍 No inventory match, but found ${topMatches.length} compatible parts:\n\n${lines.join('\n')}\n\n💬 WhatsApp us to check availability or place an order.\nwa.me/254726241408`;
    }

    return formatKnownNotInInventory(best);
  }

  // ── Case 4: Nothing found ─────────────────────────────────────────────────
  return `❓ No results found for: _"${rawQuery}"_\n\n` +
    `Try:\n` +
    `• Part number (e.g. _6204_, _30206_)\n` +
    `• Vehicle + part (e.g. _mf 135 front bearing_)\n` +
    `• Use /popular for common parts\n` +
    `• WhatsApp us: wa.me/254726241408`;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

function handleStart(firstName) {
  return `🔧 *Welcome to KaranjAuto Parts Finder!*\n\n` +
    `Hello ${firstName || 'there'}! I can help you find:\n` +
    `• 🛞 Bearings (tractor, vehicle, implement)\n` +
    `• 🔧 Filters (oil, fuel, air)\n` +
    `• 🔩 Seals & gaskets\n` +
    `• ⚙️ Belts & other parts\n\n` +
    `*Just describe what you need:*\n` +
    `_"mf 135 front wheel bearing"_\n` +
    `_"john deere 3440 oil filter"_\n` +
    `_"baldan disc bearing"_\n` +
    `_"probox clutch"_\n\n` +
    `Commands: /help · /categories · /popular\n\n` +
    `📍 *KaranjAuto Parts* | @PartsLedgerbot`;
}

function handleHelp() {
  return `📖 *How to search:*\n\n` +
    `*By tractor + part:*\n` +
    `→ _mf 135 front wheel bearing_\n` +
    `→ _massey ferguson 290 oil filter_\n` +
    `→ _ford 3000 furrow wheel_\n` +
    `→ _case jx75 filter_\n` +
    `→ _john deere 3440 fuel filter_\n` +
    `→ _kubota oil filter_\n` +
    `→ _new holland tt55 bearing_\n\n` +
    `*By vehicle + part:*\n` +
    `→ _probox front bearing_\n` +
    `→ _hilux oil filter_\n` +
    `→ _land cruiser diff bearing_\n` +
    `→ _isuzu dmax filter_\n` +
    `→ _canter clutch bearing_\n\n` +
    `*By implement:*\n` +
    `→ _baldan disc bearing_\n` +
    `→ _furrow wheel bearing_\n` +
    `→ _planter bearing_\n` +
    `→ _disc harrow bearing_\n\n` +
    `*By part number:*\n` +
    `→ _6204_ · _30206_ · _32210_\n\n` +
    `Commands: /popular /categories\n` +
    `📞 WhatsApp: wa.me/254726241408`;
}

function handleCategories() {
  return `📦 *Parts Categories:*\n\n` +
    `🛞 *Bearings*\n` +
    `  • Tapered roller (tractor/truck wheels)\n` +
    `  • Deep groove ball (implements/pumps)\n` +
    `  • Disc plough bearings\n` +
    `  • Furrow wheel bearings\n` +
    `  • Planter/seeder bearings\n\n` +
    `🔧 *Filters*\n` +
    `  • Oil filters (tractor & vehicle)\n` +
    `  • Fuel filters\n` +
    `  • Air filters\n\n` +
    `🔩 *Seals & Gaskets*\n` +
    `  • Crankshaft seals\n` +
    `  • Head gaskets\n` +
    `  • Kingpin seals\n` +
    `  • Axle seals\n\n` +
    `⚙️ *Other*\n` +
    `  • Clutch kits & release bearings\n` +
    `  • Fan & alternator belts\n\n` +
    `Search by tractor/vehicle + part type\nor send a part number directly.`;
}

async function handlePopular() {
  const inventory = await getInventory();
  const popularParts = ['30206', '30207', '6204', '6306', '30208', '6206', '32210'];

  const lines = [];
  for (const pn of popularParts) {
    const item = inventory.find(i => normalise(i.name || '') === normalise(pn));
    if (item) {
      const inStock = (item.stock || 0) > 0;
      lines.push(`• *${item.name}* — ${inStock ? `KSh ${(item.price||0).toLocaleString()} ✅` : '❌ Out of stock'}`);
    }
  }

  const intro = `⭐ *Popular Parts in Stock:*\n\n`;
  const suffix = `\nSearch by part number or vehicle type.\n/help for search tips`;

  if (!lines.length) return intro + '_Checking inventory..._\n' + suffix;
  return intro + lines.join('\n') + suffix;
}

async function handleCategories_inventory() {
  const inventory = await getInventory();
  const cats = {};
  for (const item of inventory) {
    const cat = item.category || 'Other';
    if (!cats[cat]) cats[cat] = { total: 0, inStock: 0 };
    cats[cat].total++;
    if ((item.stock || 0) > 0) cats[cat].inStock++;
  }
  const lines = Object.entries(cats)
    .sort((a, b) => b[1].inStock - a[1].inStock)
    .map(([cat, data]) => `• *${cat}*: ${data.inStock}/${data.total} items in stock`);

  return `📦 *Our Inventory by Category:*\n\n${lines.join('\n')}\n\nTotal: ${inventory.length} SKUs\nSearch by category name or part number.`;
}

// Handle numbered selection after a multi-result response
// We do it simply: user sends "1", "2", "3" after a search
// Not stateful — we'd need session storage for that; instead we tell user to be more specific

// ─────────────────────────────────────────────────────────────────────────────
// TELEGRAM API HELPER
// ─────────────────────────────────────────────────────────────────────────────

async function sendMessage(chatId, text, parseMode = 'Markdown') {
  try {
    const r = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      console.error('Telegram sendMessage error:', err);
    }
  } catch (e) {
    console.error('sendMessage exception:', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VERCEL HANDLER
// ─────────────────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      bot: 'KaranjAuto Parts Finder',
      knowledge_entries: PARTS_KNOWLEDGE.length,
    });
  }

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // Vercel parses JSON automatically
  const update = req.body;
  if (!update) return res.status(200).json({ ok: true });

  const msg = update.message || update.edited_message;
  if (!msg || !msg.text) return res.status(200).json({ ok: true });

  const chatId    = msg.chat.id;
  const text      = (msg.text || '').trim();
  const firstName = msg.from?.first_name || '';

  console.log(`[${chatId}] ${firstName}: ${text}`);

  let reply = '';

  try {
    const tl = text.toLowerCase();

    if (tl === '/start' || tl === '/start@partsbot') {
      reply = handleStart(firstName);
    } else if (tl === '/help' || tl === '/help@partsbot') {
      reply = handleHelp();
    } else if (tl === '/categories' || tl === '/categories@partsbot') {
      reply = await handleCategories_inventory();
    } else if (tl === '/popular' || tl === '/popular@partsbot') {
      reply = await handlePopular();
    } else if (text.startsWith('/')) {
      reply = `❓ Unknown command.\n\nTry:\n/start — Welcome\n/help — How to search\n/categories — Browse categories\n/popular — Popular parts\n\nOr just describe what you need!`;
    } else {
      // Main search
      reply = await handleQuery(text);
    }
  } catch (e) {
    console.error('Handler error:', e);
    reply = `⚠️ Something went wrong. Please try again or WhatsApp us: wa.me/254726241408`;
  }

  await sendMessage(chatId, reply);
  return res.status(200).json({ ok: true });
};
