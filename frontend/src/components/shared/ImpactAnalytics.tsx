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

const COVERAGE: Record<string, { label: string; cls: string }> = {
  gap: { label: 'Not yet covered', cls: 'bg-red-100 text-red-800' },
  awaiting_response: { label: 'Awaiting Response', cls: 'bg-amber-100 text-amber-800' },
  responders_assigned: { label: 'Responders Assigned', cls: 'bg-sky-100 text-sky-800' },
  covered: { label: 'Fully Covered', cls: 'bg-emerald-100 text-emerald-800' },
  closed: { label: 'Closed', cls: 'bg-stone-100 text-stone-700' },
};

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
      <DemoBanner message="Counts come from the requests, places and teams recorded in KindMinds." />

      <div>
        <h1 className="text-[28px] md:text-[32px]">Relief coverage</h1>
        <p className="text-sm text-charcoal-muted mt-1">
          How many requests came in, how many were met, and which areas still need help.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-charcoal-muted">Loading…</div>
      ) : (
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="neu-card p-5 bauhaus-border">
              <div className="flex items-center justify-between text-charcoal-muted mb-2">
                <span className="text-xs font-bold capitalize">Demand Ingested</span>
                <Clock className="w-4 h-4 text-terracotta" />
              </div>
              <div className="num text-[32px] font-medium leading-none text-charcoal">
                {overview?.requests?.total ?? 0}
              </div>
              <span className="text-xs text-terracotta font-medium">Requests received</span>
            </div>

            <div className="neu-card p-5 bauhaus-border-blue">
              <div className="flex items-center justify-between text-charcoal-muted mb-2">
                <span className="text-xs font-bold capitalize">Fulfillment Rate</span>
                <CheckCircle2 className="w-4 h-4 text-dustyblue" />
              </div>
              <div className="num text-[32px] font-medium leading-none text-charcoal">
                {overview?.requests?.total > 0
                  ? `${Math.round((overview.requests.fulfilled / overview.requests.total) * 100)}%`
                  : '0%'}
              </div>
              <span className="text-xs text-dustyblue font-medium">{overview?.requests?.fulfilled ?? 0} delivered & closed</span>
            </div>

            <div className="neu-card p-5 bauhaus-border-sage">
              <div className="flex items-center justify-between text-charcoal-muted mb-2">
                <span className="text-xs font-bold capitalize">Stock Depots</span>
                <Boxes className="w-4 h-4 text-sage" />
              </div>
              <div className="num text-[32px] font-medium leading-none text-charcoal">
                {overview?.available_resources_count ?? 0}
              </div>
              <span className="text-xs text-emerald-700 font-medium">Places open</span>
            </div>

            <div className="neu-card p-5">
              <div className="flex items-center justify-between text-charcoal-muted mb-2">
                <span className="text-xs font-bold capitalize">Search Groups</span>
                <Users2 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="num text-[32px] font-medium leading-none text-charcoal">
                {overview?.active_search_groups_count ?? 0}
              </div>
              <span className="text-xs text-purple-700 font-medium">Rescue teams working</span>
            </div>
          </div>

          {/* Resource availability by category */}
          <div className="neu-card p-6">
            <div className="mb-4">
              <h2 className="text-base font-extrabold text-charcoal">Places by type</h2>
              <p className="text-xs text-charcoal-muted">Open, full or closed, for every listed place.</p>
            </div>
            {resourceFlow.length === 0 ? (
              <p className="text-xs text-charcoal-muted py-4 text-center">No facilities registered yet.</p>
            ) : (
              <ul className="space-y-3" role="list">
                {resourceFlow.map((row: any) => {
                  const total = row.total_facilities || 1;
                  const pct = (n: number) => `${(n / total) * 100}%`;
                  return (
                    <li key={row.category} className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-charcoal">{row.category}</span>
                        <span className="text-charcoal-muted">
                          <strong className="text-emerald-700">{row.available_facilities}</strong> available
                          {row.limited_facilities > 0 && <> · <strong className="text-amber-700">{row.limited_facilities}</strong> limited</>}
                          {row.unavailable_facilities > 0 && <> · <strong className="text-red-700">{row.unavailable_facilities}</strong> unavailable</>}
                          {' '}of {row.total_facilities}
                        </span>
                      </div>
                      <div
                        className="h-2.5 w-full rounded-full bg-stone-200 overflow-hidden flex"
                        role="img"
                        aria-label={`${row.category}: ${row.available_facilities} available, ${row.limited_facilities} limited, ${row.unavailable_facilities} unavailable of ${row.total_facilities}`}
                      >
                        <span className="h-full bg-emerald-600" style={{ width: pct(row.available_facilities) }} />
                        <span className="h-full bg-amber-500" style={{ width: pct(row.limited_facilities) }} />
                        <span className="h-full bg-red-600" style={{ width: pct(row.unavailable_facilities) }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Regional Relief Summary Table */}
          <div className="neu-card p-6">
            <div className="mb-4">
              <h2 className="text-base font-extrabold text-charcoal">By area</h2>
              <p className="text-xs text-charcoal-muted">Requests received and met in each area.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 text-charcoal-muted capitalize text-xs">
                  <tr>
                    <th className="py-2.5 px-3">Sector / Region</th>
                    <th className="py-2.5 px-3">Demands Logged</th>
                    <th className="py-2.5 px-3">Open</th>
                    <th className="py-2.5 px-3">Fulfilled Requests</th>
                    <th className="py-2.5 px-3">Coverage Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {regional.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-charcoal-muted">
                        No requests yet. Areas appear here as people ask for help.
                      </td>
                    </tr>
                  ) : (
                    regional.map((reg, idx) => (
                      <tr key={idx} className="hover:bg-surface-raised/40">
                        <td className="py-3 px-3 font-bold text-charcoal">{reg.region}</td>
                        <td className="py-3 px-3 font-semibold">{reg.total_requests}</td>
                        <td className="py-3 px-3 font-semibold text-amber-700">{(reg.awaiting_requests ?? 0) + (reg.in_progress_requests ?? 0)}</td>
                        <td className="py-3 px-3 font-semibold text-emerald-700">{reg.fulfilled_requests}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${(COVERAGE[reg.coverage_status] ?? COVERAGE.closed).cls}`}>
                            {(COVERAGE[reg.coverage_status] ?? COVERAGE.closed).label}
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
