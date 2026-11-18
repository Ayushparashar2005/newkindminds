import { geocodeIndia } from './geo';

/** A place the user picked: a readable label plus exact coordinates. */
export interface PickedLocation {
  label: string;
  lat: number;
  lng: number;
}

export const DEFAULT_LOCATION: PickedLocation = { label: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 };

const KEY = 'kindminds.userLocation';
export const LOCATION_EVENT = 'kindminds:location';

function isPicked(v: any): v is PickedLocation {
  return v && typeof v.label === 'string' && Number.isFinite(v.lat) && Number.isFinite(v.lng);
}

/**
 * Reads the saved location. Older versions stored a plain string ("Chennai, Tamil Nadu");
 * those are geocoded once and re-saved in the new { label, lat, lng } shape.
 */
export async function loadLocation(): Promise<PickedLocation> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return DEFAULT_LOCATION;
  }
  if (!raw) return DEFAULT_LOCATION;
  try {
    const parsed = JSON.parse(raw);
    if (isPicked(parsed)) return parsed;
  } catch {
    /* legacy plain-string value */
  }
  const [lat, lng] = await geocodeIndia(raw);
  const migrated = { label: raw, lat, lng };
  saveLocation(migrated);
  return migrated;
}

export function saveLocation(loc: PickedLocation) {
  try {
    localStorage.setItem(KEY, JSON.stringify(loc));
  } catch {
    /* storage unavailable, keep in memory only */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOCATION_EVENT, { detail: loc }));
  }
}

/** Great-circle distance in kilometres. */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Rough check that a point lies within India's bounding box. */
export function isInIndia(lat: number, lng: number) {
  return lat >= 6 && lat <= 37.6 && lng >= 68 && lng <= 97.5;
}
