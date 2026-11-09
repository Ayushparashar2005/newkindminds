/**
 * KindMinds — Real Interactive Geospatial Disaster Map
 *
 * Uses Leaflet + React-Leaflet (v4 for React 18) with OpenStreetMap tiles.
 * Renders verified facilities from Neon PostgreSQL and live seismic events from USGS.
 *
 * Privacy note: Only public/visibility=public facilities are rendered.
 * Exact household coordinates are never exposed.
 */
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { StatusBadge } from '../ui/StatusBadge';
import { DemoBanner } from '../ui/DemoBanner';
import { Filter, MapPin, RefreshCw, Activity, Phone, ShieldCheck } from 'lucide-react';
import type { HumanitarianResource, SearchGroup } from '../../types';

// Leaflet CSS
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's broken default icon URLs in Vite/Astro bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Category-colored custom pin icons
function makePinIcon(color: string, symbol: string = '') {
  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: `<div style="
      width: 30px; height: 30px;
      border-radius: 50% 50% 50% 0;
      background: ${color};
      border: 3px solid #ffffff;
      box-shadow: 0 3px 10px rgba(0,0,0,0.35);
      transform: rotate(-45deg);
      display: flex; align-items: center; justify-content: center;
    "><span style="transform: rotate(45deg); font-size: 11px; font-weight: bold; color: white;">${symbol}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -32],
  });
}

function makeQuakeIcon(magnitude: number) {
  const size = Math.min(42, Math.max(26, magnitude * 6.5));
  return L.divIcon({
    className: 'custom-quake-pin',
    html: `<div style="
      width: ${size}px; height: ${size}px;
      border-radius: 50%;
      background: rgba(192, 57, 43, 0.85);
      border: 2px solid #ffffff;
      box-shadow: 0 0 14px rgba(192, 57, 43, 0.7);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 10px; font-weight: 900;
    ">M${magnitude.toFixed(1)}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

const CATEGORY_COLORS: Record<string, { color: string; symbol: string }> = {
  medical:   { color: '#DC2626', symbol: '✚' },
  shelter:   { color: '#2563EB', symbol: '⌂' },
  water:     { color: '#0891B2', symbol: '💧' },
  food:      { color: '#16A34A', symbol: '🍚' },
  warehouse: { color: '#78716C', symbol: '📦' },
  sar:       { color: '#7C3AED', symbol: '⛑' },
  default:   { color: '#B5674D', symbol: '📍' },
};

// Map controller: invalidates size and auto-fits bounds
interface MapControllerProps {
  positions: [number, number][];
}
const MapController: React.FC<MapControllerProps> = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate size once DOM layout is stable
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [positions, map]);

  return null;
};

interface KindMindsMapProps {
  panel?: 'helper' | 'needer';
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

const KindMindsMapInner: React.FC<KindMindsMapProps> = ({
  panel = 'needer',
  defaultCenter = [21.64, 69.62],
  defaultZoom = 8,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // 1. Neon Database: Verified Humanitarian Resources
  const { data: resources = [], isLoading: rLoading, refetch: refetchRes } = useQuery({
    queryKey: ['resources'],
    queryFn: () => api.getResources(),
    staleTime: 60_000,
  });

  // 2. Neon Database: Search & Rescue Groups
  const { data: searchGroups = [], isLoading: gLoading } = useQuery({
    queryKey: ['search-groups'],
    queryFn: () => api.getSearchGroups(),
    staleTime: 60_000,
  });

  // 3. Public APIs: Live USGS Earthquakes
  const { data: earthquakeData, isLoading: eqLoading } = useQuery({
    queryKey: ['live-earthquakes'],
    queryFn: () => api.getLiveEarthquakes(4.0),
    staleTime: 120_000,
  });

  const earthquakes = earthquakeData?.events || [];
  const loading = rLoading || gLoading || eqLoading;

  // Filter resources
  const visibleResources = resources.filter(r =>
    r.visibility === 'public' &&
    r.latitude != null && r.longitude != null &&
    (selectedCategory === 'all' || r.category === selectedCategory)
  );

  const visibleGroups = (selectedCategory === 'all' || selectedCategory === 'sar')
    ? searchGroups.filter(g => g.latitude != null && g.longitude != null)
    : [];

  const visibleQuakes = (selectedCategory === 'all' || selectedCategory === 'earthquake')
    ? earthquakes
    : [];

  // Compute all coordinates for auto-fit
  const allPositions: [number, number][] = [
    ...visibleResources.map(r => [r.latitude!, r.longitude!] as [number, number]),
    ...visibleGroups.map(g => [g.latitude!, g.longitude!] as [number, number]),
    ...visibleQuakes.slice(0, 5).map(q => [q.latitude, q.longitude] as [number, number]),
  ];

  return (
    <div className="space-y-4">
      <DemoBanner message="GEOSPATIAL DISASTER MAP — Real-time OpenStreetMap rendering verified facilities from Neon PostgreSQL and live seismic events from USGS. Exact household coordinates are strictly masked for civilian safety." />

      {/* Filter Bar */}
      <div className="neu-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-charcoal flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-dustyblue" />
            Layer:
          </span>
          {[
            { id: 'all', label: 'All Layers' },
            { id: 'medical', label: 'Medical' },
            { id: 'shelter', label: 'Shelters' },
            { id: 'water', label: 'Clean Water' },
            { id: 'food', label: 'Food Rations' },
            { id: 'sar', label: 'Search & Rescue' },
            { id: 'earthquake', label: 'Live Earthquakes (USGS)' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setSelectedCategory(btn.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition min-h-[36px] ${
                selectedCategory === btn.id
                  ? 'bg-charcoal text-white shadow-sm'
                  : 'bg-surface border border-stone-300 text-charcoal hover:bg-stone-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-charcoal-muted text-[11px] font-medium hidden sm:block">
            <strong>{visibleResources.length}</strong> relief points · <strong>{visibleGroups.length}</strong> rescue units · <strong>{visibleQuakes.length}</strong> quakes
          </div>
          <button
            onClick={() => refetchRes()}
            className="p-2 rounded-lg border border-stone-300 hover:bg-surface-raised transition text-charcoal flex items-center gap-1 text-xs"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Map Layout: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Real Leaflet Map */}
        <div className="lg:col-span-2 neu-card overflow-hidden relative" style={{ height: '520px', minHeight: '520px' }}>
          {loading && (
            <div className="absolute top-3 right-3 z-[1000] px-3 py-1 bg-surface/90 backdrop-blur-md rounded-md border border-stone-300 shadow text-[11px] font-bold text-charcoal flex items-center gap-2">
              <RefreshCw className="w-3 h-3 animate-spin text-terracotta" />
              Syncing live geospatial data…
            </div>
          )}

          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            {/* OpenStreetMap Tile Layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Invalidate size & bounds controller */}
            <MapController positions={allPositions} />

            {/* 1. Verified Public Resources (Neon PostgreSQL) */}
            {visibleResources.map(res => {
              const conf = CATEGORY_COLORS[res.category] || CATEGORY_COLORS.default;
              return (
                <Marker
                  key={res.id}
                  position={[res.latitude!, res.longitude!]}
                  icon={makePinIcon(conf.color, conf.symbol)}
                  eventHandlers={{
                    click: () => setSelectedItem({ type: 'resource', data: res }),
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1.5 min-w-[200px]">
                      <div className="font-extrabold text-sm text-charcoal">{res.name}</div>
                      <div className="flex items-center gap-1.5">
                        <span className="capitalize font-semibold text-stone-600">{res.category}</span>
                        <StatusBadge status={res.operational_status} />
                      </div>
                      {res.address_approximate && (
                        <div className="text-stone-600">📍 {res.address_approximate}</div>
                      )}
                      {res.contact_public && (
                        <div className="text-stone-600 font-medium">📞 {res.contact_public}</div>
                      )}
                      {panel === 'needer' && (
                        <a
                          href="/needer/request"
                          className="inline-block mt-2 px-3 py-1 bg-terracotta text-white rounded text-[11px] font-bold hover:bg-terracotta-hover transition"
                        >
                          Request Assistance Here →
                        </a>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* 2. Search & Rescue Units (Neon PostgreSQL) */}
            {visibleGroups.map(g => (
              <Marker
                key={g.id}
                position={[g.latitude!, g.longitude!]}
                icon={makePinIcon(CATEGORY_COLORS.sar.color, CATEGORY_COLORS.sar.symbol)}
                eventHandlers={{
                  click: () => setSelectedItem({ type: 'sar', data: g }),
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1.5 min-w-[200px]">
                    <div className="font-extrabold text-sm text-charcoal">{g.name}</div>
                    <div className="text-purple-800 font-bold">Search & Rescue Division</div>
                    <div className="text-stone-600">Sector: {g.approximate_area || g.service_region}</div>
                    {g.public_contact && (
                      <div className="text-stone-600 font-medium">📞 {g.public_contact}</div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* 3. Live Seismic Hazards (USGS Earthquakes from Public APIs) */}
            {visibleQuakes.map((q: any) => (
              <Marker
                key={q.id}
                position={[q.latitude, q.longitude]}
                icon={makeQuakeIcon(q.magnitude)}
                eventHandlers={{
                  click: () => setSelectedItem({ type: 'earthquake', data: q }),
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1.5 min-w-[220px]">
                    <div className="font-extrabold text-sm text-red-700 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                      Magnitude {q.magnitude.toFixed(1)} Earthquake
                    </div>
                    <div className="font-bold text-charcoal">{q.place}</div>
                    <div className="text-stone-600">Depth: {q.depth_km} km</div>
                    {q.tsunami_alert && (
                      <div className="p-1.5 bg-red-100 text-red-900 rounded font-bold text-[11px]">
                        ⚠️ Tsunami Alert Issued for this epicenter
                      </div>
                    )}
                    <a
                      href={q.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-dustyblue font-semibold hover:underline inline-block mt-1"
                    >
                      View USGS Event Details &rarr;
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Selected Item Detail Sidebar */}
        <div className="neu-card p-5 flex flex-col justify-between">
          {selectedItem ? (
            <div className="space-y-4">
              {/* Resource Detail */}
              {selectedItem.type === 'resource' && (
                <>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800">
                        {selectedItem.data.category}
                      </span>
                      <StatusBadge status={selectedItem.data.operational_status} />
                    </div>
                    <h3 className="font-black text-charcoal text-lg">{selectedItem.data.name}</h3>
                    <p className="text-xs text-charcoal-light mt-1 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-terracotta shrink-0 mt-0.5" />
                      <span>{selectedItem.data.address_approximate}</span>
                    </p>
                  </div>

                  <div className="p-3 bg-surface-inset rounded neu-inset text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted font-bold">Approx. Coordinates:</span>
                      <span className="font-mono text-stone-700">
                        {selectedItem.data.latitude?.toFixed(4)}° N, {selectedItem.data.longitude?.toFixed(4)}° E
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted font-bold">Source:</span>
                      <span className="font-semibold text-stone-700">Verified Humanitarian Directory</span>
                    </div>
                  </div>

                  {selectedItem.data.contact_public && (
                    <div className="p-3 bg-stone-100 rounded text-xs">
                      <span className="text-charcoal-muted text-[10px] uppercase font-bold block">Public Dispatch Phone</span>
                      <span className="font-bold text-charcoal text-sm">{selectedItem.data.contact_public}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    {panel === 'needer' ? (
                      <a
                        href="/needer/request"
                        className="w-full py-2.5 bg-terracotta text-white rounded text-xs font-bold hover:bg-terracotta-hover transition text-center block shadow-sm"
                      >
                        Request Assistance Here &rarr;
                      </a>
                    ) : (
                      <a
                        href="/helper/resources"
                        className="w-full py-2.5 bg-dustyblue text-white rounded text-xs font-bold hover:bg-dustyblue-hover transition text-center block shadow-sm"
                      >
                        Update Inventory / Status &rarr;
                      </a>
                    )}
                  </div>
                </>
              )}

              {/* Search & Rescue Detail */}
              {selectedItem.type === 'sar' && (
                <>
                  <div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900 block w-max mb-2">
                      Search &amp; Rescue Base
                    </span>
                    <h3 className="font-black text-charcoal text-lg">{selectedItem.data.name}</h3>
                    <p className="text-xs text-charcoal-light mt-1">Sector: {selectedItem.data.approximate_area}</p>
                  </div>
                  <div className="p-3 bg-surface-raised rounded text-xs space-y-1 border border-stone-200">
                    <span className="font-bold text-charcoal block">Capabilities:</span>
                    <p className="text-charcoal-muted">{selectedItem.data.capabilities?.join(', ') || 'Swift water rescue, medical extraction'}</p>
                  </div>
                  {selectedItem.data.public_contact && (
                    <div className="p-3 bg-stone-100 rounded text-xs">
                      <span className="text-charcoal-muted text-[10px] uppercase font-bold block">Emergency Channel</span>
                      <span className="font-bold text-charcoal text-sm">{selectedItem.data.public_contact}</span>
                    </div>
                  )}
                </>
              )}

              {/* Earthquake Detail */}
              {selectedItem.type === 'earthquake' && (
                <>
                  <div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-900 block w-max mb-2">
                      Live USGS Seismic Alert
                    </span>
                    <h3 className="font-black text-charcoal text-lg">M{selectedItem.data.magnitude.toFixed(1)} — {selectedItem.data.place}</h3>
                    <p className="text-xs text-charcoal-muted mt-1">Depth: {selectedItem.data.depth_km} km</p>
                  </div>
                  {selectedItem.data.tsunami_alert && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-900 font-bold">
                      ⚠️ Tsunami Warning Issued: Low-lying coastal populations should monitor regional advisory sirens.
                    </div>
                  )}
                  <a
                    href={selectedItem.data.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-charcoal text-white rounded text-xs font-bold hover:bg-black transition text-center block"
                  >
                    View USGS ShakeMap &rarr;
                  </a>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 p-8 text-charcoal-muted">
              <MapPin className="w-8 h-8 opacity-30 text-terracotta" />
              <p className="text-xs font-medium">Click any pin or earthquake marker on the map to inspect live dispatch details, capacity, and phone contacts.</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend Bar */}
      <div className="neu-card p-3 flex flex-wrap items-center gap-4 text-[11px]">
        {Object.entries({
          medical: 'Medical Hospital',
          shelter: 'Evacuation Shelter',
          water: 'Clean Water Point',
          food: 'Food Distribution',
          sar: 'Search & Rescue',
        }).map(([cat, label]) => {
          const c = CATEGORY_COLORS[cat];
          return (
            <span key={cat} className="flex items-center gap-1.5 font-medium text-charcoal">
              <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              {label}
            </span>
          );
        })}
        <span className="flex items-center gap-1.5 font-medium text-red-800">
          <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-pulse shrink-0" />
          Live M4.0+ Earthquakes (USGS)
        </span>
        <span className="ml-auto text-[10px] text-stone-500 font-semibold hidden md:inline">OpenStreetMap · Neon PostgreSQL · USGS Public APIs</span>
      </div>
    </div>
  );
};

export const KindMindsMap: React.FC<KindMindsMapProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <KindMindsMapInner {...props} />
    </QueryClientProvider>
  );
};
