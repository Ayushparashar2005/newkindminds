import React from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { getMyRequestIds } from '../../lib/myRequests';
import { DemoBanner } from '../ui/DemoBanner';
import { StatusBadge } from '../ui/StatusBadge';
import { DataFreshness } from '../ui/DataFreshness';
import { Clock, UserCheck, Ban } from 'lucide-react';
import type { AssistanceRequest } from '../../types';

const MyRequestsInner: React.FC = () => {
  const qc = useQueryClient();

  const [myIds, setMyIds] = React.useState<string[] | null>(null);
  React.useEffect(() => setMyIds(getMyRequestIds()), []);

  const { data: allRequests = [], isLoading: queryLoading } = useQuery({
    queryKey: ['assistance-requests'],
    queryFn: () => api.getRequests(),
    staleTime: 30_000,
  });
  const loading = queryLoading || myIds === null;
  const requests = (allRequests as AssistanceRequest[]).filter((r) => myIds?.includes(r.id));

  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);
  const [cancelError, setCancelError] = React.useState<string | null>(null);

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.updateRequestStatus(id, { status: 'cancelled' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assistance-requests'] });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview'] });
      setConfirmingId(null);
      setCancelError(null);
    },
    onError: () => {
      setCancelError('Failed to cancel the request. Please try again.');
    }
  });

  const handleCancel = (id: string) => {
    cancelMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] md:text-[32px]">My requests</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            See who has picked up your request and what happens next.
          </p>
        </div>
        <a
          href="/needer/request"
          className="px-4 py-2 bg-terracotta text-white rounded-lg text-xs font-semibold hover:bg-terracotta-hover transition shadow-sm self-start sm:self-auto"
        >
          Submit New Request
        </a>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-charcoal-muted">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="neu-card p-12 text-center space-y-3">
          <p className="text-sm text-charcoal-muted">You have not asked for help yet.</p>
          <a
            href="/needer/request"
            className="inline-block px-4 py-2 bg-terracotta text-white rounded text-xs font-bold hover:bg-terracotta-hover transition"
          >
            Ask for help
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="neu-card p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold capitalize bg-stone-100 text-stone-800">
                      {req.assistance_category}
                    </span>
                    <StatusBadge status={req.status} />
                    <span className="text-xs text-charcoal-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Submitted: {new Date(req.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-charcoal text-base">{req.description}</h3>

                  <div className="text-xs text-charcoal-light space-y-1">
                    <p>Location: <strong>{req.approximate_location}</strong></p>
                    <p>Contact: <strong>{req.preferred_contact_method}</strong> ({req.contact_value || 'On record'})</p>
                    {req.accessibility_needs && (
                      <p className="text-terracotta font-semibold">⚠️ Specific Needs: {req.accessibility_needs}</p>
                    )}
                  </div>

                  {/* Responders Box */}
                  {req.assigned_organization_name ? (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1 text-blue-900">
                      <div className="flex items-center gap-1.5 font-bold">
                        <UserCheck className="w-4 h-4 text-dustyblue" />
                        <span>Organisation: {req.assigned_organization_name}</span>
                      </div>
                      {req.assigned_helper_name && (
                        <p className="text-xs">Team lead: <strong>{req.assigned_helper_name}</strong></p>
                      )}
                      {req.notes && (
                        <p className="text-xs text-blue-800 italic mt-1">Status Note: {req.notes}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded text-amber-900">
                      <p className="font-medium text-xs">
                        No team has picked this up yet. Medical and rescue requests are handled first.
                      </p>
                    </div>
                  )}

                  {req.status !== 'fulfilled' && req.status !== 'cancelled' && (
                    <div className="mt-3 flex flex-col items-end gap-1">
                      {confirmingId === req.id ? (
                        <div className="flex items-center gap-2 text-xs" role="group" aria-label="Confirm cancellation">
                          <span className="text-charcoal font-semibold">Cancel this request?</span>
                          <button
                            onClick={() => handleCancel(req.id)}
                            disabled={cancelMutation.isPending}
                            className="px-2.5 py-1 bg-red-700 text-white rounded font-bold disabled:opacity-50"
                          >
                            {cancelMutation.isPending ? 'Cancelling…' : 'Yes, cancel'}
                          </button>
                          <button onClick={() => { setConfirmingId(null); setCancelError(null); }} className="px-2.5 py-1 border border-stone-300 rounded font-semibold">
                            Keep it
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setConfirmingId(req.id); setCancelError(null); }}
                          className="text-stone-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Cancel Request
                        </button>
                      )}
                      {cancelError && confirmingId === req.id && (
                        <p role="alert" className="text-xs text-red-800">{cancelError}</p>
                      )}
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
