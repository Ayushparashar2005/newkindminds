import React, { useEffect, useState } from 'react';
import { loadLocation, saveLocation, distanceKm, DEFAULT_LOCATION, type PickedLocation } from '../../lib/location';
import { LocationPicker } from '../ui/LocationPicker';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { DemoBanner } from '../ui/DemoBanner';
import { AlertBanner } from '../ui/AlertBanner';
import { StatusBadge } from '../ui/StatusBadge';
import { DataFreshness } from '../ui/DataFreshness';
import {
  Search,
  MapPin,
  Phone,
  Navigation,
  ShieldCheck,
  Users2
} from 'lucide-react';
import type { HumanitarianResource, SearchGroup } from '../../types';

const FindHelpInner: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loc, setLoc] = useState<PickedLocation>(DEFAULT_LOCATION);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [radiusKm, setRadiusKm] = useState(0);

  useEffect(() => {
    loadLocation().then(setLoc);
  }, []);

  const km = (lat: number, lng: number) => distanceKm(loc.lat, loc.lng, lat, lng);
  const withinRadius = (lat: number, lng: number) => radiusKm === 0 || km(lat, lng) <= radiusKm;
  const directionsUrl = (lat: number, lng: number) =>
    `https://www.google.com/maps/dir/?api=1&origin=${loc.lat},${loc.lng}&destination=${lat},${lng}`;

  const { data: resources = [], isLoading: rLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => api.getResources(),
    staleTime: 60_000,
  });

  const { data: searchGroups = [], isLoading: gLoading } = useQuery({
    queryKey: ['search-groups'],
    queryFn: () => api.getSearchGroups(),
    staleTime: 60_000,
  });

  const loading = rLoading || gLoading;

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'shelter', label: 'Emergency Shelters' },
    { id: 'medical', label: 'Hospitals & Medical' },
    { id: 'food', label: 'Food Distribution' },
    { id: 'water', label: 'Clean Drinking Water' },
    { id: 'supplies', label: 'Relief Supplies' },
    { id: 'search_group', label: 'Search & Rescue Teams' },
  ];

  const filteredResources = resources.filter(res => {
    if (res.visibility !== 'public') return false;
    if (activeCategory !== 'all' && res.category !== activeCategory) return false;
    if (!withinRadius(res.latitude, res.longitude)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        res.name.toLowerCase().includes(q) ||
        res.address_approximate.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredSearchGroups = searchGroups.filter(g => {
    if (activeCategory !== 'all' && activeCategory !== 'search_group') return false;
    if (!withinRadius(g.latitude, g.longitude)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        g.name.toLowerCase().includes(q) ||
        g.service_region.toLowerCase().includes(q) ||
        g.approximate_area.toLowerCase().includes(q)
      );
    }
    return true;
  });

  filteredResources.sort((a, b) => km(a.latitude, a.longitude) - km(b.latitude, b.longitude));
  filteredSearchGroups.sort((a, b) => km(a.latitude, a.longitude) - km(b.latitude, b.longitude));
  const fmtKm = (lat: number, lng: number) => {
    const d = km(lat, lng);
    return d < 1 ? `${Math.round(d * 1000)} m away` : `~${Math.round(d).toLocaleString('en-IN')} km away`;
  };

  return (
    <div className="space-y-6">
      <DemoBanner />
      <LocationPicker
        open={pickerOpen}
        initial={loc}
        title="Find help near…"
        onClose={() => setPickerOpen(false)}
        onSelect={(picked) => { setLoc(picked); saveLocation(picked); }}
      />
      <AlertBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] md:text-[32px]">Find help nearby</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Shelters, hospitals, drinking water and food points, nearest first.
          </p>
        </div>
        <a
          href="/needer/request"
          className="px-4 py-2 bg-terracotta text-white rounded-lg text-xs font-semibold hover:bg-terracotta-hover transition shadow-sm self-start sm:self-auto"
        >
          Can't find it? Ask for help
        </a>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="neu-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, area or landmark"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-stone-300 rounded-lg text-xs text-charcoal placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-dustyblue"
            />
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/disaster/map"
              className="px-3 py-2 bg-surface border border-stone-300 rounded-lg text-xs font-semibold text-charcoal hover:bg-stone-100 transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <Navigation className="w-3.5 h-3.5 text-dustyblue" />
              View Map
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-stone-200 text-xs">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <MapPin className="w-4 h-4 text-terracotta shrink-0" aria-hidden="true" />
            <span className="text-charcoal-muted">Nearest first from:</span>
            <strong className="text-charcoal truncate">{loc.label}</strong>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="fh-radius" className="sr-only">Distance</label>
            <select
              id="fh-radius"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="px-2 py-2 bg-surface border border-stone-300 rounded-lg text-xs text-charcoal"
            >
              <option value={0}>Any distance</option>
              <option value={10}>Within 10 km</option>
              <option value={25}>Within 25 km</option>
              <option value={100}>Within 100 km</option>
              <option value={500}>Within 500 km</option>
            </select>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="px-3 py-2 bg-surface border border-stone-300 rounded-lg text-xs font-semibold text-charcoal hover:bg-stone-100 whitespace-nowrap"
            >
              Change location
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeCategory === cat.id
                  ? 'bg-charcoal text-white shadow-sm'
                  : 'bg-surface border border-stone-300 text-charcoal hover:bg-stone-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Results */}
      {loading ? (
        <div className="p-12 text-center text-sm text-charcoal-muted">Loading…</div>
      ) : (
        <div className="space-y-6">
          {/* Facilities */}
          {activeCategory !== 'search_group' && (
            <div>
              <h2 className="text-base font-black text-charcoal mb-3">
                Relief Facilities & Distribution Depots ({filteredResources.length})
              </h2>

              {filteredResources.length === 0 ? (
                <div className="p-8 text-center text-xs text-charcoal-muted bg-surface-raised rounded-lg border border-stone-200">
                  Nothing matches that search. Try a bigger area, or ask for help and a team will look for you.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResources.map(res => (
                    <div key={res.id} className="neu-card p-5 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-xs font-bold capitalize bg-stone-100 text-stone-800">
                            {res.category}
                          </span>
                          <StatusBadge status={res.operational_status} />
                        </div>

                        <h3 className="font-extrabold text-charcoal text-base">{res.name}</h3>
                        <p className="text-xs text-charcoal-light mt-1 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-terracotta shrink-0 mt-0.5" />
                          <span>{res.address_approximate}</span>
                        </p>
                        <p className="text-xs text-charcoal-muted mt-1 flex items-center gap-2">
                          <span className="font-semibold">{fmtKm(res.latitude, res.longitude)}</span>
                          <a href={directionsUrl(res.latitude, res.longitude)} target="_blank" rel="noreferrer" className="text-dustyblue font-bold hover:underline inline-flex items-center gap-0.5">
                            <Navigation className="w-3 h-3" aria-hidden="true" /> Directions
                          </a>
                        </p>

                        {/* Accessibility Badges */}
                        {res.accessibility_features && res.accessibility_features.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {res.accessibility_features.map((feat, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium">
                                ♿ {feat}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Public contact info */}
                        {res.contact_public && (
                          <div className="mt-3 p-2 bg-stone-100 rounded text-xs flex items-center justify-between">
                            <span className="text-charcoal-muted text-xs capitalize font-bold">Help Desk:</span>
                            <span className="font-bold text-charcoal">{res.contact_public}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                        <DataFreshness timestamp={res.last_verified_at} source={res.source_attribution} />
                        <a
                          href="/needer/request"
                          className="text-xs font-bold text-terracotta hover:underline"
                        >
                          Request Here
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Groups if requested or in 'all' */}
          {(activeCategory === 'all' || activeCategory === 'search_group') && filteredSearchGroups.length > 0 && (
            <div>
              <h2 className="text-base font-black text-charcoal mb-3 flex items-center gap-2">
                <Users2 className="w-4 h-4 text-dustyblue" />
                Active Search & Rescue Field Units ({filteredSearchGroups.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSearchGroups.map(g => (
                  <div key={g.id} className="neu-card p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-extrabold text-charcoal">{g.name}</span>
                      <StatusBadge status={g.operational_status} />
                    </div>
                    <p className="text-xs text-charcoal-light">📍 Region: {g.service_region}</p>
                    <p className="text-xs text-charcoal-muted mt-0.5">Perimeter: {g.approximate_area}</p>
                    <p className="text-xs text-charcoal-muted mt-0.5 font-semibold">Base {fmtKm(g.latitude, g.longitude)}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {g.capabilities.map((cap, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-stone-100 rounded text-stone-700">
                          {cap}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs font-bold text-charcoal flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-dustyblue" />
                      Dispatch Desk: {g.public_contact}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const FindHelp: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <FindHelpInner />
    </QueryClientProvider>
  );
};
