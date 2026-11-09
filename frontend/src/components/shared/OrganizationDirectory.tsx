import React, { useState } from 'react';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { DemoBanner } from '../ui/DemoBanner';
import { StatusBadge } from '../ui/StatusBadge';
import { DataFreshness } from '../ui/DataFreshness';
import { Building2, Phone } from 'lucide-react';

interface OrganizationDirectoryProps {
  panel?: 'helper' | 'needer';
}

const OrganizationDirectoryInner: React.FC<OrganizationDirectoryProps> = ({ panel = 'needer' }) => {
  const [search, setSearch] = useState('');

  const { data: organizations = [], isLoading: loading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.getOrganizations(),
    staleTime: 60_000,
  });

  const filtered = organizations.filter(org => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = org.name.toLowerCase().includes(q);
      const matchDesc = org.description.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal tracking-tight">Humanitarian Organizations & NGOs</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Directory of verified relief networks, medical NGOs, shelter providers, and disaster response alliances.
          </p>
        </div>
        {panel === 'helper' && (
          <a
            href="/helper/profile"
            className="px-4 py-2 bg-dustyblue text-white rounded-lg text-xs font-semibold hover:bg-dustyblue-hover transition shadow-sm self-start sm:self-auto"
          >
            Manage My Organization &rarr;
          </a>
        )}
      </div>

      {/* Search Input */}
      <div className="neu-card p-4">
        <input
          type="text"
          placeholder="Search by organization name or relief capability (e.g., Red Cross, Medical, Search)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2.5 bg-surface border border-stone-300 rounded-lg text-xs text-charcoal placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-dustyblue"
        />
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-charcoal-muted">Loading verified organizations...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-sm text-charcoal-muted">No organizations match your query.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(org => (
            <div key={org.id} className="neu-card p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800">
                    {org.organization_type}
                  </span>
                  <StatusBadge status={org.verification_status} />
                </div>

                <h3 className="font-extrabold text-charcoal text-base flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-dustyblue" />
                  {org.name}
                </h3>

                <p className="text-xs text-charcoal-light mt-2 leading-relaxed">{org.description}</p>

                {/* Capabilities Badges */}
                {org.assistance_categories && org.assistance_categories.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] uppercase font-bold text-charcoal-muted block mb-1">
                      Assistance Capabilities:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {org.assistance_categories.map((cat, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-700 rounded capitalize font-medium">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Geographic Coverage */}
                {org.geographic_coverage && org.geographic_coverage.length > 0 && (
                  <div className="mt-2 text-xs text-charcoal-muted">
                    Coverage: <strong>{org.geographic_coverage.join(', ')}</strong>
                  </div>
                )}
              </div>

              {/* Footer with Public Hotline and Panel Action */}
              <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-charcoal">
                    <Phone className="w-3.5 h-3.5 text-dustyblue" />
                    {org.public_contact}
                  </span>
                  {panel === 'needer' ? (
                    <a
                      href="/needer/request"
                      className="px-3 py-1.5 bg-terracotta text-white rounded text-xs font-bold hover:bg-terracotta-hover transition"
                    >
                      Request Assistance &rarr;
                    </a>
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-semibold">Active in Sector</span>
                  )}
                </div>
                <DataFreshness timestamp={org.last_verified_at} source="Inter-Agency Standing Committee Registry" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const OrganizationDirectory: React.FC<OrganizationDirectoryProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <OrganizationDirectoryInner {...props} />
    </QueryClientProvider>
  );
};
