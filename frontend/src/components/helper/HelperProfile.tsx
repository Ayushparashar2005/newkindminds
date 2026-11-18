import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { QueryProvider } from '../providers/QueryProvider';

interface Profile {
  name: string;
  role: string;
  helperType: string;
  organization: string;
  regions: string;
  capabilities: string[];
  contact: string;
}

const STORAGE_KEY = 'kindminds.helperProfile';

const DEFAULT_PROFILE: Profile = {
  name: '',
  role: '',
  helperType: 'NGO Relief Worker',
  organization: '',
  regions: '',
  capabilities: [],
  contact: ''
};

const ALL_CAPABILITIES = [
  'Trauma First Aid', 'Mobile Clinics', 'Insulin & Cold Chain Care', 'Psychological First Aid',
  'Wheelchair Evacuation', 'Water Purification', 'Boat Rescue', 'Food Distribution',
  'Shelter Management', 'Sign Language Interpretation', 'Search & Rescue', 'Logistics & Transport'
];

const HELPER_TYPES = [
  'Medical Professional & Field Triage Lead', 'NGO Relief Worker', 'Search & Rescue Volunteer',
  'Shelter Operator', 'Mental Health Counsellor', 'Logistics Coordinator'
];

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable, use defaults */
  }
  return DEFAULT_PROFILE;
}

function initials(name: string) {
  const parts = name.replace(/^(Dr|Mr|Ms|Mrs)\.?\s+/i, '').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

const inputCls =
  'w-full p-2.5 bg-surface-inset rounded neu-inset font-semibold text-charcoal border border-transparent focus:border-dustyblue focus:outline-none';

function ProfileForm() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: api.getOrganizations
  });

  useEffect(() => setProfile(loadProfile()), []);

  useEffect(() => {
    if (!profile.organization && organizations.length > 0) {
      setProfile((p) => ({ ...p, organization: organizations[0].name }));
    }
  }, [organizations, profile.organization]);

  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfile((p) => ({ ...p, [key]: value }));
    setDirty(true);
    setSavedAt(null);
  };

  const toggleCapability = (cap: string) => {
    update(
      'capabilities',
      profile.capabilities.includes(cap)
        ? profile.capabilities.filter((c) => c !== cap)
        : [...profile.capabilities, cap]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* storage unavailable, keep in memory */
    }
    setDirty(false);
    setSavedAt(new Date());
  };

  const handleReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setProfile({ ...DEFAULT_PROFILE, organization: organizations[0]?.name || '' });
    setDirty(false);
    setSavedAt(null);
  };

  return (
    <form onSubmit={handleSave} className="neu-card p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-4 border-b border-stone-200 pb-5">
        <div className="w-14 h-14 rounded-2xl bg-charcoal text-white flex items-center justify-center font-black text-xl">
          {initials(profile.name)}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl">{profile.name || 'Unnamed Responder'}</h2>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              {savedAt || !dirty ? 'Responder Profile' : 'Editing'}
            </span>
          </div>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Role: {profile.role || 'Not set'}. {profile.organization || 'No organisation'}
          </p>
        </div>
      </div>

      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="p-name" className="font-bold text-charcoal block mb-1">Full Name:</label>
            <input id="p-name" required placeholder="Your full name" className={inputCls} value={profile.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div>
            <label htmlFor="p-role" className="font-bold text-charcoal block mb-1">Role / Title:</label>
            <input id="p-role" placeholder="e.g. Volunteer, Medical Officer" className={inputCls} value={profile.role} onChange={(e) => update('role', e.target.value)} />
          </div>
          <div>
            <label htmlFor="p-type" className="font-bold text-charcoal block mb-1">Type</label>
            <select id="p-type" className={inputCls} value={profile.helperType} onChange={(e) => update('helperType', e.target.value)}>
              {HELPER_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="p-org" className="font-bold text-charcoal block mb-1">Organisation</label>
            <select id="p-org" className={inputCls} value={profile.organization} onChange={(e) => update('organization', e.target.value)}>
              {organizations.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
              {profile.organization && !organizations.some((o) => o.name === profile.organization) && (
                <option value={profile.organization}>{profile.organization}</option>
              )}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="p-regions" className="font-bold text-charcoal block mb-1">Areas you cover</label>
          <input id="p-regions" placeholder="e.g. Chennai, Chengalpattu, Kanchipuram" className={inputCls} value={profile.regions} onChange={(e) => update('regions', e.target.value)} />
        </div>

        <fieldset>
          <legend className="font-bold text-charcoal block mb-1">What you can help with</legend>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {ALL_CAPABILITIES.map((cap) => {
              const on = profile.capabilities.includes(cap);
              return (
                <button
                  type="button"
                  key={cap}
                  aria-pressed={on}
                  onClick={() => toggleCapability(cap)}
                  className={`px-2.5 py-1 rounded font-medium transition border ${
                    on ? 'bg-charcoal text-white border-dustyblue' : 'bg-surface text-charcoal-muted border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {on ? '✓ ' : '+ '}{cap}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="p-contact" className="font-bold text-charcoal block mb-1">Contact</label>
          <input id="p-contact" placeholder="Your mobile number or official email" className={inputCls} value={profile.contact} onChange={(e) => update('contact', e.target.value)} />
        </div>
      </div>

      <div className="pt-4 border-t border-stone-200 flex flex-wrap gap-3 justify-between items-center text-xs">
        <span className="text-charcoal-muted">Stored on this device only</span>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span role="status" className="flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Saved {savedAt.toLocaleTimeString('en-IN')}
            </span>
          )}
          {dirty && <span className="text-amber-700 font-semibold">Unsaved changes</span>}
          <button type="button" onClick={handleReset} className="px-3 py-2 border border-stone-300 rounded text-charcoal hover:bg-stone-100 transition flex items-center gap-1">
            <X className="w-3 h-3" /> Reset
          </button>
          <button type="submit" disabled={!dirty} className="px-4 py-2 bg-charcoal text-white rounded text-xs font-bold hover:bg-charcoal-light transition disabled:opacity-50">
            Save profile
          </button>
        </div>
      </div>
    </form>
  );
}

export function HelperProfile() {
  return (
    <QueryProvider>
      <ProfileForm />
    </QueryProvider>
  );
}
