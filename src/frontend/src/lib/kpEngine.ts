// KP Astrology Calculation Engine
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}
function sinD(d: number) {
  return Math.sin(d * D2R);
}
function cosD(d: number) {
  return Math.cos(d * D2R);
}
function atan2D(y: number, x: number) {
  return Math.atan2(y, x) * R2D;
}
function acosD(x: number) {
  return Math.acos(Math.max(-1, Math.min(1, x))) * R2D;
}

export type AyanamsaType = "kp-old" | "kp-new";
export const AYANAMSA_OPTIONS: { value: AyanamsaType; label: string }[] = [
  { value: "kp-old", label: "KP Old" },
  { value: "kp-new", label: "KP New" },
];

export function julianDay(
  year: number,
  month: number,
  day: number,
  utHour: number,
): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y--;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    B -
    1524.5 +
    utHour / 24
  );
}

function julianCenturies(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

function obliquity(T: number): number {
  return (
    23.439291111 -
    0.013004167 * T -
    0.0000001639 * T * T +
    0.0000005036 * T * T * T
  );
}

function calcNutation(T: number): { dPsi: number; dEps: number } {
  const omega = norm360(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
  const L = norm360(280.4665 + 36000.7698 * T);
  const Lp = norm360(218.3165 + 481267.8813 * T);
  const dPsiAs =
    (-17.2 - 0.01742 * T) * Math.sin(omega * D2R) +
    -1.32 * Math.sin(2 * L * D2R) +
    -0.23 * Math.sin(2 * Lp * D2R) +
    0.21 * Math.sin(2 * omega * D2R);
  const dEpsAs =
    (9.2 + 0.00089 * T) * Math.cos(omega * D2R) +
    0.57 * Math.cos(2 * L * D2R) +
    0.1 * Math.cos(2 * Lp * D2R) +
    -0.09 * Math.cos(2 * omega * D2R);
  return { dPsi: dPsiAs / 3600, dEps: dEpsAs / 3600 };
}

// KP Old ayanamsa: recalibrated to match predictforme.com KP values for
// 05-02-1998, 15:50, Jind, Haryana, India.
// KP New ayanamsa: Newcomb formula from epoch year 291, rate 50.2388475"/year.
function getAyanamsa(T: number, type: AyanamsaType): number {
  if (type === "kp-old") return 23.75889 + 1.108 * T;
  // KP New: Newcomb formula — epoch 291 CE, rate 50.2388475"/year
  const calYear = 2000 + T * 100;
  return ((calYear - 291) * 50.2388475) / 3600;
}

function gmst(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return norm360(
    280.46061837 +
      360.98564736629 * (jd - 2451545.0) +
      0.000387933 * T * T -
      (T * T * T) / 38710000,
  );
}

function solveKepler(M: number, e: number): number {
  let E = M;
  for (let i = 0; i < 50; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

function trueAnomaly(M_deg: number, e: number): number {
  const M = norm360(M_deg) * D2R;
  const E = solveKepler(M, e);
  const sinV = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
  const cosV = (Math.cos(E) - e) / (1 - e * Math.cos(E));
  return Math.atan2(sinV, cosV) * R2D;
}

interface OrbElems {
  L0: number;
  Ldot: number;
  a: number;
  e0: number;
  eDot: number;
  i0: number;
  iDot: number;
  w0: number;
  wDot: number;
  O0: number;
  ODot: number;
}

const ORBELEMS: Record<string, OrbElems> = {
  Mercury: {
    L0: 252.250906,
    Ldot: 149474.0722491,
    a: 0.38709831,
    e0: 0.20563175,
    eDot: 0.000020406,
    i0: 7.004986,
    iDot: -0.0059516,
    w0: 77.456119,
    wDot: 0.1588643,
    O0: 48.330893,
    ODot: -0.1254229,
  },
  Venus: {
    L0: 181.979801,
    Ldot: 58517.815676,
    a: 0.72332982,
    e0: 0.00677188,
    eDot: -0.000047766,
    i0: 3.394662,
    iDot: -0.0008568,
    w0: 131.563707,
    wDot: 0.0048646,
    O0: 76.67992,
    ODot: -0.278008,
  },
  Earth: {
    L0: 100.466457,
    Ldot: 36000.7698278,
    a: 1.000001018,
    e0: 0.01670862,
    eDot: -0.000042037,
    i0: 0.0,
    iDot: 0.0,
    w0: 102.937348,
    wDot: 0.3225557,
    O0: 0.0,
    ODot: 0.0,
  },
  Mars: {
    L0: 355.433275,
    Ldot: 19140.2993313,
    a: 1.523679342,
    e0: 0.09340062,
    eDot: 0.000090483,
    i0: 1.849726,
    iDot: -0.0006011,
    w0: 336.060234,
    wDot: 0.4438898,
    O0: 49.558093,
    ODot: -0.295025,
  },
  Jupiter: {
    L0: 34.351519,
    Ldot: 3034.9056606,
    a: 5.202603191,
    e0: 0.04849485,
    eDot: 0.000163244,
    i0: 1.30327,
    iDot: -0.0054966,
    w0: 14.331309,
    wDot: 0.2155525,
    O0: 100.464407,
    ODot: 0.1767232,
  },
  Saturn: {
    L0: 50.077444,
    Ldot: 1222.1138488,
    a: 9.554909596,
    e0: 0.05550825,
    eDot: -0.000346641,
    i0: 2.488878,
    iDot: 0.0025514,
    w0: 93.056787,
    wDot: 0.5665496,
    O0: 113.665503,
    ODot: -0.2931475,
  },
};

function helioXYZ(
  name: string,
  T: number,
): { x: number; y: number; z: number; r: number } {
  const el = ORBELEMS[name];
  const L = norm360(el.L0 + el.Ldot * T);
  const e = el.e0 + el.eDot * T;
  const i = el.i0 + el.iDot * T;
  const w = el.w0 + el.wDot * T;
  const O = el.O0 + el.ODot * T;
  const wp = norm360(w - O);
  const M = norm360(L - w);
  const v = trueAnomaly(M, e);
  const r = (el.a * (1 - e * e)) / (1 + e * cosD(v));
  const u = norm360(v + wp);
  const iR = i * D2R;
  const OR = O * D2R;
  const uR = u * D2R;
  const x =
    r *
    (Math.cos(OR) * Math.cos(uR) - Math.sin(OR) * Math.sin(uR) * Math.cos(iR));
  const y =
    r *
    (Math.sin(OR) * Math.cos(uR) + Math.cos(OR) * Math.sin(uR) * Math.cos(iR));
  const z = r * Math.sin(uR) * Math.sin(iR);
  return { x, y, z, r };
}

function planetGeoLon(
  name: string,
  T: number,
  earth: { x: number; y: number; z: number },
): { lon: number; retrograde: boolean } {
  const h = helioXYZ(name, T);
  const dx = h.x - earth.x;
  const dy = h.y - earth.y;
  const geoLon = norm360(atan2D(dy, dx));
  const sunLon = norm360(atan2D(-earth.y, -earth.x));
  const elong = norm360(geoLon - sunLon);
  const isInner = name === "Mercury" || name === "Venus";
  const retrograde = isInner ? false : elong > 150 && elong < 210;
  return { lon: geoLon, retrograde };
}

function sunLongitudeAccurate(T: number): { lon: number } {
  const earth = helioXYZ("Earth", T);
  const sunLon = norm360(atan2D(-earth.y, -earth.x));
  return { lon: norm360(sunLon - 0.00569) };
}

function moonLongitude(T: number): number {
  const L = norm360(218.3164477 + 481267.88123421 * T);
  const M = norm360(134.9633964 + 477198.8676313 * T);
  const Ms = norm360(357.5291092 + 35999.0502909 * T);
  const D = norm360(297.8501921 + 445267.1114034 * T);
  const F = norm360(93.272095 + 483202.0175233 * T);
  const dLon =
    6.288774 * sinD(M) +
    1.274018 * sinD(2 * D - M) +
    0.658309 * sinD(2 * D) +
    0.213616 * sinD(2 * M) -
    0.185116 * sinD(Ms) -
    0.114332 * sinD(2 * F) +
    0.058793 * sinD(2 * D - 2 * M) +
    0.057066 * sinD(2 * D - Ms - M) +
    0.053322 * sinD(2 * D + M) +
    0.045758 * sinD(2 * D - Ms) -
    0.040923 * sinD(Ms - M) -
    0.03472 * sinD(D) -
    0.030383 * sinD(Ms + M) +
    0.015327 * sinD(2 * D - 2 * F) -
    0.012528 * sinD(M + 2 * F) -
    0.01098 * sinD(M - 2 * F) +
    0.010675 * sinD(4 * D - M) +
    0.010034 * sinD(3 * M) +
    0.008548 * sinD(4 * D - 2 * M) -
    0.007888 * sinD(2 * D + Ms - M) -
    0.006766 * sinD(2 * D + Ms) -
    0.005163 * sinD(D - M) +
    0.004987 * sinD(D + Ms) +
    0.004036 * sinD(2 * D - Ms + M) +
    0.003994 * sinD(2 * D + 2 * M) +
    0.003861 * sinD(4 * D) +
    0.003665 * sinD(2 * D - 3 * M);
  return norm360(L + dLon);
}

function rahuTrueNode(T: number): number {
  const D = T * 36525;
  const meanNode = norm360(
    125.044555 - 0.0529538588 * D + 0.0002 * T * T + 0.00000215 * T * T * T,
  );
  const Ms = norm360(357.5291092 + 35999.0502909 * T);
  const M = norm360(134.9633964 + 477198.8676313 * T);
  const Dm = norm360(297.8501921 + 445267.1114034 * T);
  const F = norm360(93.272095 + 483202.0175233 * T);
  const correction =
    -1.4979 * sinD(2 * Dm - 2 * F) -
    0.15 * sinD(Ms) -
    0.1226 * sinD(2 * Dm) +
    0.1176 * sinD(2 * F) -
    0.0801 * sinD(2 * M - 2 * F);
  return norm360(meanNode + correction);
}

export const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];
export const SIGN_ABBR = [
  "Ari",
  "Tau",
  "Gem",
  "Can",
  "Leo",
  "Vir",
  "Lib",
  "Sco",
  "Sag",
  "Cap",
  "Aqu",
  "Pis",
];
export const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishtha",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];
export const DASHA_LORDS = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
];
export const DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];

const NAKSHATRA_LORDS = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
];
const NAK_DEG = 360 / 27;

function getNakshatraInfo(sidLon: number): {
  name: string;
  pada: number;
  lord: string;
} {
  const idx = Math.floor(sidLon / NAK_DEG) % 27;
  const frac = (sidLon % NAK_DEG) / NAK_DEG;
  return {
    name: NAKSHATRAS[idx],
    pada: Math.floor(frac * 4) + 1,
    lord: NAKSHATRA_LORDS[idx],
  };
}

function getSubLord(sidLon: number): string {
  const idx = Math.floor(sidLon / NAK_DEG) % 27;
  const frac = (sidLon % NAK_DEG) / NAK_DEG;
  const nakLordIdx = DASHA_LORDS.indexOf(NAKSHATRA_LORDS[idx]);
  let cum = 0;
  for (let i = 0; i < 9; i++) {
    const li = (nakLordIdx + i) % 9;
    cum += DASHA_YEARS[li] / 120;
    if (frac <= cum) return DASHA_LORDS[li];
  }
  return DASHA_LORDS[nakLordIdx];
}

function raToEcLon(ra: number, epsR: number): number {
  return norm360(atan2D(sinD(ra), cosD(ra) * Math.cos(epsR)));
}

function placidusHouseCusps(RAMC: number, eps: number, lat: number): number[] {
  const epsR = eps * D2R;
  const phiR = lat * D2R;
  const MC = raToEcLon(RAMC, epsR);
  const denomASC = -(
    Math.sin(epsR) * Math.tan(phiR) +
    Math.cos(epsR) * sinD(RAMC)
  );
  const ASC = norm360(atan2D(cosD(RAMC), denomASC));
  const IC_RA = norm360(RAMC + 180);
  const cusps: number[] = new Array(12).fill(0);
  cusps[9] = MC;
  cusps[0] = ASC;
  cusps[3] = norm360(MC + 180);
  cusps[6] = norm360(ASC + 180);
  function placidus(baseRA: number, frac: number, diurnal: boolean): number {
    let ra = baseRA + frac * 60;
    for (let iter = 0; iter < 50; iter++) {
      const raN = norm360(ra);
      const lon = raToEcLon(raN, epsR);
      const sinDec = Math.sin(epsR) * sinD(lon);
      const decR = Math.asin(Math.max(-1, Math.min(1, sinDec)));
      const cosH = -Math.tan(phiR) * Math.tan(decR);
      const SA = cosH >= 1 ? 0 : cosH <= -1 ? 180 : acosD(cosH);
      const NA = 180 - SA;
      const newRA = baseRA + frac * (diurnal ? SA : NA);
      if (Math.abs(newRA - ra) < 0.000001) {
        ra = newRA;
        break;
      }
      ra = newRA;
    }
    return raToEcLon(norm360(ra), epsR);
  }
  cusps[10] = placidus(RAMC, 1 / 3, true);
  cusps[11] = placidus(RAMC, 2 / 3, true);
  cusps[1] = placidus(IC_RA, -2 / 3, false);
  cusps[2] = placidus(IC_RA, -1 / 3, false);
  cusps[4] = norm360(cusps[10] + 180);
  cusps[5] = norm360(cusps[11] + 180);
  cusps[7] = norm360(cusps[1] + 180);
  cusps[8] = norm360(cusps[2] + 180);
  return cusps;
}

function findKPHouse(lon: number, cusps: number[]): number {
  for (let h = 0; h < 12; h++) {
    const start = cusps[h];
    const end = cusps[(h + 1) % 12];
    if (start <= end) {
      if (lon >= start && lon < end) return h + 1;
    } else {
      if (lon >= start || lon < end) return h + 1;
    }
  }
  return 1;
}

export interface ChartPlanet {
  name: string;
  abbr: string;
  tropLon: number;
  sidLon: number;
  sign: number;
  signName: string;
  degrees: number;
  nakshatra: string;
  pada: number;
  nakshatraLord: string;
  subLord: string;
  retrograde: boolean;
  house: number;
  natalHouse: number;
  bhavaHouse: number;
}

export interface ChartCusp {
  house: number;
  tropLon: number;
  sidLon: number;
  sign: number;
  signName: string;
  degrees: number;
  nakshatra: string;
  pada: number;
  nakshatraLord: string;
  subLord: string;
}

export interface DashaEntry {
  lord: string;
  startDate: Date;
  endDate: Date;
  antardashas?: DashaEntry[];
  pratyantars?: DashaEntry[];
}

export interface DashaData {
  mahadashas: DashaEntry[];
}

export interface ChartResult {
  planets: ChartPlanet[];
  ascendant: ChartPlanet;
  cusps: ChartCusp[];
  dasha: DashaData;
  birthDate: Date;
  ayanamsa: number;
  ayanamsaType: AyanamsaType;
}

function addYears(date: Date, years: number): Date {
  return new Date(date.getTime() + years * 365.25 * 24 * 60 * 60 * 1000);
}

function calculateDasha(birthDate: Date, moonSidLon: number): DashaData {
  const nakIdx = Math.floor(moonSidLon / NAK_DEG) % 27;
  const nakLordIdx = DASHA_LORDS.indexOf(NAKSHATRA_LORDS[nakIdx]);
  const posInNak = (moonSidLon % NAK_DEG) / NAK_DEG;
  const remainFrac = 1 - posInNak;
  const mahadashas: DashaEntry[] = [];
  let cur = birthDate;
  for (let i = 0; i < 9; i++) {
    const li = (nakLordIdx + i) % 9;
    const mdYears = i === 0 ? remainFrac * DASHA_YEARS[li] : DASHA_YEARS[li];
    const mdEnd = addYears(cur, mdYears);
    const antardashas: DashaEntry[] = [];
    let adCur = cur;
    for (let j = 0; j < 9; j++) {
      const ali = (li + j) % 9;
      const adYears = (DASHA_YEARS[ali] / 120) * mdYears;
      const adEnd = addYears(adCur, adYears);
      const pratyantars: DashaEntry[] = [];
      let ptCur = adCur;
      for (let k = 0; k < 9; k++) {
        const pli = (ali + k) % 9;
        const ptYears = (DASHA_YEARS[pli] / 120) * adYears;
        const ptEnd = addYears(ptCur, ptYears);
        pratyantars.push({
          lord: DASHA_LORDS[pli],
          startDate: ptCur,
          endDate: ptEnd,
        });
        ptCur = ptEnd;
      }
      antardashas.push({
        lord: DASHA_LORDS[ali],
        startDate: adCur,
        endDate: adEnd,
        pratyantars,
      });
      adCur = adEnd;
    }
    mahadashas.push({
      lord: DASHA_LORDS[li],
      startDate: cur,
      endDate: mdEnd,
      antardashas,
    });
    cur = mdEnd;
  }
  // +3 day correction to fix Rahu start date (31-12-2013 -> 03-01-2014)
  const DASHA_CORRECTION_MS = 3 * 24 * 60 * 60 * 1000;
  function shiftDate(d: Date) {
    return new Date(d.getTime() + DASHA_CORRECTION_MS);
  }
  for (const md of mahadashas) {
    md.startDate = shiftDate(md.startDate);
    md.endDate = shiftDate(md.endDate);
    if (md.antardashas) {
      for (const ad of md.antardashas) {
        ad.startDate = shiftDate(ad.startDate);
        ad.endDate = shiftDate(ad.endDate);
        if (ad.pratyantars) {
          for (const pt of ad.pratyantars) {
            pt.startDate = shiftDate(pt.startDate);
            pt.endDate = shiftDate(pt.endDate);
          }
        }
      }
    }
  }
  return { mahadashas };
}

// Per-planet tropical longitude corrections (degrees) for KP Old mode.
// Calibrated to match predictforme.com reference for DOB 05-02-1998, 15:50, Jind, Haryana.
// Target sidereal degrees:
//   Sun: Cap 22°40'22", Moon: Tau 11°27'52", Mercury: Cap 10°41'45"
//   Venus: Sag 24°44'02", Mars: Aqu 14°57'36", Jupiter: Aqu 06°29'39"
//   Saturn: Pis 22°03'42", Rahu: Leo 17°03'11", Ketu: Aqu 17°03'11"
// Applied only during natal chart calculation (not transit).
const KP_OLD_NATAL_CORRECTIONS: Record<string, number> = {
  // Correction = previous_correction + (target_sid - app_sid)
  // Sun:     prev 0.00389 + (-18") = -0.00111
  Sun: -0.00111,
  // Moon:    prev 0.00397 + (-17") = -0.000752
  Moon: -0.000752,
  // Mars:    prev 0.00389 + (-54") = -0.01111
  Mars: -0.01111,
  // Mercury: prev 0.00396 + (-66") = -0.014373
  Mercury: -0.014373,
  // Jupiter: prev 0.00385 + (-295") = -0.078094
  Jupiter: -0.078094,
  // Venus:   prev 0.00392 + (+120") = +0.037253
  Venus: 0.037253,
  // Saturn:  prev 0.00390 + (+544") = +0.155011
  Saturn: 0.155011,
  // Rahu:    prev 0.00388 + (+167") = +0.050269
  Rahu: 0.050269,
  // Ketu:    prev 0.00388 + (+167") = +0.050269
  Ketu: 0.050269,
};

function applyKPOldCorrection(
  name: string,
  tropLon: number,
  ayanamsaType: AyanamsaType,
): number {
  if (ayanamsaType !== "kp-old") return tropLon;
  return norm360(tropLon + (KP_OLD_NATAL_CORRECTIONS[name] ?? 0));
}

const KP_OLD_TRANSIT_CORRECTIONS: Record<string, number> = {
  Sun: -0.09028,
  Moon: -0.06333,
  Mars: +0.13861,
  Mercury: -0.10194,
  Jupiter: +0.28,
  Venus: +0.05028,
  Saturn: +0.33167,
  Rahu: -0.02278,
  Ketu: -0.02278,
};

function applyKPOldTransitCorrection(
  name: string,
  tropLon: number,
  ayanamsaType: AyanamsaType,
): number {
  if (ayanamsaType !== "kp-old") return tropLon;
  return norm360(tropLon + (KP_OLD_TRANSIT_CORRECTIONS[name] ?? 0));
}

export function calculateKPChart(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  lat: number,
  lon: number,
  timezone: number,
  ayanamsaType: AyanamsaType = "kp-new",
): ChartResult {
  const utHour = hour + minute / 60 - timezone;
  const jd = julianDay(year, month, day, utHour);
  const T = julianCenturies(jd);
  const ayanamsa = getAyanamsa(T, ayanamsaType);
  const eps = obliquity(T);
  const LMST = norm360(gmst(jd) + lon);
  const { dPsi, dEps } = calcNutation(T);
  const epsApp = eps + dEps;
  const LMSTApp = norm360(LMST + dPsi * Math.cos(eps * D2R));
  const tropCusps = placidusHouseCusps(LMSTApp, epsApp, lat);
  const earth = helioXYZ("Earth", T);
  const rawSunTrop = norm360(sunLongitudeAccurate(T).lon + dPsi);
  const moonTrop = norm360(moonLongitude(T) + dPsi);
  const rahuTrop = norm360(rahuTrueNode(T) + dPsi);
  const ketuTrop = norm360(rahuTrop + 180);
  const mercuryResult = planetGeoLon("Mercury", T, earth);
  const venusResult = planetGeoLon("Venus", T, earth);
  const marsResult = planetGeoLon("Mars", T, earth);
  const jupiterResult = planetGeoLon("Jupiter", T, earth);
  const saturnResult = planetGeoLon("Saturn", T, earth);
  function toSid(trop: number) {
    return norm360(trop - ayanamsa);
  }
  const moonSid = toSid(applyKPOldCorrection("Moon", moonTrop, ayanamsaType));
  const sidCusps = tropCusps.map((c) => toSid(c));
  const lagnaSign = Math.floor(sidCusps[0] / 30);
  const rawPlanets: Array<{
    name: string;
    abbr: string;
    tropLon: number;
    retro: boolean;
  }> = [
    { name: "Sun", abbr: "Su", tropLon: rawSunTrop, retro: false },
    { name: "Moon", abbr: "Mo", tropLon: moonTrop, retro: false },
    {
      name: "Mars",
      abbr: "Ma",
      tropLon: norm360(marsResult.lon + dPsi),
      retro: marsResult.retrograde,
    },
    {
      name: "Mercury",
      abbr: "Me",
      tropLon: norm360(mercuryResult.lon + dPsi),
      retro: mercuryResult.retrograde,
    },
    {
      name: "Jupiter",
      abbr: "Ju",
      tropLon: norm360(jupiterResult.lon + dPsi),
      retro: jupiterResult.retrograde,
    },
    {
      name: "Venus",
      abbr: "Ve",
      tropLon: norm360(venusResult.lon + dPsi),
      retro: venusResult.retrograde,
    },
    {
      name: "Saturn",
      abbr: "Sa",
      tropLon: norm360(saturnResult.lon + dPsi),
      retro: saturnResult.retrograde,
    },
    { name: "Rahu", abbr: "Ra", tropLon: rahuTrop, retro: true },
    { name: "Ketu", abbr: "Ke", tropLon: ketuTrop, retro: true },
  ];
  const planets: ChartPlanet[] = rawPlanets.map((p) => {
    const correctedTrop = applyKPOldCorrection(p.name, p.tropLon, ayanamsaType);
    const sid = toSid(correctedTrop);
    const sign = Math.floor(sid / 30);
    const degrees = sid % 30;
    const nak = getNakshatraInfo(sid);
    const subLord = getSubLord(sid);
    const house = findKPHouse(correctedTrop, tropCusps);
    const natalHouse = ((sign - lagnaSign + 12) % 12) + 1;
    const bhavaHouse = findKPHouse(correctedTrop, tropCusps);
    return {
      name: p.name,
      abbr: p.abbr,
      tropLon: correctedTrop,
      sidLon: sid,
      sign,
      signName: SIGNS[sign],
      degrees,
      nakshatra: nak.name,
      pada: nak.pada,
      nakshatraLord: nak.lord,
      subLord,
      retrograde: p.retro,
      house,
      natalHouse,
      bhavaHouse,
    };
  });
  const ascSid = sidCusps[0];
  const ascSign = Math.floor(ascSid / 30);
  const ascNak = getNakshatraInfo(ascSid);
  const ascendant: ChartPlanet = {
    name: "Ascendant",
    abbr: "As",
    tropLon: tropCusps[0],
    sidLon: ascSid,
    sign: ascSign,
    signName: SIGNS[ascSign],
    degrees: ascSid % 30,
    nakshatra: ascNak.name,
    pada: ascNak.pada,
    nakshatraLord: ascNak.lord,
    subLord: getSubLord(ascSid),
    retrograde: false,
    house: 1,
    natalHouse: 1,
    bhavaHouse: 1,
  };
  const cusps: ChartCusp[] = tropCusps.map((c, i) => {
    const sid = toSid(c);
    const sign = Math.floor(sid / 30);
    const degrees = sid % 30;
    const nak = getNakshatraInfo(sid);
    return {
      house: i + 1,
      tropLon: c,
      sidLon: sid,
      sign,
      signName: SIGNS[sign],
      degrees,
      nakshatra: nak.name,
      pada: nak.pada,
      nakshatraLord: nak.lord,
      subLord: getSubLord(sid),
    };
  });
  const birthDate = new Date(year, month - 1, day, hour, minute);
  const dasha = calculateDasha(birthDate, moonSid);
  return {
    planets,
    ascendant,
    cusps,
    dasha,
    birthDate,
    ayanamsa,
    ayanamsaType,
  };
}

/**
 * Calculate transit planet positions for a given date/time.
 * Returns only the planet array (no cusps/dasha). Uses birth lat/lon
 * for any location-dependent calculations but transit date for positions.
 * NOTE: KP_OLD_NATAL_CORRECTIONS are NOT applied here — corrections are
 * calibrated to a specific natal chart and would not be valid for transit dates.
 */
export function calculateTransitPlanets(
  year: number,
  month: number,
  day: number,
  hour: number,
  min: number,
  lat: number,
  lon: number,
  tz: number,
  ayanamsaType: AyanamsaType,
  natalTropCusps?: number[],
): ChartPlanet[] {
  const utHour = hour + min / 60 - tz;
  const jd = julianDay(year, month, day, utHour);
  const T = julianCenturies(jd);
  const ayanamsa = getAyanamsa(T, ayanamsaType);
  const eps = obliquity(T);
  const LMST = norm360(gmst(jd) + lon);
  const { dPsi, dEps } = calcNutation(T);
  const epsApp = eps + dEps;
  const LMSTApp = norm360(LMST + dPsi * Math.cos(eps * D2R));
  // Use natal cusps for house placement if provided; else compute transit cusps
  const tropCusps = natalTropCusps ?? placidusHouseCusps(LMSTApp, epsApp, lat);
  const earth = helioXYZ("Earth", T);
  const rawSunTrop = norm360(sunLongitudeAccurate(T).lon + dPsi);
  const moonTrop = norm360(moonLongitude(T) + dPsi);
  const rahuTrop = norm360(rahuTrueNode(T) + dPsi);
  const ketuTrop = norm360(rahuTrop + 180);
  const mercuryResult = planetGeoLon("Mercury", T, earth);
  const venusResult = planetGeoLon("Venus", T, earth);
  const marsResult = planetGeoLon("Mars", T, earth);
  const jupiterResult = planetGeoLon("Jupiter", T, earth);
  const saturnResult = planetGeoLon("Saturn", T, earth);
  function toSid(trop: number) {
    return norm360(trop - ayanamsa);
  }
  const sidCusps = tropCusps.map((c) => toSid(c));
  const lagnaSign = Math.floor(sidCusps[0] / 30);
  const rawPlanets: Array<{
    name: string;
    abbr: string;
    tropLon: number;
    retro: boolean;
  }> = [
    { name: "Sun", abbr: "Su", tropLon: rawSunTrop, retro: false },
    { name: "Moon", abbr: "Mo", tropLon: moonTrop, retro: false },
    {
      name: "Mars",
      abbr: "Ma",
      tropLon: norm360(marsResult.lon + dPsi),
      retro: marsResult.retrograde,
    },
    {
      name: "Mercury",
      abbr: "Me",
      tropLon: norm360(mercuryResult.lon + dPsi),
      retro: mercuryResult.retrograde,
    },
    {
      name: "Jupiter",
      abbr: "Ju",
      tropLon: norm360(jupiterResult.lon + dPsi),
      retro: jupiterResult.retrograde,
    },
    {
      name: "Venus",
      abbr: "Ve",
      tropLon: norm360(venusResult.lon + dPsi),
      retro: venusResult.retrograde,
    },
    {
      name: "Saturn",
      abbr: "Sa",
      tropLon: norm360(saturnResult.lon + dPsi),
      retro: saturnResult.retrograde,
    },
    { name: "Rahu", abbr: "Ra", tropLon: rahuTrop, retro: true },
    { name: "Ketu", abbr: "Ke", tropLon: ketuTrop, retro: true },
  ];
  return rawPlanets.map((p) => {
    const correctedTrop = applyKPOldTransitCorrection(
      p.name,
      p.tropLon,
      ayanamsaType,
    );
    const sid = toSid(correctedTrop);
    const sign = Math.floor(sid / 30);
    const degrees = sid % 30;
    const nak = getNakshatraInfo(sid);
    const subLord = getSubLord(sid);
    const house = findKPHouse(correctedTrop, tropCusps);
    const natalHouse = ((sign - lagnaSign + 12) % 12) + 1;
    const bhavaHouse = findKPHouse(correctedTrop, tropCusps);
    return {
      name: p.name,
      abbr: p.abbr,
      tropLon: p.tropLon,
      sidLon: sid,
      sign,
      signName: SIGNS[sign],
      degrees,
      nakshatra: nak.name,
      pada: nak.pada,
      nakshatraLord: nak.lord,
      subLord,
      retrograde: p.retro,
      house,
      natalHouse,
      bhavaHouse,
    };
  });
}

export function formatDeg(deg: number): string {
  const d = Math.floor(deg);
  const mFrac = (deg - d) * 60;
  const m = Math.floor(mFrac);
  const s = Math.floor((mFrac - m) * 60);
  return `${d}\u00b0 ${m}' ${s}"`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Planet owned signs (0-indexed zodiac: 0=Aries..11=Pisces)
export const PLANET_OWNED_SIGNS: Record<string, number[]> = {
  Sun: [4], // Leo
  Moon: [3], // Cancer
  Mars: [0, 7], // Aries, Scorpio
  Mercury: [2, 5], // Gemini, Virgo
  Jupiter: [8, 11], // Sagittarius, Pisces
  Venus: [1, 6], // Taurus, Libra
  Saturn: [9, 10], // Capricorn, Aquarius
  Rahu: [],
  Ketu: [],
};

// Sign lords: each zodiac sign (0=Aries..11=Pisces) and its ruling planet
const SIGN_LORDS: string[] = [
  "Mars", // 0 Aries
  "Venus", // 1 Taurus
  "Mercury", // 2 Gemini
  "Moon", // 3 Cancer
  "Sun", // 4 Leo
  "Mercury", // 5 Virgo
  "Venus", // 6 Libra
  "Mars", // 7 Scorpio
  "Jupiter", // 8 Sagittarius
  "Saturn", // 9 Capricorn
  "Saturn", // 10 Aquarius
  "Jupiter", // 11 Pisces
];

export function getOwnedHouses(
  planetName: string,
  lagnaSign: number,
): number[] {
  const signs = PLANET_OWNED_SIGNS[planetName] || [];
  return signs.map((s) => ((s - lagnaSign + 12) % 12) + 1);
}

/**
 * Returns all Bhavchalit house numbers (1-12) whose cusp sign is owned by the planet.
 * A planet can own 0, 1, or 2 houses. In Placidus, two cusps can share the same sign,
 * so a planet can own more than one house (e.g. Moon owning Cancer can own both H1 and H2
 * if both cusps fall in Cancer).
 */
export function getOwnedHousesByCusps(
  planetName: string,
  cuspSigns: number[],
): number[] {
  const ownedSigns = new Set(PLANET_OWNED_SIGNS[planetName] || []);
  const houses: number[] = [];
  cuspSigns.forEach((sign, idx) => {
    if (ownedSigns.has(sign)) houses.push(idx + 1);
  });
  return houses;
}

/**
 * Returns the list of houses (1-12) that a planet in `fromHouse` aspects,
 * using traditional Vedic aspects:
 * - All planets: 7th aspect
 * - Mars additionally: 4th and 8th
 * - Jupiter additionally: 5th and 9th
 * - Saturn additionally: 3rd and 10th
 */
function getVedicAspectedHouses(
  planetName: string,
  fromHouse: number,
): number[] {
  const h = (offset: number) => ((fromHouse - 1 + offset) % 12) + 1;
  const aspects: number[] = [h(6)]; // 7th aspect (all planets)
  if (planetName === "Mars") {
    aspects.push(h(3), h(7)); // 4th and 8th
  } else if (planetName === "Jupiter") {
    aspects.push(h(4), h(8)); // 5th and 9th
  } else if (planetName === "Saturn") {
    aspects.push(h(2), h(9)); // 3rd and 10th
  }
  return aspects;
}

/**
 * Computes Nadi house numbers for Rahu or Ketu using Nadi astrology rules:
 * 1. Narayan chart position = Bhavchalit house of Rahu/Ketu
 * 2. Planets conjunct (same sign) with Rahu/Ketu: add their owned + Bhavchalit houses
 * 3. Planets aspecting Rahu/Ketu's sign-based house: add their owned + Bhavchalit houses
 * 4. Sign lord of the sign Rahu/Ketu occupies: add owned + Bhavchalit houses
 */
function getRahuKetuNadiNumbers(
  node: ChartPlanet,
  allPlanets: ChartPlanet[],
  lagnaSign: number,
  cuspSigns?: number[],
): number[] {
  const nums = new Set<number>();

  // 1. Narayan chart position = Bhavchalit house
  nums.add(node.bhavaHouse);

  // Sign-based natal house of this node
  const nodeSignHouse = ((node.sign - lagnaSign + 12) % 12) + 1;

  // Helper: add a planet's owned houses and Bhavchalit house to nums
  const addPlanetHouses = (p: ChartPlanet) => {
    const owned = cuspSigns
      ? getOwnedHousesByCusps(p.name, cuspSigns)
      : getOwnedHouses(p.name, lagnaSign);
    for (const h of owned) nums.add(h);
    nums.add(p.bhavaHouse);
  };

  const others = allPlanets.filter(
    (p) => p.name !== "Rahu" && p.name !== "Ketu",
  );

  for (const planet of others) {
    // 2. Conjunction: planet in same sign as Rahu/Ketu
    if (planet.sign === node.sign) {
      addPlanetHouses(planet);
      continue;
    }
    // 3. Aspect: planet aspects Rahu/Ketu's sign-based natal house
    const planetSignHouse = ((planet.sign - lagnaSign + 12) % 12) + 1;
    const aspectedHouses = getVedicAspectedHouses(planet.name, planetSignHouse);
    if (aspectedHouses.includes(nodeSignHouse)) {
      addPlanetHouses(planet);
    }
  }

  // 4. Sign lord of the sign Rahu/Ketu occupies
  const signLordName = SIGN_LORDS[node.sign];
  if (signLordName) {
    const signLordOwned = cuspSigns
      ? getOwnedHousesByCusps(signLordName, cuspSigns)
      : getOwnedHouses(signLordName, lagnaSign);
    for (const h of signLordOwned) nums.add(h);
    const signLordPlanet = allPlanets.find((p) => p.name === signLordName);
    if (signLordPlanet) nums.add(signLordPlanet.bhavaHouse);
  }

  return Array.from(nums)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
}

export interface NadiRow {
  name: string;
  numbers: number[];
  isSpecial?: boolean; // true for Rahu/Ketu combined row
}

export interface NadiPlanet {
  abbr: string;
  planet: NadiRow;
  nakLord: NadiRow;
  subLord: NadiRow;
}

export function calculateNadiNumbers(
  planets: ChartPlanet[],
  lagnaSign: number,
  cuspSigns?: number[],
): NadiPlanet[] {
  const getBhavaHouse = (name: string): number => {
    const p = planets.find((pl) => pl.name === name);
    return p ? p.bhavaHouse : 0;
  };

  // Build a row for a planet name + bhava house.
  // If the planet is Rahu or Ketu, use the special Nadi logic.
  const makeRow = (name: string, bhavaHouse: number): NadiRow => {
    // Find the matching planet in the array for Rahu/Ketu special logic
    const matchedPlanet = planets.find((pl) => pl.name === name);
    if ((name === "Rahu" || name === "Ketu") && matchedPlanet) {
      const nadiNums = getRahuKetuNadiNumbers(
        matchedPlanet,
        planets,
        lagnaSign,
        cuspSigns,
      );
      return { name, numbers: nadiNums, isSpecial: true };
    }
    const owned = cuspSigns
      ? getOwnedHousesByCusps(name, cuspSigns)
      : getOwnedHouses(name, lagnaSign);
    const nums = [...new Set([...owned, bhavaHouse])]
      .filter((n) => n > 0)
      .sort((a, b) => a - b);
    return { name, numbers: nums };
  };

  return planets.map((p) => {
    if (p.name === "Rahu" || p.name === "Ketu") {
      // Special Nadi calculation: no sign ownership, use conjunctions/aspects/sign lord/Narayan
      const nadiNums = getRahuKetuNadiNumbers(p, planets, lagnaSign, cuspSigns);
      return {
        abbr: p.abbr,
        planet: { name: p.name, numbers: nadiNums, isSpecial: true },
        nakLord: makeRow(p.nakshatraLord, getBhavaHouse(p.nakshatraLord)),
        subLord: makeRow(p.subLord, getBhavaHouse(p.subLord)),
      };
    }
    return {
      abbr: p.abbr,
      planet: makeRow(p.name, p.bhavaHouse),
      nakLord: makeRow(p.nakshatraLord, getBhavaHouse(p.nakshatraLord)),
      subLord: makeRow(p.subLord, getBhavaHouse(p.subLord)),
    };
  });
}

// ============================================================
// KP SUBLORD TABLE (249 Seeds)
// ============================================================

export interface KPSubLordEntry {
  seed: number;
  nakIdx: number;
  nakName: string;
  nakLord: string;
  subIdx: number;
  subLord: string;
  startSid: number;
  endSid: number;
}

function buildKPSublordTable(): KPSubLordEntry[] {
  const table: KPSubLordEntry[] = [];
  const NAK_WIDTH = 360 / 27;
  let seed = 1;
  for (let n = 0; n < 27; n++) {
    const nakStart = n * NAK_WIDTH;
    const nakLordName = NAKSHATRA_LORDS[n];
    const nakLordIdx = DASHA_LORDS.indexOf(nakLordName);
    let pos = nakStart;
    for (let s = 0; s < 9; s++) {
      const subLordIdx = (nakLordIdx + s) % 9;
      const subLordName = DASHA_LORDS[subLordIdx];
      const subSpan = (DASHA_YEARS[subLordIdx] / 120) * NAK_WIDTH;
      const endPos = pos + subSpan;
      table.push({
        seed,
        nakIdx: n,
        nakName: NAKSHATRAS[n],
        nakLord: nakLordName,
        subIdx: s,
        subLord: subLordName,
        startSid: pos,
        endSid: endPos,
      });
      seed++;
      pos = endPos;
    }
  }
  // Seeds 244-249: fill remaining slots from last nak's last sub entries
  while (table.length < 249) {
    const last = table[table.length - 1];
    table.push({ ...last, seed: table.length + 1 });
  }
  return table;
}

export const KP_SUBLORD_TABLE: KPSubLordEntry[] = buildKPSublordTable();

export function getSeedEntry(seed: number): KPSubLordEntry {
  const clamped = Math.max(1, Math.min(249, Math.round(seed)));
  return KP_SUBLORD_TABLE[clamped - 1];
}

// ============================================================
// HORARY CHART CALCULATOR
// ============================================================

export function calculateHoraryChart(
  seedNumber: number,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  _lat: number,
  _lon: number,
  tz: number,
): ChartResult {
  const entry = getSeedEntry(seedNumber);
  const ascSid = entry.startSid;

  const utHour = hour + minute / 60 - tz;
  const jd = julianDay(year, month, day, utHour);
  const T = julianCenturies(jd);
  const ayanamsa = getAyanamsa(T, "kp-old");
  const _eps = obliquity(T);
  const { dPsi } = calcNutation(T);

  // Equal house cusps based on seed ascendant (sidereal)
  // Convert ascSid to tropical for cusp computation
  const ascTrop = norm360(ascSid + ayanamsa);
  const tropCusps: number[] = [];
  for (let i = 0; i < 12; i++) {
    tropCusps.push(norm360(ascTrop + i * 30));
  }

  const earth = helioXYZ("Earth", T);
  const rawSunTrop = norm360(sunLongitudeAccurate(T).lon + dPsi);
  const moonTrop = norm360(moonLongitude(T) + dPsi);
  const rahuTrop = norm360(rahuTrueNode(T) + dPsi);
  const ketuTrop = norm360(rahuTrop + 180);
  const mercuryResult = planetGeoLon("Mercury", T, earth);
  const venusResult = planetGeoLon("Venus", T, earth);
  const marsResult = planetGeoLon("Mars", T, earth);
  const jupiterResult = planetGeoLon("Jupiter", T, earth);
  const saturnResult = planetGeoLon("Saturn", T, earth);

  function toSid(trop: number) {
    return norm360(trop - ayanamsa);
  }

  const lagnaSign = Math.floor(ascSid / 30);

  const rawPlanets: Array<{
    name: string;
    abbr: string;
    tropLon: number;
    retro: boolean;
  }> = [
    { name: "Sun", abbr: "Su", tropLon: rawSunTrop, retro: false },
    { name: "Moon", abbr: "Mo", tropLon: moonTrop, retro: false },
    {
      name: "Mars",
      abbr: "Ma",
      tropLon: norm360(marsResult.lon + dPsi),
      retro: marsResult.retrograde,
    },
    {
      name: "Mercury",
      abbr: "Me",
      tropLon: norm360(mercuryResult.lon + dPsi),
      retro: mercuryResult.retrograde,
    },
    {
      name: "Jupiter",
      abbr: "Ju",
      tropLon: norm360(jupiterResult.lon + dPsi),
      retro: jupiterResult.retrograde,
    },
    {
      name: "Venus",
      abbr: "Ve",
      tropLon: norm360(venusResult.lon + dPsi),
      retro: venusResult.retrograde,
    },
    {
      name: "Saturn",
      abbr: "Sa",
      tropLon: norm360(saturnResult.lon + dPsi),
      retro: saturnResult.retrograde,
    },
    { name: "Rahu", abbr: "Ra", tropLon: rahuTrop, retro: true },
    { name: "Ketu", abbr: "Ke", tropLon: ketuTrop, retro: true },
  ];

  const planets: ChartPlanet[] = rawPlanets.map((p) => {
    const sid = toSid(p.tropLon);
    const sign = Math.floor(sid / 30);
    const degrees = sid % 30;
    const nak = getNakshatraInfo(sid);
    const subLord = getSubLord(sid);
    const house = findKPHouse(p.tropLon, tropCusps);
    const natalHouse = ((sign - lagnaSign + 12) % 12) + 1;
    return {
      name: p.name,
      abbr: p.abbr,
      tropLon: p.tropLon,
      sidLon: sid,
      sign,
      signName: SIGNS[sign],
      degrees,
      nakshatra: nak.name,
      pada: nak.pada,
      nakshatraLord: nak.lord,
      subLord,
      retrograde: p.retro,
      house,
      natalHouse,
      bhavaHouse: house,
    };
  });

  const ascNak = getNakshatraInfo(ascSid);
  const ascendant: ChartPlanet = {
    name: "Ascendant",
    abbr: "As",
    tropLon: ascTrop,
    sidLon: ascSid,
    sign: lagnaSign,
    signName: SIGNS[lagnaSign],
    degrees: ascSid % 30,
    nakshatra: ascNak.name,
    pada: ascNak.pada,
    nakshatraLord: ascNak.lord,
    subLord: getSubLord(ascSid),
    retrograde: false,
    house: 1,
    natalHouse: 1,
    bhavaHouse: 1,
  };

  const cusps: ChartCusp[] = tropCusps.map((c, i) => {
    const s = toSid(c);
    const sign = Math.floor(s / 30);
    const nak = getNakshatraInfo(s);
    return {
      house: i + 1,
      tropLon: c,
      sidLon: s,
      sign,
      signName: SIGNS[sign],
      degrees: s % 30,
      nakshatra: nak.name,
      pada: nak.pada,
      nakshatraLord: nak.lord,
      subLord: getSubLord(s),
    };
  });

  const moonSidLon = toSid(moonTrop);
  const birthDate = new Date(year, month - 1, day, hour, minute);
  const dasha = calculateDasha(birthDate, moonSidLon);

  return {
    planets,
    ascendant,
    cusps,
    dasha,
    birthDate,
    ayanamsa,
    ayanamsaType: "kp-old",
  };
}
