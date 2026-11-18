/**
 * Map-based location picker.
 *
 * - Search an Indian street, locality, landmark or PIN code (OpenStreetMap Nominatim)
 * - Click anywhere on the map, or drag the pin, to set the exact point
 * - "Use my current location" via the browser's Geolocation API
 * - The chosen point is reverse-geocoded into a readable address, which the user can edit
 *
 * Leaflet is imported lazily inside an effect so the component is safe to render
 * from Astro islands using client:load (no `window` access during SSR).
 */
import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crosshair, Loader2, MapPin, Search, X } from 'lucide-react';
import { api } from '../../lib/api';
import { INDIA_CENTER } from '../../lib/geo';
import { isInIndia, type PickedLocation } from '../../lib/location';

interface LocationPickerProps {
  open: boolean;
  initial?: PickedLocation | null;
  title?: string;
  onClose: () => void;
  onSelect: (loc: PickedLocation) => void;
}

interface SearchHit {
  label: string;
  display_name: string;
  latitude: number;
  longitude: number;
}

const PIN_HTML = `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:#1C5DA6;border:3px solid #fff;
  box-shadow:0 3px 10px rgba(0,0,0,.35);transform:rotate(-45deg)"></div>`;

export const LocationPicker: React.FC<LocationPickerProps> = ({ open, initial, title = 'Set your location', onClose, onSelect }) => {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const lookupSeq = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const searchId = useId();

  const [point, setPointState] = useState<{ lat: number; lng: number } | null>(initial ? { lat: initial.lat, lng: initial.lng } : null);
  const [label, setLabel] = useState(initial?.label ?? '');
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Reset state each time the dialog opens
  useEffect(() => {
    if (!open) return;
    setPointState(initial ? { lat: initial.lat, lng: initial.lng } : null);
    setLabel(initial?.label ?? '');
    setHits(null);
    setQuery('');
    setSearchError(null);
    setGeoError(null);
    setLookupError(null);
    setTimeout(() => searchRef.current?.focus(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const placeMarker = (lat: number, lng: number) => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (!markerRef.current) {
      const icon = L.divIcon({ className: 'km-pick-pin', html: PIN_HTML, iconSize: [32, 32], iconAnchor: [16, 32] });
      markerRef.current = L.marker([lat, lng], { draggable: true, icon, keyboard: true, title: 'Selected location. Drag to adjust.' }).addTo(map);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current.getLatLng();
        setPoint(p.lat, p.lng);
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  /** Sets the chosen point. If no label is given, the address is looked up. */
  const setPoint = (lat: number, lng: number, knownLabel?: string, zoomTo?: number) => {
    setPointState({ lat, lng });
    placeMarker(lat, lng);
    if (zoomTo && mapRef.current) mapRef.current.setView([lat, lng], zoomTo);
    setLookupError(null);
    if (knownLabel) {
      lookupSeq.current++;
      setLabel(knownLabel);
      setLooking(false);
      return;
    }
    const seq = ++lookupSeq.current;
    setLooking(true);
    api
      .reverseGeocode(lat, lng)
      .then((r) => {
        if (seq !== lookupSeq.current) return;
        setLabel(r.label);
      })
      .catch(() => {
        if (seq !== lookupSeq.current) return;
        setLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setLookupError('Could not look up the address for this point. You can type a description below.');
      })
      .finally(() => {
        if (seq === lookupSeq.current) setLooking(false);
      });
  };

  // Create / destroy the Leaflet map with the dialog
  useEffect(() => {
    if (!open) return;
    let disposed = false;
    (async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');
        if (disposed || !mapEl.current) return;
        LRef.current = L;
        const start = initial ? ([initial.lat, initial.lng] as [number, number]) : INDIA_CENTER;
        const map = L.map(mapEl.current, { center: start, zoom: initial ? 14 : 5, zoomControl: true });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        }).addTo(map);
        map.on('click', (e: any) => setPoint(e.latlng.lat, e.latlng.lng));
        mapRef.current = map;
        if (initial) placeMarker(initial.lat, initial.lng);
        setTimeout(() => map.invalidateSize(), 50);
      } catch {
        setMapError('The map could not be loaded. You can still search for a place above.');
      }
    })();
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Not a <form>: the picker is often opened from inside another form.
  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    setSearchError(null);
    try {
      let results: SearchHit[] = (await api.searchPlaces(q)).results;
      if (results.length === 0) {
        // Fallback: Open-Meteo city/town geocoder
        const om = await api.geocodeLocation(q).catch(() => ({ results: [] }));
        results = (om.results || [])
          .filter((r: any) => r.country === 'India')
          .map((r: any) => ({ label: r.display_name, display_name: r.display_name, latitude: r.latitude, longitude: r.longitude }));
      }
      setHits(results);
    } catch {
      setSearchError('Place search is unavailable right now. Click on the map to choose a point instead.');
      setHits(null);
    } finally {
      setSearching(false);
    }
  };

  const useMyLocation = () => {
    setGeoError(null);
    if (!('geolocation' in navigator)) {
      setGeoError('Your browser does not support location access.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        setPoint(latitude, longitude, undefined, accuracy > 2000 ? 12 : 16);
        if (!isInIndia(latitude, longitude)) {
          setGeoError('Your device location appears to be outside India. Relief listings here cover India only.');
        }
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. Allow it in your browser settings, or search / click on the map.'
            : 'Could not get your current location. Search for a place or click on the map.'
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const confirm = () => {
    if (!point) return;
    onSelect({ label: label.trim() || `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`, lat: point.lat, lng: point.lng });
    onClose();
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] km-backdrop flex items-center justify-center p-3 sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${labelId}-title`}
        className="km-dialog bg-surface rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200">
          <h2 id={`${labelId}-title`} className="text-base font-extrabold text-charcoal flex items-center gap-2">
            <MapPin className="w-5 h-5 text-terracotta" aria-hidden="true" /> {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close location picker" className="p-2 rounded hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <label htmlFor={searchId} className="sr-only">Search for a place</label>
            <input
              id={searchId}
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  runSearch();
                }
              }}
              placeholder="Search street, locality, landmark or PIN code"
              className="flex-1 p-2.5 bg-surface-inset rounded neu-inset text-sm text-charcoal border border-transparent focus:border-dustyblue focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={runSearch}
                disabled={searching || query.trim().length < 2}
                className="px-4 py-2 bg-charcoal text-white rounded text-xs font-bold hover:bg-charcoal-light disabled:opacity-50 inline-flex items-center gap-1 min-h-[44px]"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Search className="w-4 h-4" aria-hidden="true" />}
                Search
              </button>
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="px-3 py-2 border border-stone-300 rounded text-xs font-bold text-charcoal hover:bg-stone-100 disabled:opacity-50 inline-flex items-center gap-1 min-h-[44px] whitespace-nowrap"
              >
                {locating ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Crosshair className="w-4 h-4" aria-hidden="true" />}
                Use my current location
              </button>
            </div>
          </div>

          {searchError && <p role="alert" className="text-xs text-red-700">{searchError}</p>}
          {geoError && <p role="alert" className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">{geoError}</p>}

          {hits && (
            <div className="border border-stone-200 rounded-lg max-h-40 overflow-y-auto" aria-live="polite">
              {hits.length === 0 ? (
                <p className="text-xs text-charcoal-muted p-3">No places found in India for “{query}”. Try a nearby landmark or click on the map.</p>
              ) : (
                <ul role="list" aria-label="Search results">
                  {hits.map((h, i) => (
                    <li key={`${h.latitude}-${h.longitude}-${i}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setPoint(h.latitude, h.longitude, h.label, 16);
                          setHits(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-stone-100 border-b border-stone-100 last:border-0"
                      >
                        <span className="font-bold text-charcoal block">{h.label}</span>
                        <span className="text-charcoal-muted line-clamp-1">{h.display_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="relative">
            <div
              ref={mapEl}
              className="w-full h-[300px] sm:h-[360px] rounded-lg border border-stone-200 bg-stone-100"
              aria-label="Map. Click to set your location; drag the pin to adjust."
              role="application"
            />
            {mapError && <p role="alert" className="absolute inset-0 flex items-center justify-center text-xs text-charcoal-muted p-4 text-center">{mapError}</p>}
            {!point && !mapError && (
              <span className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-[500] bg-white/95 text-xs font-semibold text-charcoal px-3 py-1 rounded shadow">
                Click on the map to drop a pin
              </span>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor={`${labelId}-label`} className="text-xs font-bold text-charcoal block">
              Address for this point {looking && <span className="font-normal text-charcoal-muted">(looking up…)</span>}
            </label>
            <input
              id={`${labelId}-label`}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={!point}
              placeholder={point ? 'Describe this place' : 'Choose a point first'}
              className="w-full p-2.5 bg-surface-inset rounded neu-inset text-sm text-charcoal border border-transparent focus:border-dustyblue focus:outline-none disabled:opacity-60"
            />
            {point && (
              <p className="text-xs text-charcoal-muted">
                {point.lat.toFixed(5)}° N, {point.lng.toFixed(5)}° E. Add a flat number or landmark above if you like.
              </p>
            )}
            {lookupError && <p className="text-xs text-amber-800">{lookupError}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-stone-200">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-stone-300 rounded text-xs font-semibold text-charcoal hover:bg-stone-100 min-h-[44px]">
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!point || looking}
            className="px-5 py-2 bg-terracotta text-white rounded text-xs font-bold hover:bg-terracotta-hover disabled:opacity-50 min-h-[44px]"
          >
            Confirm location
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/** Compact form field: shows the picked place and opens the map picker. */
export const LocationField: React.FC<{
  value: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
  label?: string;
  pickerTitle?: string;
  hint?: string;
}> = ({ value, onChange, label = 'Location', pickerTitle, hint }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1">
      <span className="text-xs font-bold text-charcoal block">{label}</span>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded bg-surface-inset neu-inset">
        <div className="flex-1 min-w-0 text-xs">
          {value ? (
            <>
              <span className="font-bold text-charcoal block truncate">{value.label}</span>
              <span className="text-xs text-charcoal-muted">{value.lat.toFixed(5)}, {value.lng.toFixed(5)}</span>
            </>
          ) : (
            <span className="text-charcoal-muted">No location chosen yet</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-3 py-2 bg-surface border border-stone-300 rounded text-xs font-bold text-charcoal hover:bg-stone-100 inline-flex items-center gap-1 min-h-[40px] whitespace-nowrap"
        >
          <MapPin className="w-4 h-4 text-terracotta" aria-hidden="true" /> {value ? 'Change on map' : 'Pick on map'}
        </button>
      </div>
      {hint && <p className="text-xs text-charcoal-muted">{hint}</p>}
      <LocationPicker open={open} initial={value} title={pickerTitle} onClose={() => setOpen(false)} onSelect={onChange} />
    </div>
  );
};
