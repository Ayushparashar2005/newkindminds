import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { DemoBanner } from '../ui/DemoBanner';
import { StatusBadge } from '../ui/StatusBadge';
import { DataFreshness } from '../ui/DataFreshness';
import { Building2, Phone, Plus, CheckCircle2 } from 'lucide-react';

interface OrganizationDirectoryProps {
  panel?: 'helper' | 'needer';
}

const OrganizationDirectoryInner: React.FC<OrganizationDirectoryProps> = ({ panel = 'needer' }) => {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', organization_type: 'Humanitarian NGO', description: '',
    categories: [] as string[], coverage: '', public_contact: '', website: ''
  });
  const setField = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const createOrg = useMutation({
    mutationFn: () => api.createOrganization({
      name: form.name.trim(),
      organization_type: form.organization_type,
      description: form.description.trim(),
      assistance_categories: form.categories,
      geographic_coverage: form.coverage.split(',').map((s) => s.trim()).filter(Boolean),
      public_contact: form.public_contact.trim(),
      website: form.website.trim() || undefined,
    }),
    onSuccess: (org) => {
      qc.invalidateQueries({ queryKey: ['organizations'] });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview'] });
      setCreated(org.name);
      setShowForm(false);
      setFormError(null);
      setForm({ name: '', organization_type: 'Humanitarian NGO', description: '', categories: [], coverage: '', public_contact: '', website: '' });
    },
    onError: () => setFormError('Could not register the organization. Check that the backend is running and try again.'),
  });

  const ORG_CATEGORIES = ['medical', 'shelter', 'food', 'water', 'evacuation', 'mental_health', 'supplies', 'search_rescue'];
  const inputCls = 'w-full p-2 bg-surface border border-stone-300 rounded text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-dustyblue';

  const { data: organizations = [], isLoading: loading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.getOrganizations(),
    staleTime: 60_000,
  });

  const filtered = organizations.filter(org => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = org.name.toLowerCase().includes(q);
      const matchDesc = org.description.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] md:text-[32px]">Organisations</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Agencies and NGOs working on relief, and how to reach them.
          </p>
        </div>
        {panel === 'helper' && (
          <div className="flex gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => { setShowForm((v) => !v); setCreated(null); }}
              className="px-4 py-2 bg-terracotta text-white rounded-lg text-xs font-semibold hover:bg-terracotta-hover transition shadow-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> Add organisation
            </button>
            <a
              href="/helper/profile"
              className="px-4 py-2 bg-charcoal text-white rounded-lg text-xs font-semibold hover:bg-charcoal-light transition shadow-sm"
            >
              My Profile
            </a>
          </div>
        )}
      </div>

      {created && (
        <div role="status" className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          <span><strong>{created}</strong> was added. It shows as <strong>unverified</strong> until an administrator verifies it.</span>
        </div>
      )}

      {panel === 'helper' && showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.categories.length === 0) { setFormError('Choose at least one assistance category.'); return; }
            createOrg.mutate();
          }}
          className="neu-card p-5 space-y-3 text-xs"
          aria-label="Add an organisation"
        >
          <h2 className="text-base font-extrabold text-charcoal">Add an organisation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="org-name" className="font-bold text-charcoal block mb-1">Organization name *</label>
              <input id="org-name" required className={inputCls} placeholder="e.g. Rapid Response Trust" value={form.name} onChange={(e) => setField('name', e.target.value)} />
            </div>
            <div>
              <label htmlFor="org-type" className="font-bold text-charcoal block mb-1">Type</label>
              <select id="org-type" className={inputCls} value={form.organization_type} onChange={(e) => setField('organization_type', e.target.value)}>
                {['Humanitarian NGO', 'Government Agency', 'Medical Relief NGO', 'Community Volunteer Group', 'Mental Health Service', 'Municipal Body', 'Search & Rescue Unit'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="org-desc" className="font-bold text-charcoal block mb-1">What the organization does *</label>
            <textarea id="org-desc" required rows={3} className={inputCls} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Services offered, areas of operation, how people can reach you" />
          </div>
          <fieldset>
            <legend className="font-bold text-charcoal mb-1">Assistance categories *</legend>
            <div className="flex flex-wrap gap-1.5">
              {ORG_CATEGORIES.map((c) => {
                const on = form.categories.includes(c);
                return (
                  <button
                    type="button"
                    key={c}
                    aria-pressed={on}
                    onClick={() => setField('categories', on ? form.categories.filter((x) => x !== c) : [...form.categories, c])}
                    className={`px-2.5 py-1 rounded border capitalize ${on ? 'bg-charcoal text-white border-dustyblue' : 'bg-surface border-stone-300 text-charcoal-muted hover:bg-stone-100'}`}
                  >
                    {c.replace(/_/g, ' ')}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="org-cov" className="font-bold text-charcoal block mb-1">Coverage (comma separated)</label>
              <input id="org-cov" className={inputCls} placeholder="Chennai, Chengalpattu" value={form.coverage} onChange={(e) => setField('coverage', e.target.value)} />
            </div>
            <div>
              <label htmlFor="org-contact" className="font-bold text-charcoal block mb-1">Public contact *</label>
              <input id="org-contact" required className={inputCls} placeholder="Helpline or official email" value={form.public_contact} onChange={(e) => setField('public_contact', e.target.value)} />
            </div>
            <div>
              <label htmlFor="org-web" className="font-bold text-charcoal block mb-1">Website</label>
              <input id="org-web" type="url" className={inputCls} placeholder="https://" value={form.website} onChange={(e) => setField('website', e.target.value)} />
            </div>
          </div>
          {formError && <p role="alert" className="text-red-800 bg-red-50 border border-red-200 rounded p-2">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-charcoal-muted hover:text-charcoal">Cancel</button>
            <button type="submit" disabled={createOrg.isPending} className="px-4 py-1.5 bg-terracotta text-white rounded font-bold hover:bg-terracotta-hover disabled:opacity-50">
              {createOrg.isPending ? 'Adding…' : 'Add organisation'}
            </button>
          </div>
        </form>
      )}

      {/* Search Input */}
      <div className="neu-card p-4">
        <input
          type="text"
          placeholder="Search by name or what they do"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2.5 bg-surface border border-stone-300 rounded-lg text-xs text-charcoal placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-dustyblue"
        />
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-charcoal-muted">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-sm text-charcoal-muted">No organisations match that search.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(org => (
            <div key={org.id} className="neu-card p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold capitalize bg-stone-100 text-stone-800">
                    {org.organization_type}
                  </span>
                  <StatusBadge status={org.verification_status} />
                </div>

                <h3 className="font-extrabold text-charcoal text-base flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-dustyblue" />
                  {org.name}
                </h3>

                <p className="text-xs text-charcoal-light mt-2 leading-relaxed">{org.description}</p>

                {/* Capabilities Badges */}
                {org.assistance_categories && org.assistance_categories.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs capitalize font-bold text-charcoal-muted block mb-1">
                      Helps with:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {org.assistance_categories.map((cat, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-stone-100 text-stone-700 rounded capitalize font-medium">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Geographic Coverage */}
                {org.geographic_coverage && org.geographic_coverage.length > 0 && (
                  <div className="mt-2 text-xs text-charcoal-muted">
                    Coverage: <strong>{org.geographic_coverage.join(', ')}</strong>
                  </div>
                )}
              </div>

              {/* Footer with Public Hotline and Panel Action */}
              <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-charcoal">
                    <Phone className="w-3.5 h-3.5 text-dustyblue" />
                    {org.public_contact}
                  </span>
                  {panel === 'needer' ? (
                    <a
                      href="/needer/request"
                      className="px-3 py-1.5 bg-terracotta text-white rounded text-xs font-bold hover:bg-terracotta-hover transition"
                    >
                      Request Assistance
                    </a>
                  ) : (
                    <span className="text-xs text-emerald-700 font-semibold">Active in Sector</span>
                  )}
                </div>
                <DataFreshness timestamp={org.last_verified_at} source="Inter-Agency Standing Committee Registry" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const OrganizationDirectory: React.FC<OrganizationDirectoryProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <OrganizationDirectoryInner {...props} />
    </QueryClientProvider>
  );
};
