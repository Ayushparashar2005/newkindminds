import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { DemoBanner } from '../ui/DemoBanner';
import { AlertBanner } from '../ui/AlertBanner';
import { StatusBadge } from '../ui/StatusBadge';
import {
  Activity,
  ClipboardList,
  Boxes,
  Users2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import type { AssistanceRequest } from '../../types';

const HelperDashboardInner: React.FC = () => {
  const qc = useQueryClient();
  const [statusError, setStatusError] = useState<string | null>(null);

  // TanStack Query — live DB analytics
  const { data: overview, isLoading: overviewLoading, dataUpdatedAt } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: api.getAnalyticsOverview,
    refetchInterval: 60_000, // auto-refresh every minute
  });

  // TanStack Query — assistance requests
  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['assistance-requests'],
    queryFn: () => api.getRequests(),
    refetchInterval: 30_000,
  });

  // TanStack Mutation — update request status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateRequestStatus(id, { status }),
    onSuccess: () => {
      setStatusError(null);
      // Invalidate both requests list and overview so counts update
      qc.invalidateQueries({ queryKey: ['assistance-requests'] });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview'] });
    },
    onError: () => {
      setStatusError('Failed to update request status. Please try again.');
    },
  });

  const loading = overviewLoading || requestsLoading;
  const lastRefreshed = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <div className="space-y-6" id="main-content">
      <DemoBanner />
      <AlertBanner />

      {statusError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium" role="alert" aria-live="assertive">
          <span aria-hidden="true">⚠️ </span>{statusError}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal tracking-tight">Helper Operations Center</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Real-time coordination for NGOs, medical personnel, SAR teams, and relief workers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="text-[11px] text-charcoal-muted hidden sm:flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Updated {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <a
            href="/helper/requests"
            className="px-4 py-2 bg-dustyblue text-white rounded-lg text-xs font-semibold hover:bg-dustyblue-hover transition shadow-sm flex items-center gap-1.5"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Triage Requests
          </a>
          <a
            href="/helper/resources"
            className="px-4 py-2 bg-surface text-charcoal rounded-lg text-xs font-semibold border border-stone-300 hover:bg-surface-raised transition shadow-sm flex items-center gap-1.5"
          >
            <Boxes className="w-3.5 h-3.5" />
            Manage Inventory
          </a>
        </div>
      </div>

      {/* Live Calculated Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="neu-card p-4 bauhaus-border">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Disasters</span>
            <Activity className="w-4 h-4 text-terracotta" />
          </div>
          <div className="text-2xl font-black text-charcoal">
            {overviewLoading ? <span className="animate-pulse">—</span> : overview?.active_disasters_count ?? '—'}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">Computed live from DB</span>
        </div>

        <div className="neu-card p-4 bauhaus-border-blue">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Requests in Queue</span>
            <Clock className="w-4 h-4 text-dustyblue" />
          </div>
          <div className="text-2xl font-black text-charcoal">
            {overviewLoading ? <span className="animate-pulse">—</span> : overview?.requests?.submitted ?? '—'}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">Awaiting triage/assignment</span>
        </div>

        <div className="neu-card p-4 bauhaus-border-sage">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
            <ClipboardList className="w-4 h-4 text-sage" />
          </div>
          <div className="text-2xl font-black text-charcoal">
            {overviewLoading ? (
              <span className="animate-pulse">—</span>
            ) : (
              ((overview?.requests?.in_progress ?? 0) + (overview?.requests?.assigned ?? 0))
            )}
          </div>
          <span className="text-[11px] text-sky-700 font-medium">Assigned responders active</span>
        </div>

        <div className="neu-card p-4 border-l-4 border-emerald-600">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Fulfilled Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-charcoal">
            {overviewLoading ? <span className="animate-pulse">—</span> : overview?.requests?.fulfilled ?? '—'}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">Verified completed</span>
        </div>
      </div>

      {/* Triage & Incoming Requests Table */}
      <div className="neu-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-charcoal">Active Community Requests Awaiting Action</h2>
            <p className="text-xs text-charcoal-muted">Prioritize requests by accessibility needs and urgency.</p>
          </div>
          <a href="/helper/requests" className="text-xs font-bold text-dustyblue hover:underline flex items-center gap-1">
            View All ({requests.length}) <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-charcoal-muted">
            <div className="animate-pulse flex flex-col items-center gap-2">
              <div className="h-3 bg-stone-200 rounded w-48" />
              <div className="h-3 bg-stone-200 rounded w-36" />
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-charcoal-muted">No pending requests at this time.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 text-charcoal-muted uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Requester / Category</th>
                  <th className="py-2.5 px-3">Approximate Location</th>
                  <th className="py-2.5 px-3">Needs & Vulnerability</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {(requests as AssistanceRequest[]).slice(0, 5).map((req) => (
                  <tr key={req.id} className="hover:bg-surface-raised/40 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-charcoal">{req.user_name || 'Community Member'}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-[10px] capitalize font-medium">
                        {req.assistance_category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-charcoal-light">{req.approximate_location}</td>
                    <td className="py-3 px-3 max-w-xs">
                      <p className="line-clamp-2 text-charcoal">{req.description}</p>
                      {req.accessibility_needs && (
                        <span className="text-[10px] font-semibold text-terracotta block mt-0.5">
                          ⚠️ {req.accessibility_needs}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                      {req.status === 'submitted' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: req.id, status: 'in_progress' })}
                          disabled={statusMutation.isPending}
                          className="px-2.5 py-1 bg-dustyblue text-white rounded font-medium hover:bg-dustyblue-hover transition text-[11px] disabled:opacity-60"
                        >
                          Accept
                        </button>
                      )}
                      {req.status === 'in_progress' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: req.id, status: 'fulfilled' })}
                          disabled={statusMutation.isPending}
                          className="px-2.5 py-1 bg-emerald-700 text-white rounded font-medium hover:bg-emerald-800 transition text-[11px] disabled:opacity-60"
                        >
                          Mark Fulfilled
                        </button>
                      )}
                      <a
                        href="/helper/requests"
                        className="px-2.5 py-1 bg-surface border border-stone-300 rounded text-charcoal hover:bg-stone-100 transition text-[11px]"
                      >
                        Details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Operational Modules Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="neu-card p-5">
          <div className="flex items-center gap-2 mb-2 font-bold text-sm text-charcoal">
            <Boxes className="w-4 h-4 text-terracotta" />
            Warehouse & Depots
          </div>
          <p className="text-xs text-charcoal-muted mb-4">
            Track water purification units, shelter kits, trauma kits, and food reserves.
          </p>
          <a href="/helper/resources" className="text-xs font-bold text-terracotta hover:underline inline-flex items-center gap-1">
            Review Depots &rarr;
          </a>
        </div>

        <div className="neu-card p-5">
          <div className="flex items-center gap-2 mb-2 font-bold text-sm text-charcoal">
            <Users2 className="w-4 h-4 text-dustyblue" />
            Search & Rescue Taskforces
          </div>
          <p className="text-xs text-charcoal-muted mb-4">
            Coordinate swift-water rescue teams, drone reconnaissance, and extraction squads.
          </p>
          <a href="/helper/search-groups" className="text-xs font-bold text-dustyblue hover:underline inline-flex items-center gap-1">
            Manage SAR Groups &rarr;
          </a>
        </div>

        <div className="neu-card p-5">
          <div className="flex items-center gap-2 mb-2 font-bold text-sm text-charcoal">
            <ShieldCheck className="w-4 h-4 text-sage" />
            Standard Operating Procedures
          </div>
          <p className="text-xs text-charcoal-muted mb-4">
            Access verified NDMA, Red Cross, and WHO guidelines with AI-assisted quick summaries.
          </p>
          <a href="/helper/sop" className="text-xs font-bold text-sage hover:underline inline-flex items-center gap-1">
            Read Procedures &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};

export const HelperDashboard: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelperDashboardInner />
    </QueryClientProvider>
  );
};
