import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { DemoBanner } from '../ui/DemoBanner';
import { geocodeIndia } from '../../lib/geo';
import { LocationField } from '../ui/LocationPicker';
import type { PickedLocation } from '../../lib/location';
import { StatusBadge } from '../ui/StatusBadge';
import { DataFreshness } from '../ui/DataFreshness';
import { Users2, Plus, Phone, Compass, ShieldAlert, CheckCircle } from 'lucide-react';
import type { SearchGroup } from '../../types';

const HelperSearchGroupsInner: React.FC = () => {
  const qc = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  // New Group Form
  const [name, setName] = useState('');
  const [serviceRegion, setServiceRegion] = useState('');
  const [approxArea, setApproxArea] = useState('');
  const [capabilities, setCapabilities] = useState('');
  const [publicContact, setPublicContact] = useState('');
  const [basePoint, setBasePoint] = useState<PickedLocation | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: groups = [], isLoading: loading } = useQuery({
    queryKey: ['search-groups'],
    queryFn: () => api.getSearchGroups(),
    staleTime: 60_000,
  });

  const createGroupMutation = useMutation({
    mutationFn: (data: Partial<SearchGroup>) => api.createSearchGroup(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['search-groups'] });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview'] });
      setShowAddModal(false);
      setName('');
      setServiceRegion('');
      setApproxArea('');
      setCapabilities('');
      setPublicContact('');
      setBasePoint(null);
      setFormError(null);
    },
    onError: () => {
      setFormError('Failed to register search group. Check that the backend is running and try again.');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateSearchGroupStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['search-groups'] });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview'] });
      setActionError(null);
    },
    onError: () => {
      setActionError('Failed to update group status. Please try again.');
    }
  });

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const [latitude, longitude] = basePoint
      ? [basePoint.lat, basePoint.lng]
      : await geocodeIndia(`${approxArea}, ${serviceRegion}`);
    createGroupMutation.mutate({
      name: name.trim(),
      service_region: serviceRegion,
      approximate_area: approxArea,
      capabilities: capabilities.split(',').map(s => s.trim()).filter(Boolean),
      public_contact: publicContact,
      latitude,
      longitude,
      operational_status: 'active',
      is_demo: false
    });
  };

  const handleStatusChange = (groupId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: groupId, status: newStatus });
  };

  return (
    <div className="space-y-6">
      <DemoBanner message="Team locations are shown as an area, never as a live position." />

      {actionError && (
        <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between gap-2">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="font-bold" aria-label="Dismiss">✕</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] md:text-[32px]">Rescue teams</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Boat, medical and search teams, and the areas they cover.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-charcoal text-white rounded-lg text-xs font-semibold hover:bg-charcoal-light transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add a team
        </button>
      </div>

      {/* Active Groups Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 p-12 text-center text-sm text-charcoal-muted">Loading…</div>
        ) : groups.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-sm text-charcoal-muted">No teams added yet.</div>
        ) : (
          groups.map(group => (
            <div key={group.id} className="neu-card p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold capitalize bg-purple-100 text-purple-900">
                    Rescue Unit
                  </span>
                  <StatusBadge status={group.operational_status} />
                </div>

                <h3 className="font-extrabold text-charcoal text-base">{group.name}</h3>

                <div className="mt-2 space-y-1 text-xs text-charcoal-light">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-dustyblue shrink-0" />
                    <span>Sector: <strong>{group.service_region}</strong> ({group.approximate_area})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Contact: <strong>{group.public_contact}</strong></span>
                  </div>
                </div>

                {/* Capabilities Badges */}
                {group.capabilities && group.capabilities.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs capitalize font-bold text-charcoal-muted block mb-1">Capabilities:</span>
                    <div className="flex flex-wrap gap-1">
                      {group.capabilities.map((cap, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-stone-100 text-stone-800 rounded font-medium">
                          ✓ {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Update Actions */}
              <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStatusChange(group.id, 'active')}
                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 rounded hover:bg-emerald-100 transition"
                  >
                    Set Active
                  </button>
                  <button
                    onClick={() => handleStatusChange(group.id, 'preparing')}
                    className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-800 rounded hover:bg-amber-100 transition"
                  >
                    Standby
                  </button>
                  <button
                    onClick={() => handleStatusChange(group.id, 'completed')}
                    className="px-2.5 py-1 text-xs font-semibold bg-stone-100 text-stone-800 rounded hover:bg-stone-200 transition"
                  >
                    Completed
                  </button>
                </div>
                <DataFreshness timestamp={group.last_verified_at} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Register SAR Group */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 km-backdrop flex items-center justify-center p-4">
          <form onSubmit={handleCreateGroup} className="km-dialog shadow-xl neu-card p-6 max-w-md w-full bg-surface space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-black text-charcoal">Add a rescue team</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-charcoal font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-charcoal block mb-1">Squad / Unit Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Gujarat NDRF Boat Squad 04"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-surface border border-stone-300 rounded text-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Region or state</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Saurashtra Coastal Belt"
                  value={serviceRegion}
                  onChange={(e) => setServiceRegion(e.target.value)}
                  className="w-full p-2 bg-surface border border-stone-300 rounded text-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Area they cover</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Veraval Harbour & Inundated Lowlands"
                  value={approxArea}
                  onChange={(e) => setApproxArea(e.target.value)}
                  className="w-full p-2 bg-surface border border-stone-300 rounded text-charcoal focus:outline-none"
                />
              </div>

              <LocationField
                label="Staging base (pin on map)"
                pickerTitle="Pin the team's staging base"
                hint="Optional. Without a pin, the sector / region above is located at city level."
                value={basePoint}
                onChange={(p) => { setBasePoint(p); if (!approxArea.trim()) setApproxArea(p.label); }}
              />

              <div>
                <label className="font-bold text-charcoal block mb-1">Capabilities (comma separated)</label>
                <input
                  type="text"
                  required
                  placeholder="Boats, paramedic, drones"
                  value={capabilities}
                  onChange={(e) => setCapabilities(e.target.value)}
                  className="w-full p-2 bg-surface border border-stone-300 rounded text-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Phone or radio channel</label>
                <input
                  type="text"
                  required
                  placeholder="+91-98765-43210 or VHF Ch 16"
                  value={publicContact}
                  onChange={(e) => setPublicContact(e.target.value)}
                  className="w-full p-2 bg-surface border border-stone-300 rounded text-charcoal focus:outline-none"
                />
              </div>
            </div>

            {formError && (
              <p role="alert" className="text-xs text-red-800 bg-red-50 border border-red-200 rounded p-2">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-charcoal-muted hover:text-charcoal"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-charcoal text-white rounded text-xs font-bold hover:bg-charcoal-light transition"
              >
                Add team
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export const HelperSearchGroups: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelperSearchGroupsInner />
    </QueryClientProvider>
  );
};
