/** Approximate centroids for Assam districts (for map pins). */
export const DISTRICT_COORDS = {
  baksa: { lat: 26.6935, lng: 91.5082 },
  barpeta: { lat: 26.3228, lng: 91.0065 },
  biswanath: { lat: 26.7333, lng: 93.15 },
  bongaigaon: { lat: 26.4833, lng: 90.55 },
  cachar: { lat: 24.8333, lng: 92.7789 },
  charaideo: { lat: 27.0333, lng: 95.0 },
  chirang: { lat: 26.525, lng: 90.5 },
  darrang: { lat: 26.45, lng: 92.03 },
  dhemaji: { lat: 27.4855, lng: 94.556 },
  dhubri: { lat: 26.0234, lng: 89.9867 },
  dibrugarh: { lat: 27.4728, lng: 94.912 },
  'dima-hasao': { lat: 25.5, lng: 93.0 },
  'dima hasao': { lat: 25.5, lng: 93.0 },
  goalpara: { lat: 26.1734, lng: 90.6263 },
  golaghat: { lat: 26.5234, lng: 93.9623 },
  hailakandi: { lat: 24.6848, lng: 92.561 },
  hojai: { lat: 26.0, lng: 92.8667 },
  jorhat: { lat: 26.7509, lng: 94.2037 },
  kamrup: { lat: 26.3161, lng: 91.5986 },
  'kamrup metro': { lat: 26.1445, lng: 91.7362 },
  'kamrup-metro': { lat: 26.1445, lng: 91.7362 },
  'karbi anglong': { lat: 26.0, lng: 93.45 },
  karimganj: { lat: 24.8667, lng: 92.35 },
  kokrajhar: { lat: 26.4015, lng: 90.2667 },
  lakhimpur: { lat: 27.2364, lng: 94.1036 },
  majuli: { lat: 26.95, lng: 94.1667 },
  morigaon: { lat: 26.2523, lng: 92.3423 },
  nagaon: { lat: 26.3509, lng: 92.6925 },
  nalberi: { lat: 26.445, lng: 91.439 },
  nalbar: { lat: 26.445, lng: 91.439 },
  nalbari: { lat: 26.445, lng: 91.439 },
  sivasagar: { lat: 26.9844, lng: 94.6378 },
  sibsagar: { lat: 26.9844, lng: 94.6378 },
  sonitpur: { lat: 26.634, lng: 92.79 },
  'south salmara': { lat: 25.85, lng: 89.95 },
  'south-salmara': { lat: 25.85, lng: 89.95 },
  sribhumi: { lat: 24.87, lng: 92.36 },
  tinsukia: { lat: 27.4922, lng: 95.3468 },
  udalguri: { lat: 26.7536, lng: 92.102 },
  'west karbi anglong': { lat: 25.85, lng: 92.65 },
}

export const DEFAULT_CENTER = { lat: 26.2, lng: 92.9 }

export function slugifyDistrict(name = '') {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function coordsFor(name) {
  const key = name.toLowerCase().trim()
  const slug = slugifyDistrict(name)
  return DISTRICT_COORDS[key] || DISTRICT_COORDS[slug] || DEFAULT_CENTER
}
