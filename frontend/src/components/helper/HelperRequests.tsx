import React, { useState, useRef, useEffect, useId } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { DemoBanner } from '../ui/DemoBanner';
import { StatusBadge } from '../ui/StatusBadge';
import { DataFreshness } from '../ui/DataFreshness';
import {
  Search,
  X,
  Clock,
  UserCheck
} from 'lucide-react';
import type { AssistanceRequest, Organization } from '../../types';

const HelperRequestsInner: React.FC = () => {
  const qc = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [panelError, setPanelError] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<AssistanceRequest | null>(null);
  const [assigneeName, setAssigneeName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // For focus management when modal opens
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const searchId = useId();
  const orgSelectId = useId();
  const assigneeId = useId();
  const notesId = useId();
  const liveRegionId = useId();

  // Trap focus inside modal and announce status changes
  useEffect(() => {
    if (activeRequest && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [activeRequest]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeRequest) {
        setActiveRequest(null);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [activeRequest]);

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['assistance-requests'],
    queryFn: () => api.getRequests(),
    staleTime: 30_000,
  });

  const { data: orgs = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.getOrganizations(),
    staleTime: 60_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      api.updateRequestStatus(id, { status, notes }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['assistance-requests'] });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview'] });
      setActiveRequest(null);
      setResolutionNotes('');
      setPanelError(null);
    },
    onError: () => {
      setPanelError('Failed to update the request status. Please try again.');
    }
  });

  const assignResponderMutation = useMutation({
    mutationFn: ({ id, orgId, helperName }: { id: string; orgId: string; helperName: string }) =>
      api.assignResponder(id, orgId, helperName),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['assistance-requests'] });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview'] });
      setActiveRequest(null);
      setAssigneeName('');
      setPanelError(null);
    },
    onError: () => {
      setPanelError('Failed to assign the responder. Please try again.');
    }
  });

  const loading = requestsLoading || orgsLoading;

  const handleUpdateStatus = (status: string) => {
    if (!activeRequest) return;
    updateStatusMutation.mutate({
      id: activeRequest.id,
      status,
      notes: resolutionNotes || activeRequest.notes
    });
  };

  const handleAssign = () => {
    const orgId = selectedOrgId || (orgs[0]?.id ?? '');
    if (!activeRequest || !orgId || !assigneeName) {
      setPanelError('Enter the responder name and choose an organization before assigning.');
      return;
    }
    setPanelError(null);
    assignResponderMutation.mutate({
      id: activeRequest.id,
      orgId,
      helperName: assigneeName
    });
  };

  const filteredRequests = requests.filter(r => {
    if (selectedCategory !== 'all' && r.assistance_category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.description.toLowerCase().includes(q) ||
        r.approximate_location.toLowerCase().includes(q) ||
        (r.user_name && r.user_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <DemoBanner />

      {/* ARIA live region for status update announcements */}
      <div id={liveRegionId} aria-live="polite" aria-atomic="true" className="sr-only" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] md:text-[32px]">Requests</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Read each request, assign a team and update its status.
          </p>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="neu-card p-4 space-y-3" role="search" aria-label="Filter and search requests">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <label htmlFor={searchId} className="sr-only">Search requests by keyword, location, or name</label>
            <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" aria-hidden="true" />
            <input
              id={searchId}
              type="search"
              placeholder="Search by place, name or need"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-stone-300 rounded-lg text-xs text-charcoal placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-dustyblue min-h-[44px]"
            />
          </div>

          <div className="text-xs text-charcoal-muted font-medium" role="status" aria-live="polite">
            Showing <strong>{filteredRequests.length}</strong> of <strong>{requests.length}</strong> total requests
          </div>
        </div>

        {/* Categories Pill Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200" role="group" aria-label="Filter by category">
          <span className="text-xs font-bold text-charcoal mr-1" aria-hidden="true">Category:</span>
          {['all', 'medical', 'shelter', 'food', 'water', 'evacuation', 'mental_health'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={selectedCategory === cat}
              className={`px-2.5 py-1 rounded text-xs capitalize font-semibold transition min-h-[36px] ${
                selectedCategory === cat
                  ? 'bg-charcoal text-white'
                  : 'bg-surface border border-stone-300 text-charcoal hover:bg-stone-100'
              }`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
          <span className="text-xs font-bold text-charcoal mr-1" aria-hidden="true">Status:</span>
          {['all', 'submitted', 'assigned', 'in_progress', 'fulfilled', 'unable_to_fulfill', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              aria-pressed={selectedStatus === st}
              className={`px-2.5 py-1 rounded text-xs capitalize font-semibold transition min-h-[36px] ${
                selectedStatus === st
                  ? 'bg-charcoal text-white'
                  : 'bg-surface border border-stone-300 text-charcoal hover:bg-stone-100'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="neu-card p-6">
        {loading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading requests">
            {[1, 2, 3].map(i => (
              <div key={i} className="py-4 border-b border-stone-200 last:border-0">
                <div className="skeleton h-4 w-1/3 mb-2" />
                <div className="skeleton h-3 w-2/3 mb-1" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center" role="status">
            <p className="text-sm text-charcoal-muted">No requests match these filters.</p>
            <button
              onClick={() => { setSelectedCategory('all'); setSelectedStatus('all'); setSearchQuery(''); }}
              className="mt-3 text-xs font-bold text-dustyblue hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-stone-200" role="list" aria-label={`${filteredRequests.length} assistance requests`}>
            {filteredRequests.map(req => (
              <li key={req.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs font-bold capitalize bg-stone-100 text-stone-800">
                      {req.assistance_category}
                    </span>
                    <StatusBadge status={req.status} />
                    <span className="text-xs font-black text-charcoal">{req.user_name || 'Community Member'}</span>
                    <span className="text-xs text-charcoal-muted">· {new Date(req.created_at).toLocaleString('en-IN')}</span>
                  </div>

                  <p className="text-xs text-charcoal font-medium leading-relaxed">{req.description}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-charcoal-light pt-1">
                    <span>📍 Approximate: <strong>{req.approximate_location}</strong></span>
                    {req.latitude != null && <span className="text-xs px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 font-bold">Map pin</span>}
                    <span>📞 Contact: <strong>{req.preferred_contact_method}</strong> ({req.contact_value || 'On record'})</span>
                    {req.accessibility_needs && (
                      <span className="text-terracotta font-semibold">⚠️ Needs: {req.accessibility_needs}</span>
                    )}
                  </div>

                  {req.assigned_organization_name && (
                    <div className="p-2 bg-stone-100 rounded text-xs text-charcoal flex items-center gap-2 mt-2">
                      <UserCheck className="w-3.5 h-3.5 text-dustyblue" aria-hidden="true" />
                      <span>Assigned to <strong>{req.assigned_organization_name}</strong> {req.assigned_helper_name ? `(${req.assigned_helper_name})` : ''}</span>
                    </div>
                  )}

                  {req.notes && (
                    <p className="text-xs text-stone-600 bg-surface-raised p-2 rounded border border-stone-200">
                      Note: {req.notes}
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setActiveRequest(req);
                      setPanelError(null);
                      setResolutionNotes(req.notes || '');
                    }}
                    aria-label={`Open triage panel for ${req.user_name || 'Community Member'} (${req.assistance_category} request)`}
                    className="px-3 py-1.5 bg-charcoal text-white rounded text-xs font-semibold hover:bg-charcoal-light transition whitespace-nowrap shadow-sm min-h-[44px]"
                  >
                    Action / Triage
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal / Action Drawer for Triage */}
      {activeRequest && (
        <div
          className="fixed inset-0 z-50 km-backdrop flex items-center justify-center p-4"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveRequest(null); }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="triage-dialog-title"
            className="km-dialog shadow-xl neu-card p-6 max-w-lg w-full bg-surface space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 id="triage-dialog-title" className="text-base font-black text-charcoal">
                Triage Request #{activeRequest.id.slice(0, 8)}
              </h2>
              <button
                ref={closeButtonRef}
                onClick={() => setActiveRequest(null)}
                aria-label="Close"
                className="text-stone-400 hover:text-charcoal font-bold text-sm p-1.5 rounded hover:bg-stone-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div>
                <span className="font-bold text-charcoal-muted capitalize text-xs">Requester Needs</span>
                <p className="text-charcoal mt-0.5">{activeRequest.description}</p>
              </div>
              <div>
                <span className="font-bold text-charcoal-muted capitalize text-xs">Location</span>
                <p className="text-charcoal mt-0.5">{activeRequest.approximate_location}</p>
                {activeRequest.latitude != null && activeRequest.longitude != null && (
                  <p className="mt-1 text-xs text-charcoal-muted">
                    📍 Pinned {activeRequest.latitude.toFixed(5)}, {activeRequest.longitude.toFixed(5)}.{' '}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${activeRequest.latitude},${activeRequest.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-dustyblue font-bold hover:underline"
                    >
                      Navigate
                    </a>
                  </p>
                )}
              </div>
            </div>

            {/* Responder Assignment Section */}
            <fieldset className="p-3 bg-surface-raised rounded-lg border border-stone-200 space-y-2 text-xs">
              <legend className="font-bold text-charcoal px-1">Assign a team</legend>
              <div className="space-y-2">
                <div>
                  <label htmlFor={orgSelectId} className="text-xs text-charcoal-muted block mb-0.5">Organisation</label>
                  <select
                    id={orgSelectId}
                    value={selectedOrgId || (orgs[0]?.id ?? '')}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full p-2 bg-surface border border-stone-300 rounded text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-dustyblue min-h-[44px]"
                  >
                    {orgs.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={assigneeId} className="text-xs text-charcoal-muted block mb-0.5">Team lead</label>
                  <input
                    id={assigneeId}
                    type="text"
                    placeholder="e.g. Dr. Ananya Sharma"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    className="w-full p-2 bg-surface border border-stone-300 rounded text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-dustyblue min-h-[44px]"
                  />
                </div>
                <button
                  onClick={handleAssign}
                  disabled={assignResponderMutation.isPending}
                  aria-busy={assignResponderMutation.isPending}
                  className="w-full py-2 bg-charcoal text-white rounded text-xs font-semibold hover:bg-charcoal-light transition min-h-[44px] disabled:opacity-60"
                >
                  {assignResponderMutation.isPending ? 'Assigning…' : 'Assign team'}
                </button>
              </div>
            </fieldset>

            {panelError && (
              <p role="alert" className="text-xs text-red-800 bg-red-50 border border-red-200 rounded p-2">{panelError}</p>
            )}

            {/* Resolution Notes Section */}
            <div className="space-y-1 text-xs">
              <label htmlFor={notesId} className="font-bold text-charcoal block">Notes</label>
              <textarea
                id={notesId}
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="What has been done, what is still needed"
                className="w-full p-2 bg-surface border border-stone-300 rounded text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-dustyblue"
              />
            </div>

            {/* Status Transition Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-stone-200" role="group" aria-label="Update request status">
              <button
                onClick={() => handleUpdateStatus('unable_to_fulfill')}
                disabled={updateStatusMutation.isPending}
                className="px-3 py-1.5 bg-red-100 text-red-800 rounded text-xs font-semibold hover:bg-red-200 transition min-h-[44px] disabled:opacity-60"
              >
                Unable to Fulfill
              </button>
              <button
                onClick={() => handleUpdateStatus('in_progress')}
                disabled={updateStatusMutation.isPending}
                className="px-3 py-1.5 bg-sky-100 text-sky-800 rounded text-xs font-semibold hover:bg-sky-200 transition min-h-[44px] disabled:opacity-60"
              >
                In Progress
              </button>
              <button
                onClick={() => handleUpdateStatus('fulfilled')}
                disabled={updateStatusMutation.isPending}
                aria-busy={updateStatusMutation.isPending}
                className="px-4 py-1.5 bg-emerald-700 text-white rounded text-xs font-bold hover:bg-emerald-800 transition shadow-sm min-h-[44px] disabled:opacity-60"
              >
                {updateStatusMutation.isPending ? 'Updating…' : 'Mark Fulfilled & Verified'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const HelperRequests: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelperRequestsInner />
    </QueryClientProvider>
  );
};
