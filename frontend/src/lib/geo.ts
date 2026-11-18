import { api } from './api';

/** Geographic centre of India, used only when a place cannot be resolved. */
export const INDIA_CENTER: [number, number] = [22.5, 79.0];

/**
 * Resolves a free-text Indian address ("Sector 4, Veraval, Gujarat") to coordinates
 * using the Open-Meteo geocoder. Tries each comma-separated part, most specific first,
 * and prefers results inside India.
 */
export async function geocodeIndia(text: string): Promise<[number, number]> {
  const parts = text.split(',').map((s) => s.replace(/\d{6}/g, '').trim()).filter((s) => s.length >= 2);
  for (const part of parts) {
    try {
      const data = await api.geocodeLocation(part);
      const hit = (data?.results || []).find((r: any) => r.country === 'India');
      if (hit) return [hit.latitude, hit.longitude];
    } catch {
      /* try next part */
    }
  }
  return INDIA_CENTER;
}
