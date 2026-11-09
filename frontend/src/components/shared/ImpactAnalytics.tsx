import React from 'react';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { DemoBanner } from '../ui/DemoBanner';
import { DataFreshness } from '../ui/DataFreshness';
import {
  Boxes,
  CheckCircle2,
  Clock,
  Users2
} from 'lucide-react';

const ImpactAnalyticsInner: React.FC = () => {
  const { data: overview, isLoading: ovLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.getAnalyticsOverview(),
    staleTime: 60_000,
  });

  const { data: regional = [], isLoading: regLoading } = useQuery({
    queryKey: ['analytics', 'regional'],
    queryFn: () => api.getRegionalAnalytics(),
    staleTime: 60_000,
  });

  const { data: resourceFlow = [], isLoading: flowLoading } = useQuery({
    queryKey: ['analytics', 'resource-flow'],
    queryFn: () => api.getResourceFlow(),
    staleTime: 60_000,
  });

  const loading = ovLoading || regLoading || flowLoading;

  return (
    <div className="space-y-6">
      <DemoBanner message="HUMANITARIAN RELIEF ANALYTICS: Visualizing live assistance demand vs fulfillment and supply chain distributions across disaster zones. Computed strictly from active database records." />

      <div>
        <h1 className="text-2xl font-black text-charcoal tracking-tight">Humanitarian Impact & Relief Analytics</h1>
        <p className="text-sm text-charcoal-muted mt-1">
          Tracking assistance demand, verified fulfillment rates, regional bottlenecks, and resource flows.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-charcoal-muted">Computing live humanitarian metrics...</div>
      ) : (
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="neu-card p-5 bauhaus-border">
              <div className="flex items-center justify-between text-charcoal-muted mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Demand Ingested</span>
                <Clock className="w-4 h-4 text-terracotta" />
              </div>
              <div className="text-3xl font-black text-charcoal">
                {overview?.requests?.total ?? 0}
              </div>
              <span className="text-[11px] text-terracotta font-medium">Assistance requests logged</span>
            </div>

            <div className="neu-card p-5 bauhaus-border-blue">
              <div className="flex items-center justify-between text-charcoal-muted mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Fulfillment Rate</span>
                <CheckCircle2 className="w-4 h-4 text-dustyblue" />
              </div>
              <div className="text-3xl font-black text-charcoal">
                {overview?.requests?.total > 0
                  ? `${Math.round((overview.requests.fulfilled / overview.requests.total) * 100)}%`
                  : '0%'}
              </div>
              <span className="text-[11px] text-dustyblue font-medium">{overview?.requests?.fulfilled ?? 0} delivered & closed</span>
            </div>

            <div className="neu-card p-5 bauhaus-border-sage">
              <div className="flex items-center justify-between text-charcoal-muted mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Stock Depots</span>
                <Boxes className="w-4 h-4 text-sage" />
              </div>
              <div className="text-3xl font-black text-charcoal">
                {overview?.available_resources_count ?? 0}
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Operational relief hubs</span>
            </div>

            <div className="neu-card p-5 border-l-4 border-purple-600">
              <div className="flex items-center justify-between text-charcoal-muted mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Search Groups</span>
                <Users2 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-black text-charcoal">
                {overview?.active_search_groups_count ?? 0}
              </div>
              <span className="text-[11px] text-purple-700 font-medium">Field rescue squads deployed</span>
            </div>
          </div>

          {/* Regional Relief Summary Table */}
          <div className="neu-card p-6">
            <div className="mb-4">
              <h2 className="text-base font-extrabold text-charcoal">Regional Response Summary</h2>
              <p className="text-xs text-charcoal-muted">Sector breakdown of incoming demands and fulfilled relief missions.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 text-charcoal-muted uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Sector / Region</th>
                    <th className="py-2.5 px-3">Demands Logged</th>
                    <th className="py-2.5 px-3">Fulfilled Requests</th>
                    <th className="py-2.5 px-3">Coverage Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {regional.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-charcoal-muted">
                        No regional distribution logged yet. Data will populate as requests are submitted.
                      </td>
                    </tr>
                  ) : (
                    regional.map((reg, idx) => (
                      <tr key={idx} className="hover:bg-surface-raised/40">
                        <td className="py-3 px-3 font-bold text-charcoal">{reg.region}</td>
                        <td className="py-3 px-3 font-semibold">{reg.total_requests}</td>
                        <td className="py-3 px-3 font-semibold text-emerald-700">{reg.fulfilled_requests}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                            Assistance Active
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <DataFreshness timestamp={overview?.last_updated} source="District Relief Management Aggregation Layer" />
          </div>
        </div>
      )}
    </div>
  );
};

export const ImpactAnalytics: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ImpactAnalyticsInner />
    </QueryClientProvider>
  );
};
