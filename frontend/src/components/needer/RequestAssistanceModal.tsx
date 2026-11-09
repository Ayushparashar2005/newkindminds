import React, { useState, useId } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { DemoBanner } from '../ui/DemoBanner';
import { AlertBanner } from '../ui/AlertBanner';
import { CheckCircle2, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import type { DisasterEvent } from '../../types';

// Step progress indicator
const StepIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex items-center gap-2" role="status" aria-label={`Step ${current} of ${total}`}>
    {Array.from({ length: total }, (_, i) => {
      const step = i + 1;
      const state = step < current ? 'done' : step === current ? 'active' : 'pending';
      return (
        <React.Fragment key={step}>
          <span
            className={`step-dot ${state === 'active' ? 'active' : state === 'done' ? 'done' : ''}`}
            aria-hidden="true"
          />
          {step < total && (
            <span
              className={`h-px flex-1 max-w-[32px] transition-colors duration-300 ${step < current ? 'bg-sage' : 'bg-stone-300'}`}
              aria-hidden="true"
            />
          )}
        </React.Fragment>
      );
    })}
    <span className="ml-2 text-xs font-bold text-charcoal-muted">
      Step {current} of {total}
    </span>
  </div>
);

const STEPS = [
  { id: 1, title: 'Type of Need' },
  { id: 2, title: 'Situation & Location' },
  { id: 3, title: 'Contact & Review' },
];

const RequestAssistanceModalInner: React.FC = () => {
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form State
  const [selectedDisasterId, setSelectedDisasterId] = useState('');
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contactMethod, setContactMethod] = useState<'phone' | 'sms' | 'in_person' | 'email' | 'app'>('phone');
  const [contactValue, setContactValue] = useState('');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('');

  // Stable IDs for form accessibility
  const disasterSelectId = useId();
  const descriptionId = useId();
  const locationId = useId();
  const accessibilityId = useId();
  const contactValueId = useId();
  const liveRegionId = useId();

  const { data: disasters = [] } = useQuery({
    queryKey: ['disasters'],
    queryFn: () => api.getDisasters(),
    staleTime: 60_000,
  });

  const submitMutation = useMutation({
    mutationFn: (data: {
      disaster_id: string;
      assistance_category: string;
      description: string;
      approximate_location: string;
      preferred_contact_method: string;
      contact_value?: string;
      accessibility_needs?: string;
    }) => api.submitRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assistance-requests'] });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview'] });
      setSubmitError(null);
      setSubmitted(true);
    },
    onError: () => {
      setSubmitError('Failed to submit assistance request. Please check your connection and try again.');
    }
  });

  const activeDisasterId = selectedDisasterId || (disasters[0]?.id ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    submitMutation.mutate({
      disaster_id: activeDisasterId,
      assistance_category: category,
      description,
      approximate_location: location,
      preferred_contact_method: contactMethod,
      contact_value: contactValue || undefined,
      accessibility_needs: accessibilityNeeds || undefined
    });
  };

  const categories = [
    { id: 'food', label: 'Food & Nutrition', desc: 'Emergency food rations, clean cooked meals, baby formula' },
    { id: 'water', label: 'Drinking Water', desc: 'Packaged potable water, filtration kits, bulk water tankers' },
    { id: 'medical', label: 'Medical Assistance', desc: 'Trauma care, prescription medicines, oxygen, first aid' },
    { id: 'shelter', label: 'Emergency Shelter', desc: 'Temporary housing, tarpaulins, evacuation center placement' },
    { id: 'evacuation', label: 'Evacuation / Transport', desc: 'Rescue from flooded zone, mobility assistance, safe transit' },
    { id: 'mental_health', label: 'Psychological First Aid', desc: 'Crisis counselling, emotional distress support, calming' },
  ];

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6" role="main">
        <DemoBanner />
        <div className="neu-card p-8 text-center space-y-4" role="alert" aria-live="assertive">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto" aria-hidden="true">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-charcoal">Assistance Request Received</h1>
          <p className="text-sm text-charcoal-muted max-w-md mx-auto">
            Your request has been logged into the verified humanitarian coordination dispatch. Responders in your sector have been alerted.
          </p>

          <div className="p-4 bg-surface-raised rounded-lg border border-stone-200 text-xs text-left max-w-md mx-auto space-y-1">
            <p><strong>Category:</strong> <span className="capitalize">{category}</span></p>
            <p><strong>Location:</strong> {location}</p>
            <p><strong>Contact via:</strong> {contactMethod} ({contactValue || 'On record'})</p>
          </div>

          <div className="pt-4 flex justify-center gap-3 flex-wrap">
            <a
              href="/needer/my-requests"
              className="px-5 py-2.5 bg-terracotta text-white rounded-lg text-xs font-bold hover:bg-terracotta-hover transition shadow-sm min-h-[44px] inline-flex items-center"
            >
              Track Request Status →
            </a>
            <button
              onClick={() => {
                setSubmitted(false);
                setStep(1);
                setDescription('');
                setLocation('');
                setContactValue('');
              }}
              className="px-5 py-2.5 bg-surface border border-stone-300 rounded-lg text-xs font-semibold text-charcoal hover:bg-stone-100 transition min-h-[44px]"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <DemoBanner />
      <AlertBanner />

      {/* ARIA live region for status announcements */}
      <div
        id={liveRegionId}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-charcoal tracking-tight">Request Humanitarian Assistance</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Fill in approximate needs. Your exact coordinates are never made public.
          </p>
        </div>
        <StepIndicator current={step} total={3} />
      </div>

      {/* Step breadcrumb title */}
      <div className="text-xs font-bold text-charcoal-muted uppercase tracking-wider">
        {STEPS[step - 1].title}
      </div>

      <div className="neu-card p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate aria-label="Assistance request form">

          {/* STEP 1: Disaster Event & Assistance Category */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor={disasterSelectId} className="text-xs font-bold uppercase tracking-wider text-charcoal-muted block mb-1">
                  1. Select Applicable Disaster Event
                </label>
                <select
                  id={disasterSelectId}
                  value={activeDisasterId}
                  onChange={(e) => setSelectedDisasterId(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-stone-300 rounded-lg text-xs font-semibold text-charcoal focus:outline-none focus:ring-2 focus:ring-dustyblue min-h-[44px]"
                >
                  {disasters.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.category.toUpperCase()}) — {d.region}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-2">
                  2. Select What You Need Most
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-required="true">
                  {categories.map(c => (
                    <label
                      key={c.id}
                      className={`p-3.5 rounded-xl border cursor-pointer transition block ${
                        category === c.id
                          ? 'bg-stone-50 border-terracotta ring-2 ring-terracotta/20 shadow-neu-flat'
                          : 'bg-surface border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="assistance_category"
                        value={c.id}
                        checked={category === c.id}
                        onChange={() => setCategory(c.id)}
                        className="sr-only"
                      />
                      <h4 className="text-xs font-extrabold text-charcoal">{c.label}</h4>
                      <p className="text-[11px] text-charcoal-muted mt-0.5">{c.desc}</p>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-terracotta text-white rounded-lg text-xs font-bold hover:bg-terracotta-hover transition flex items-center gap-1.5 shadow-sm min-h-[44px]"
                >
                  Next: Situation & Location <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Description & Location */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor={descriptionId} className="text-xs font-bold uppercase tracking-wider text-charcoal-muted block mb-1">
                  Describe Your Immediate Situation & Needs <span aria-label="required">*</span>
                </label>
                <textarea
                  id={descriptionId}
                  required
                  rows={4}
                  aria-required="true"
                  aria-describedby={`${descriptionId}-hint`}
                  placeholder="e.g., We are 4 people trapped on the first floor. Water is entering the ground floor. We need drinking water, baby food, and evacuation assistance."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-surface border border-stone-300 rounded-lg text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-dustyblue"
                />
                <span id={`${descriptionId}-hint`} className="text-[11px] text-charcoal-muted block mt-1">
                  Describe who needs help, how many people, and what is most urgent.
                </span>
              </div>

              <div>
                <label htmlFor={locationId} className="text-xs font-bold uppercase tracking-wider text-charcoal-muted block mb-1">
                  Approximate Location / Landmark / Address <span aria-label="required">*</span>
                </label>
                <input
                  id={locationId}
                  type="text"
                  required
                  aria-required="true"
                  aria-describedby={`${locationId}-hint`}
                  placeholder="e.g., Near Swaminarayan Temple, Veraval Port Road, Sector 3"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-stone-300 rounded-lg text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-dustyblue min-h-[44px]"
                />
                <span id={`${locationId}-hint`} className="text-[11px] text-charcoal-muted block mt-1">
                  🔒 Privacy by Design: Only approximate sectors are shown to helpers. Exact addresses are shared strictly with dispatchers.
                </span>
              </div>

              <div>
                <label htmlFor={accessibilityId} className="text-xs font-bold uppercase tracking-wider text-charcoal-muted block mb-1">
                  Specific Vulnerabilities / Accessibility Needs
                  <span className="ml-1 text-charcoal-muted font-normal normal-case">(Optional)</span>
                </label>
                <input
                  id={accessibilityId}
                  type="text"
                  placeholder="e.g., Elderly bed-ridden person, Infant requiring formula, Wheelchair needed"
                  value={accessibilityNeeds}
                  onChange={(e) => setAccessibilityNeeds(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-stone-300 rounded-lg text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-dustyblue min-h-[44px]"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-charcoal hover:bg-surface-raised transition flex items-center gap-1.5 min-h-[44px]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Back
                </button>
                <button
                  type="button"
                  disabled={!description || !location}
                  onClick={() => setStep(3)}
                  aria-disabled={!description || !location}
                  className="px-5 py-2.5 bg-terracotta text-white rounded-lg text-xs font-bold hover:bg-terracotta-hover transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 min-h-[44px]"
                >
                  Next: Contact Method <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Contact & Submit */}
          {step === 3 && (
            <div className="space-y-4">
              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-wider text-charcoal-muted block mb-1">
                  How Should Responders Contact You?
                </legend>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'phone', label: 'Phone Call' },
                    { id: 'sms', label: 'SMS Text' },
                    { id: 'in_person', label: 'In Person' },
                    { id: 'app', label: 'In-App Only' }
                  ].map(method => (
                    <label
                      key={method.id}
                      className={`p-2.5 rounded-lg border text-xs font-semibold capitalize transition cursor-pointer text-center min-h-[44px] flex items-center justify-center ${
                        contactMethod === method.id
                          ? 'bg-charcoal text-white border-charcoal'
                          : 'bg-surface border-stone-300 text-charcoal hover:bg-stone-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="contact_method"
                        value={method.id}
                        checked={contactMethod === method.id}
                        onChange={() => setContactMethod(method.id as any)}
                        className="sr-only"
                      />
                      {method.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {(contactMethod === 'phone' || contactMethod === 'sms') && (
                <div>
                  <label htmlFor={contactValueId} className="text-xs font-bold uppercase tracking-wider text-charcoal-muted block mb-1">
                    Phone / Mobile Number <span aria-label="required">*</span>
                  </label>
                  <input
                    id={contactValueId}
                    type="tel"
                    required
                    aria-required="true"
                    placeholder="+91-98765-43210"
                    value={contactValue}
                    onChange={(e) => setContactValue(e.target.value)}
                    className="w-full p-2.5 bg-surface border border-stone-300 rounded-lg text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-dustyblue min-h-[44px]"
                  />
                </div>
              )}

              {/* Request review summary */}
              <div className="p-4 bg-surface-raised rounded-lg border border-stone-200 text-xs space-y-1.5" role="region" aria-label="Request summary for review">
                <span className="font-bold text-charcoal uppercase text-[10px] block">Request Summary — Please Review</span>
                <p><strong>Category:</strong> <span className="capitalize">{categories.find(c => c.id === category)?.label ?? category}</span></p>
                <p><strong>Location:</strong> {location}</p>
                <p><strong>Description:</strong> {description}</p>
                {accessibilityNeeds && <p className="text-terracotta"><strong>Vulnerability / Access Needs:</strong> {accessibilityNeeds}</p>}
              </div>

              {/* Error message */}
              {submitError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800" role="alert" aria-live="assertive">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-charcoal hover:bg-surface-raised transition flex items-center gap-1.5 min-h-[44px]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Back
                </button>
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  aria-disabled={submitMutation.isPending}
                  aria-busy={submitMutation.isPending}
                  className="px-6 py-2 bg-terracotta text-white rounded-lg text-xs font-bold hover:bg-terracotta-hover transition shadow-sm disabled:opacity-60 min-h-[44px]"
                >
                  {submitMutation.isPending ? 'Submitting Request…' : 'Confirm & Submit Assistance Request'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export const RequestAssistanceModal: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RequestAssistanceModalInner />
    </QueryClientProvider>
  );
};
