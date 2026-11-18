import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { DemoBanner } from '../ui/DemoBanner';
import { LocationField } from '../ui/LocationPicker';
import { geocodeIndia } from '../../lib/geo';
import type { PickedLocation } from '../../lib/location';
import { StatusBadge } from '../ui/StatusBadge';
import { DataFreshness } from '../ui/DataFreshness';
import {
  Boxes,
  Plus,
  AlertTriangle,
  Eye,
  CheckCircle,
  Trash2
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
  const [newContact, setNewContact] = useState('');
  const [newPoint, setNewPoint] = useState<PickedLocation | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Inventory form (one open at a time)
  const [stockFor, setStockFor] = useState<string | null>(null);
  const [stockName, setStockName] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [stockUnit, setStockUnit] = useState('units');
  const [stockStatus, setStockStatus] = useState('available');

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
      setNewContact('');
      setNewAccessibility('');
      setNewPoint(null);
      setFormError(null);
    },
    onError: () => {
      setFormError('Failed to register facility. Check that the backend is running and try again.');
    }
  });

  const addStockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.addInventoryItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] });
      setStockFor(null);
      setStockName('');
      setStockQty('');
      setStockUnit('units');
      setStockStatus('available');
      setActionError(null);
    },
    onError: () => setActionError('Could not add the stock item. Please try again.')
  });

  const removeStockMutation = useMutation({
    mutationFn: ({ id, itemId }: { id: string; itemId: string }) => api.deleteInventoryItem(id, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] });
      setActionError(null);
    },
    onError: () => setActionError('Could not remove the stock item. Please try again.')
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateResource(id, { operational_status: status as any }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview'] });
      setActionError(null);
    },
    onError: () => {
      setActionError('Failed to update facility status. Please try again.');
    }
  });

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoint && !newAddress.trim()) {
      setFormError('Pin the facility on the map (recommended) or enter its address.');
      return;
    }
    setFormError(null);
    // Without a pin, fall back to geocoding the typed address (city/locality precision)
    const [latitude, longitude] = newPoint ? [newPoint.lat, newPoint.lng] : await geocodeIndia(newAddress);
    createResourceMutation.mutate({
      name: newName.trim(),
      category: newCategory as any,
      address_approximate: newAddress.trim() || newPoint!.label,
      latitude,
      longitude,
      contact_public: newContact.trim() || undefined,
      visibility: newVisibility as any,
      operational_status: 'available',
      accessibility_features: newAccessibility ? newAccessibility.split(',').map(s => s.trim()).filter(Boolean) : [],
      source_attribution: 'Helper Field Desk Registration',
      is_demo: false
    });
  };

  const handleUpdateStatus = (resourceId: string, status: string) => {
    updateStatusMutation.mutate({ id: resourceId, status });
  };

  const handleAddStock = (e: React.FormEvent, resourceId: string) => {
    e.preventDefault();
    const qty = Number(stockQty);
    if (!stockName.trim() || !Number.isFinite(qty) || qty < 0) {
      setActionError('Enter an item name and a valid quantity (0 or more).');
      return;
    }
    addStockMutation.mutate({
      id: resourceId,
      data: { item_name: stockName.trim(), quantity: qty, unit: stockUnit.trim() || 'units', inventory_status: stockStatus }
    });
  };

  const filtered = resources.filter(r => categoryFilter === 'all' || r.category === categoryFilter);

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] md:text-[32px]">Relief stock</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Shelters, clinics, food points and depots, and what each one has.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-terracotta text-white rounded-lg text-xs font-semibold hover:bg-terracotta-hover transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add a place
        </button>
      </div>

      {actionError && (
        <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" aria-hidden="true" /> {actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="font-bold" aria-label="Dismiss">✕</button>
        </div>
      )}

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
        <div className="text-charcoal-muted text-xs font-medium">
          Showing <strong>{filtered.length}</strong> of <strong>{resources.length}</strong> registered facilities
        </div>
      </div>

      {/* Facilities Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-charcoal-muted">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-sm text-charcoal-muted">Nothing in this category yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(res => (
            <div key={res.id} className="neu-card p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold capitalize bg-stone-100 text-stone-800">
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
                <div className="mt-3 flex items-center gap-2 text-xs text-charcoal-muted">
                  <Eye className="w-3.5 h-3.5 text-dustyblue" />
                  <span className="capitalize">Visibility: <strong>{res.visibility.replace(/_/g, ' ')}</strong></span>
                </div>

                {/* Accessibility */}
                {res.accessibility_features && res.accessibility_features.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {res.accessibility_features.map((feat, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium">
                        ♿ {feat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Inventory / stock on hand */}
                <div className="mt-3 p-2.5 bg-surface-raised rounded border border-stone-200 text-xs space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-charcoal">Stock</span>
                    {stockFor !== res.id && (
                      <button type="button" onClick={() => { setStockFor(res.id); setActionError(null); }} className="text-dustyblue font-bold hover:underline flex items-center gap-0.5">
                        <Plus className="w-3 h-3" aria-hidden="true" /> Add stock
                      </button>
                    )}
                  </div>
                  {(res.inventory_items ?? []).length === 0 && stockFor !== res.id && (
                    <p className="text-charcoal-muted">No stock recorded yet.</p>
                  )}
                  {(res.inventory_items ?? []).map((inv) => (
                    <div key={inv.id} className="flex justify-between items-center gap-2 text-stone-700">
                      <span className="flex-1 min-w-0 truncate">
                        {inv.item_name}
                        {inv.inventory_status !== 'available' && (
                          <span className={`ml-1 px-1 rounded text-xs font-bold capitalize ${inv.inventory_status === 'out_of_stock' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                            {inv.inventory_status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-bold whitespace-nowrap">{inv.quantity.toLocaleString('en-IN')} {inv.unit}</span>
                      <button
                        type="button"
                        onClick={() => removeStockMutation.mutate({ id: res.id, itemId: inv.id })}
                        aria-label={`Remove ${inv.item_name}`}
                        className="text-stone-400 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {stockFor === res.id && (
                    <form onSubmit={(e) => handleAddStock(e, res.id)} className="pt-2 mt-1 border-t border-stone-200 space-y-1.5">
                      <input
                        required
                        aria-label="Item name"
                        placeholder="Item, e.g. ORS sachets"
                        value={stockName}
                        onChange={(e) => setStockName(e.target.value)}
                        className="w-full p-1.5 bg-surface border border-stone-300 rounded text-charcoal"
                      />
                      <div className="grid grid-cols-3 gap-1.5">
                        <input
                          required
                          type="number"
                          min="0"
                          step="any"
                          aria-label="Quantity"
                          placeholder="Qty"
                          value={stockQty}
                          onChange={(e) => setStockQty(e.target.value)}
                          className="p-1.5 bg-surface border border-stone-300 rounded text-charcoal"
                        />
                        <input
                          aria-label="Unit"
                          placeholder="Unit"
                          value={stockUnit}
                          onChange={(e) => setStockUnit(e.target.value)}
                          className="p-1.5 bg-surface border border-stone-300 rounded text-charcoal"
                        />
                        <select
                          aria-label="Stock status"
                          value={stockStatus}
                          onChange={(e) => setStockStatus(e.target.value)}
                          className="p-1.5 bg-surface border border-stone-300 rounded text-charcoal"
                        >
                          <option value="available">Available</option>
                          <option value="limited">Limited</option>
                          <option value="reserved">Reserved</option>
                          <option value="out_of_stock">Out of stock</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setStockFor(null)} className="px-2 py-1 text-charcoal-muted hover:text-charcoal">Cancel</button>
                        <button type="submit" disabled={addStockMutation.isPending} className="px-3 py-1 bg-charcoal text-white rounded font-bold disabled:opacity-50">
                          {addStockMutation.isPending ? 'Saving…' : 'Save item'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Action Controls for Helpers */}
              <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleUpdateStatus(res.id, 'available')}
                    className="px-2 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 rounded hover:bg-emerald-100 transition"
                  >
                    Set Available
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(res.id, 'limited')}
                    className="px-2 py-1 text-xs font-semibold bg-amber-50 text-amber-800 rounded hover:bg-amber-100 transition"
                  >
                    Limited
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(res.id, 'out_of_stock')}
                    className="px-2 py-1 text-xs font-semibold bg-red-50 text-red-800 rounded hover:bg-red-100 transition"
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
        <div className="fixed inset-0 z-50 km-backdrop flex items-center justify-center p-4">
          <form onSubmit={handleCreateResource} className="km-dialog shadow-xl neu-card p-6 max-w-md w-full bg-surface space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-black text-charcoal">Add a place</h3>
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
                <label className="font-bold text-charcoal block mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Velachery relief camp"
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
                    <option value="public">Public</option>
                    <option value="verified_helpers">Responders only</option>
                    <option value="organization_only">My organisation only</option>
                  </select>
                </div>
              </div>

              <LocationField
                label="Facility location (pin on map)"
                hint="Recommended. Without a pin, the address below is located at city / locality level."
                pickerTitle="Pin the facility location"
                value={newPoint}
                onChange={(p) => { setNewPoint(p); if (!newAddress.trim()) setNewAddress(p.label); setFormError(null); }}
              />

              <div>
                <label className="font-bold text-charcoal block mb-1">Address or landmark</label>
                <input
                  type="text"
                  placeholder="e.g., Sector 4, Veraval Port Road"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full p-2 bg-surface border border-stone-300 rounded text-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Phone number</label>
                <input
                  type="text"
                  placeholder="e.g., 044-2530 5000 or 1070"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="w-full p-2 bg-surface border border-stone-300 rounded text-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Accessibility (comma separated)</label>
                <input
                  type="text"
                  placeholder="Wheelchair ramp, generator, sign language"
                  value={newAccessibility}
                  onChange={(e) => setNewAccessibility(e.target.value)}
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
                disabled={createResourceMutation.isPending}
                className="px-4 py-1.5 bg-terracotta text-white rounded text-xs font-bold hover:bg-terracotta-hover transition disabled:opacity-50"
              >
                {createResourceMutation.isPending ? 'Publishing…' : 'Register & Publish'}
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
