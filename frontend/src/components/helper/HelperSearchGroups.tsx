import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { DemoBanner } from '../ui/DemoBanner';
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
    },
    onError: () => {
      alert('Failed to register search group');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateSearchGroupStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['search-groups'] });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview'] });
    },
    onError: () => {
      alert('Failed to update status');
    }
  });

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    createGroupMutation.mutate({
      name: name.startsWith('[DEMO]') ? name : `[DEMO] ${name}`,
      service_region: serviceRegion,
      approximate_area: approxArea,
      capabilities: capabilities.split(',').map(s => s.trim()),
      public_contact: publicContact,
      latitude: 21.65,
      longitude: 69.61,
      operational_status: 'active',
      is_demo: true
    });
  };

  const handleStatusChange = (groupId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: groupId, status: newStatus });
  };

  return (
    <div className="space-y-6">
      <DemoBanner message="SEARCH & RESCUE DESK: Operational registry of authorized water rescue squads, evacuation units, and missing-person relief teams. Personal live coordinates of responders are not made public for tactical safety." />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal tracking-tight">Search & Rescue Taskforces</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Coordinate field rescue teams, flood boat squads, and missing person search operations.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-dustyblue text-white rounded-lg text-xs font-semibold hover:bg-dustyblue-hover transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Register Rescue Team
        </button>
      </div>

      {/* Active Groups Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 p-12 text-center text-sm text-charcoal-muted">Loading rescue groups...</div>
        ) : groups.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-sm text-charcoal-muted">No active search groups registered.</div>
        ) : (
          groups.map(group => (
            <div key={group.id} className="neu-card p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900">
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
                    <span>Radio / Dispatch: <strong>{group.public_contact}</strong></span>
                  </div>
                </div>

                {/* Capabilities Badges */}
                {group.capabilities && group.capabilities.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] uppercase font-bold text-charcoal-muted block mb-1">Capabilities:</span>
                    <div className="flex flex-wrap gap-1">
                      {group.capabilities.map((cap, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-800 rounded font-medium">
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
                    className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 rounded hover:bg-emerald-100 transition"
                  >
                    Set Active
                  </button>
                  <button
                    onClick={() => handleStatusChange(group.id, 'preparing')}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-800 rounded hover:bg-amber-100 transition"
                  >
                    Standby
                  </button>
                  <button
                    onClick={() => handleStatusChange(group.id, 'completed')}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-stone-100 text-stone-800 rounded hover:bg-stone-200 transition"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateGroup} className="neu-card p-6 max-w-md w-full bg-surface space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-black text-charcoal">Register Search & Rescue Squad</h3>
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
                <label className="font-bold text-charcoal block mb-1">Service Region / State</label>
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
                <label className="font-bold text-charcoal block mb-1">Operating Sector / Landmark</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Veraval Harbour & Inundated Lowlands"
                  value={approxArea}
                  onChange={(e) => setApproxArea(e.target.value)}
                  className="w-full p-2 bg-surface border border-stone-300 rounded text-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Capabilities (comma separated)</label>
                <input
                  type="text"
                  required
                  placeholder="Inflatable Boats, Paramedic, Night Search Drones, K9 Unit"
                  value={capabilities}
                  onChange={(e) => setCapabilities(e.target.value)}
                  className="w-full p-2 bg-surface border border-stone-300 rounded text-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Emergency Dispatch Contact / VHF Radio</label>
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
                className="px-4 py-1.5 bg-dustyblue text-white rounded text-xs font-bold hover:bg-dustyblue-hover transition"
              >
                Publish Group
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
