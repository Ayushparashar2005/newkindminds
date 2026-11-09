import React from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { DemoBanner } from '../ui/DemoBanner';
import { StatusBadge } from '../ui/StatusBadge';
import { DataFreshness } from '../ui/DataFreshness';
import { Clock, UserCheck, Ban } from 'lucide-react';
import type { AssistanceRequest } from '../../types';

const MyRequestsInner: React.FC = () => {
  const qc = useQueryClient();

  const { data: requests = [], isLoading: loading } = useQuery({
    queryKey: ['assistance-requests'],
    queryFn: () => api.getRequests(),
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.updateRequestStatus(id, { status: 'cancelled' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assistance-requests'] });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview'] });
    },
    onError: () => {
      alert('Failed to cancel request');
    }
  });

  const handleCancel = (id: string) => {
    if (!confirm('Are you sure you want to cancel this assistance request?')) return;
    cancelMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal tracking-tight">My Assistance Requests</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Track current triage status, assigned responders, and fulfillment confirmations.
          </p>
        </div>
        <a
          href="/needer/request"
          className="px-4 py-2 bg-terracotta text-white rounded-lg text-xs font-semibold hover:bg-terracotta-hover transition shadow-sm self-start sm:self-auto"
        >
          Submit New Request &rarr;
        </a>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-charcoal-muted">Loading your requests...</div>
      ) : requests.length === 0 ? (
        <div className="neu-card p-12 text-center space-y-3">
          <p className="text-sm text-charcoal-muted">You have no active assistance requests on record.</p>
          <a
            href="/needer/request"
            className="inline-block px-4 py-2 bg-terracotta text-white rounded text-xs font-bold hover:bg-terracotta-hover transition"
          >
            Request Food, Water, Shelter, or Medical Care
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="neu-card p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800">
                      {req.assistance_category}
                    </span>
                    <StatusBadge status={req.status} />
                    <span className="text-[11px] text-charcoal-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Submitted: {new Date(req.created_at).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-charcoal text-base">{req.description}</h3>

                  <div className="text-xs text-charcoal-light space-y-1">
                    <p>📍 Location Provided: <strong>{req.approximate_location}</strong></p>
                    <p>📞 Preferred Contact: <strong>{req.preferred_contact_method}</strong> ({req.contact_value || 'On record'})</p>
                    {req.accessibility_needs && (
                      <p className="text-terracotta font-semibold">⚠️ Specific Needs: {req.accessibility_needs}</p>
                    )}
                  </div>

                  {/* Responders Box */}
                  {req.assigned_organization_name ? (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1 text-blue-900">
                      <div className="flex items-center gap-1.5 font-bold">
                        <UserCheck className="w-4 h-4 text-dustyblue" />
                        <span>Assigned Humanitarian Agency: {req.assigned_organization_name}</span>
                      </div>
                      {req.assigned_helper_name && (
                        <p className="text-[11px]">Assigned Team Lead: <strong>{req.assigned_helper_name}</strong></p>
                      )}
                      {req.notes && (
                        <p className="text-[11px] text-blue-800 italic mt-1">Status Note: {req.notes}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded text-amber-900">
                      <p className="font-medium text-[11px]">
                        Awaiting triage by local response cluster. Responders prioritize immediate medical and safety needs.
                      </p>
                    </div>
                  )}

                  {req.status !== 'fulfilled' && req.status !== 'cancelled' && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleCancel(req.id)}
                        className="text-stone-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MyRequests: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MyRequestsInner />
    </QueryClientProvider>
  );
};
