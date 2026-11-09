import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { DemoBanner } from '../ui/DemoBanner';
import { StatusBadge } from '../ui/StatusBadge';
import { DataFreshness } from '../ui/DataFreshness';
import {
  Boxes,
  Plus,
  AlertTriangle,
  Eye,
  CheckCircle
} from 'lucide-react';
import type { HumanitarianResource } from '../../types';

const HelperResourcesInner: React.FC = () => {
  const qc = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<HumanitarianResource | null>(null);

  // Form State for new resource
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('supplies');
  const [newAddress, setNewAddress] = useState('');
  const [newVisibility, setNewVisibility] = useState('public');
  const [newAccessibility, setNewAccessibility] = useState('');

  const { data: resources = [], isLoading: loading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => api.getResources(),
    staleTime: 60_000,
  });

  const createResourceMutation = useMutation({
    mutationFn: (data: Partial<HumanitarianResource>) => api.createResource(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview'] });
      setShowAddModal(false);
      setNewName('');
      setNewAddress('');
    },
    onError: () => {
      alert('Failed to register facility');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateResource(id, { operational_status: status as any }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview'] });
    },
    onError: () => {
      alert('Failed to update status');
    }
  });

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    createResourceMutation.mutate({
      name: newName.startsWith('[DEMO]') ? newName : `[DEMO] ${newName}`,
      category: newCategory as any,
      address_approximate: newAddress,
      latitude: 21.64,
      longitude: 69.62,
      visibility: newVisibility as any,
      operational_status: 'available',
      accessibility_features: newAccessibility ? newAccessibility.split(',').map(s => s.trim()) : [],
      source_attribution: 'Helper Field Desk Registration',
      is_demo: true
    });
  };

  const handleUpdateStatus = (resourceId: string, status: string) => {
    updateStatusMutation.mutate({ id: resourceId, status });
  };

  const filtered = resources.filter(r => categoryFilter === 'all' || r.category === categoryFilter);

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal tracking-tight">Humanitarian Resources & Depots</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Maintain inventories of shelters, medical triage stations, food points, and logistics depots.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-terracotta text-white rounded-lg text-xs font-semibold hover:bg-terracotta-hover transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Register Facility / Depot
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="neu-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-charcoal mr-1">Category:</span>
          {['all', 'medical', 'shelter', 'water', 'food', 'warehouse'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded capitalize font-semibold transition ${
                categoryFilter === cat
                  ? 'bg-charcoal text-white'
                  : 'bg-surface border border-stone-300 text-charcoal hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="text-charcoal-muted text-[11px] font-medium">
          Showing <strong>{filtered.length}</strong> of <strong>{resources.length}</strong> registered facilities
        </div>
      </div>

      {/* Facilities Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-charcoal-muted">Loading facilities and inventory data...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-sm text-charcoal-muted">No resources match the selected category.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(res => (
            <div key={res.id} className="neu-card p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800">
                    {res.category}
                  </span>
                  <StatusBadge status={res.operational_status} />
                </div>
                <h3 className="font-extrabold text-charcoal text-sm">{res.name}</h3>
                <p className="text-xs text-charcoal-light mt-1">📍 {res.address_approximate}</p>

                {res.contact_public && (
                  <p className="text-xs text-stone-600 mt-1">📞 {res.contact_public}</p>
                )}

                {/* Visibility indicator */}
                <div className="mt-3 flex items-center gap-2 text-[11px] text-charcoal-muted">
                  <Eye className="w-3.5 h-3.5 text-dustyblue" />
                  <span className="capitalize">Visibility: <strong>{res.visibility.replace('_', ' ')}</strong></span>
                </div>

                {/* Accessibility */}
                {res.accessibility_features && res.accessibility_features.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {res.accessibility_features.map((feat, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium">
                        ♿ {feat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Inventory Snapshot if present */}
                {res.inventory_summary && res.inventory_summary.length > 0 && (
                  <div className="mt-3 p-2.5 bg-surface-raised rounded border border-stone-200 text-[11px] space-y-1">
                    <span className="font-bold text-charcoal block mb-1">Current Stock / Supplies:</span>
                    {res.inventory_summary.map((inv, idx) => (
                      <div key={idx} className="flex justify-between items-center text-stone-700">
                        <span>{inv.item_name}</span>
                        <span className="font-mono font-bold">{inv.quantity} {inv.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Controls for Helpers */}
              <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleUpdateStatus(res.id, 'available')}
                    className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 rounded hover:bg-emerald-100 transition"
                  >
                    Set Available
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(res.id, 'limited')}
                    className="px-2 py-1 text-[11px] font-semibold bg-amber-50 text-amber-800 rounded hover:bg-amber-100 transition"
                  >
                    Limited
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(res.id, 'out_of_stock')}
                    className="px-2 py-1 text-[11px] font-semibold bg-red-50 text-red-800 rounded hover:bg-red-100 transition"
                  >
                    Exhausted
                  </button>
                </div>
                <DataFreshness timestamp={res.last_verified_at} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Register Facility */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateResource} className="neu-card p-6 max-w-md w-full bg-surface space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-black text-charcoal">Register Humanitarian Facility</h3>
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
                <label className="font-bold text-charcoal block mb-1">Facility / Depot Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Red Cross Central Medical Staging Depot"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2 bg-surface border border-stone-300 rounded text-charcoal focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-charcoal block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2 bg-surface border border-stone-300 rounded text-charcoal focus:outline-none"
                  >
                    <option value="medical">Medical / Triage</option>
                    <option value="shelter">Emergency Shelter</option>
                    <option value="water">Water Distribution</option>
                    <option value="food">Food Distribution</option>
                    <option value="warehouse">Logistics Warehouse</option>
                    <option value="supplies">General Supplies</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-charcoal block mb-1">Visibility</label>
                  <select
                    value={newVisibility}
                    onChange={(e) => setNewVisibility(e.target.value)}
                    className="w-full p-2 bg-surface border border-stone-300 rounded text-charcoal focus:outline-none"
                  >
                    <option value="public">Public (Visible to All)</option>
                    <option value="verified_helpers">Verified Helpers Only</option>
                    <option value="organization_only">Organization Internal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Approximate Location / Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sector 4, Veraval Port Road"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full p-2 bg-surface border border-stone-300 rounded text-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Accessibility Features (comma separated)</label>
                <input
                  type="text"
                  placeholder="Wheelchair ramp, Generator backup, Sign language interpreter"
                  value={newAccessibility}
                  onChange={(e) => setNewAccessibility(e.target.value)}
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
                className="px-4 py-1.5 bg-terracotta text-white rounded text-xs font-bold hover:bg-terracotta-hover transition"
              >
                Register & Publish
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export const HelperResources: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelperResourcesInner />
    </QueryClientProvider>
  );
};
