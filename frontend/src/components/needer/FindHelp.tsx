import React, { useState } from 'react';
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
  const [locationInput, setLocationInput] = useState('');

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

  return (
    <div className="space-y-6">
      <DemoBanner />
      <AlertBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal tracking-tight">Find Humanitarian Help & Relief Points</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Verified emergency facilities, drinking water, food distribution, and medical care in your area.
          </p>
        </div>
        <a
          href="/needer/request"
          className="px-4 py-2 bg-terracotta text-white rounded-lg text-xs font-semibold hover:bg-terracotta-hover transition shadow-sm self-start sm:self-auto"
        >
          Can't find what you need? Request Help &rarr;
        </a>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="neu-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by facility name, neighborhood, or landmark..."
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
        <div className="p-12 text-center text-sm text-charcoal-muted">Loading verified relief resources...</div>
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
                  No public facilities found matching your search. Try searching a broader area or submit a direct assistance request.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResources.map(res => (
                    <div key={res.id} className="neu-card p-5 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800">
                            {res.category}
                          </span>
                          <StatusBadge status={res.operational_status} />
                        </div>

                        <h3 className="font-extrabold text-charcoal text-base">{res.name}</h3>
                        <p className="text-xs text-charcoal-light mt-1 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-terracotta shrink-0 mt-0.5" />
                          <span>{res.address_approximate}</span>
                        </p>

                        {/* Accessibility Badges */}
                        {res.accessibility_features && res.accessibility_features.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {res.accessibility_features.map((feat, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium">
                                ♿ {feat}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Public contact info */}
                        {res.contact_public && (
                          <div className="mt-3 p-2 bg-stone-100 rounded text-xs flex items-center justify-between">
                            <span className="text-charcoal-muted text-[10px] uppercase font-bold">Help Desk:</span>
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
                          Request Here &rarr;
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
                    <p className="text-[11px] text-charcoal-muted mt-0.5">Perimeter: {g.approximate_area}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {g.capabilities.map((cap, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 bg-stone-100 rounded text-stone-700">
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
