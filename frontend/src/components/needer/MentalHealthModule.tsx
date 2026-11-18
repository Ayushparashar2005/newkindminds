import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { AlertBanner } from '../ui/AlertBanner';
import { DemoBanner } from '../ui/DemoBanner';
import {
  Wind,
  BookOpen,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  CheckCircle,
  Eye,
  Hand,
  Volume2,
  Smile,
  Utensils
} from 'lucide-react';
import { AIText } from '../ui/AIText';
import type { CrisisHelpline, MentalHealthJournalEntry } from '../../types';

const MentalHealthModuleInner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'grounding' | 'breathing' | 'journal' | 'reframe' | 'helplines'>('grounding');
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [tabLine, setTabLine] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const el = tabBarRef.current?.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`);
    if (el) setTabLine({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);
  const [helplines, setHelplines] = useState<CrisisHelpline[]>([]);
  const [journals, setJournals] = useState<MentalHealthJournalEntry[]>([]);

  // Grounding state
  const [groundingStep, setGroundingStep] = useState(0);

  // Breathing state
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Pause' | 'Exhale' | 'Rest'>('Inhale');
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathCount, setBreathCount] = useState(4);
  // useRef avoids stale closure: always holds the current phase without re-creating the interval
  const breathingPhaseRef = useRef<'Inhale' | 'Pause' | 'Exhale' | 'Rest'>('Inhale');

  // Journal form state
  const [situation, setSituation] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(5);
  const [needs, setNeeds] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);
  const [journalError, setJournalError] = useState<string | null>(null);
  const [reframeError, setReframeError] = useState<string | null>(null);

  // Thought reframing state
  const [reframeSituation, setReframeSituation] = useState('');
  const [currentThought, setCurrentThought] = useState('');
  const [reframeEmotion, setReframeEmotion] = useState('Anxious / Overwhelmed');
  const [reframeResult, setReframeResult] = useState<any>(null);
  const [reframeLoading, setReframeLoading] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [helpData, journalData] = await Promise.all([
          api.getHelplines(),
          api.getJournalEntries()
        ]);
        setHelplines(helpData.helplines);
        setJournals(journalData);
      } catch (err) {
        console.error("Failed to load mental health resources:", err);
      }
    }
    loadInitial();
  }, []);

  // Breathing timer: uses ref to avoid stale closure on phase transitions
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (breathingActive) {
      interval = setInterval(() => {
        setBreathCount(prev => {
          if (prev <= 1) {
            // Advance phase using ref (avoids stale closure)
            const phases: ('Inhale' | 'Pause' | 'Exhale' | 'Rest')[] = ['Inhale', 'Pause', 'Exhale', 'Rest'];
            const nextPhase = phases[(phases.indexOf(breathingPhaseRef.current) + 1) % phases.length];
            breathingPhaseRef.current = nextPhase;
            setBreathingPhase(nextPhase);
            // Each phase duration: Inhale=4s, Pause=2s, Exhale=6s, Rest=2s
            const phaseDurations: Record<string, number> = { Inhale: 4, Pause: 2, Exhale: 6, Rest: 2 };
            return phaseDurations[nextPhase] ?? 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [breathingActive]);

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const entry = await api.saveJournalEntry({
        situation,
        thoughts,
        emotions: selectedEmotions,
        emotional_intensity: intensity,
        needs
      });
      setJournals(prev => [entry, ...prev]);
      setJournalError(null);
      setJournalSaved(true);
      setSituation('');
      setThoughts('');
      setNeeds('');
      setTimeout(() => setJournalSaved(false), 3000);
    } catch (err) {
      setJournalError("Could not save your journal entry. Please check your connection and try again.");
    }
  };

  const handleReframe = async (e: React.FormEvent) => {
    e.preventDefault();
    setReframeLoading(true);
    setReframeError(null);
    try {
      const res = await api.reframeThought({
        situation: reframeSituation,
        current_thought: currentThought,
        emotion: reframeEmotion
      });
      setReframeResult(res);
    } catch (err) {
      setReframeError("The reflection could not be generated right now. Please try again in a moment.");
    } finally {
      setReframeLoading(false);
    }
  };

  const groundingSteps = [
    { count: 5, sense: "Sight", heading: "5 things you can see", icon: Eye, prompt: "A wall, your shoes, a window, your hands, a glass. Say them out loud or in your head." },
    { count: 4, sense: "Touch", heading: "4 things you can feel", icon: Hand, prompt: "Your clothes on your arms, the floor under your feet, a cool surface, something smooth." },
    { count: 3, sense: "Sound", heading: "3 things you can hear", icon: Volume2, prompt: "A fan, voices far away, your own breathing." },
    { count: 2, sense: "Smell", heading: "2 things you can smell", icon: Smile, prompt: "Anything in the air. If nothing comes, think of a smell you like, such as rain or tea." },
    { count: 1, sense: "Taste", heading: "1 thing you can taste", icon: Utensils, prompt: "Notice the taste in your mouth, or take a sip of water." }
  ];

  const emotionList = ['Overwhelmed', 'Anxious', 'Numb', 'Afraid', 'Grieving', 'Exhausted', 'Relieved', 'Grounded'];

  return (
    <div className="space-y-6">
      <AlertBanner />

      <div>
        <h1 className="text-[28px] md:text-[32px]">Mental health</h1>
        <p className="text-sm text-charcoal-muted mt-1">
          Exercises for when things feel like too much, a journal, and people you can call.
        </p>
      </div>

      {/* Tabs (khe): one panel at a time, the underline slides to the tab you pick */}
      <div ref={tabBarRef} className="relative flex items-center gap-1 overflow-x-auto border-b border-stone-200" role="tablist" aria-label="Mental health tools">
        {[
          { id: 'grounding', label: 'Grounding', icon: Eye },
          { id: 'breathing', label: 'Breathing', icon: Wind },
          { id: 'journal', label: 'Journal', icon: BookOpen },
          { id: 'reframe', label: 'Reframe a thought', icon: MessageCircle },
          { id: 'helplines', label: 'Helplines', icon: PhoneCall },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-tab={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 h-10 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                isActive ? 'text-charcoal' : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
        {tabLine && (
          <span
            aria-hidden="true"
            className="km-tab-indicator absolute bottom-[-1px] left-0 h-[2px] bg-charcoal"
            style={{ width: tabLine.width, transform: `translateX(${tabLine.left}px)` }}
          />
        )}
      </div>

      {/* TAB 1: 5-4-3-2-1 SENSORY GROUNDING */}
      {activeTab === 'grounding' && (
        <div className="neu-card p-6 md:p-8 max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl">5-4-3-2-1 grounding</h2>
            <p className="text-xs text-charcoal-muted">
              If panic is building, name what you can sense around you. It brings your attention back to the room you are in.
            </p>
          </div>

          <div className="p-6 bg-surface-inset rounded-xl neu-inset text-center space-y-4">
            <div className="inline-flex p-4 rounded-full bg-surface shadow-sm text-sage">
              {React.createElement(groundingSteps[groundingStep].icon, { className: "w-8 h-8" })}
            </div>
            <div className="text-2xl font-black text-charcoal">
              {groundingSteps[groundingStep].heading}
            </div>
            <p className="text-xs sm:text-sm text-charcoal-light max-w-md mx-auto leading-relaxed">
              {groundingSteps[groundingStep].prompt}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              disabled={groundingStep === 0}
              onClick={() => setGroundingStep(prev => prev - 1)}
              className="px-4 py-2 rounded border border-stone-300 text-xs font-semibold text-charcoal disabled:opacity-40"
            >
              Back
            </button>
            <span className="text-xs text-charcoal-muted font-bold">
              Step {groundingStep + 1} of 5
            </span>
            {groundingStep < 4 ? (
              <button
                onClick={() => setGroundingStep(prev => prev + 1)}
                className="h-[34px] px-4 rounded-lg bg-charcoal text-white text-sm font-medium hover:bg-charcoal-light"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => setGroundingStep(0)}
                className="px-5 py-2 rounded bg-charcoal text-white text-xs font-bold hover:bg-charcoal-dark transition"
              >
                Restart Exercise
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GENTLE BREATHING */}
      {activeTab === 'breathing' && (
        <div className="neu-card p-6 md:p-8 max-w-lg mx-auto text-center space-y-6">
          <div>
            <h2 className="text-2xl mt-1">Box breathing</h2>
            <p className="text-xs text-charcoal-muted mt-1">
              Breathe in for 4, hold for 4, out for 4, rest for 4. Stop if you feel dizzy.
            </p>
          </div>

          <div className="py-8 flex flex-col items-center justify-center">
            <div
              className={`w-44 h-44 rounded-full flex flex-col items-center justify-center border text-charcoal ${
                breathingPhase === 'Inhale' || breathingPhase === 'Pause'
                  ? 'scale-[1.15] bg-dustyblue-light border-dustyblue/40'
                  : 'scale-[0.85] bg-surface-raised border-stone-300'
              }`}
              style={{
                // Box breathing: the circle grows across the 4 s inhale and shrinks across the 4 s exhale.
                transition: breathingActive
                  ? 'scale 4000ms var(--ease-in-out-cubic), transform 4000ms var(--ease-in-out-cubic), background-color 600ms, border-color 600ms'
                  : 'transform 260ms var(--ease-snappy-out)',
              }}
            >
              <span className="text-base font-black capitalize">{breathingPhase}</span>
              <span className="num text-3xl font-medium mt-1">{breathCount}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setBreathingActive(!breathingActive);
                setBreathCount(4);
              }}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold transition shadow-sm ${
                breathingActive
                  ? 'bg-charcoal text-white hover:bg-charcoal-dark'
                  : 'bg-charcoal text-white hover:bg-charcoal-light'
              }`}
            >
              {breathingActive ? 'Stop' : 'Start breathing'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PRIVATE JOURNAL */}
      {activeTab === 'journal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleSaveJournal} className="neu-card p-6 space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-charcoal">Journal</h2>
              <p className="text-xs text-charcoal-muted">
                Entries are not shown to responders or on any dashboard.
              </p>
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                🔒 <strong>Privacy Notice:</strong> For maximum safety, do not include full government IDs, bank details, or passwords in journal reflections.
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">What is happening right now?</label>
                <input
                  type="text"
                  required
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  placeholder="e.g. Waiting in evacuation center, power is out..."
                  className="w-full p-2.5 rounded border border-stone-300 bg-surface text-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">What thoughts are running through your mind?</label>
                <textarea
                  required
                  rows={3}
                  value={thoughts}
                  onChange={(e) => setThoughts(e.target.value)}
                  placeholder="e.g. I am worried about our home and whether water supply will return..."
                  className="w-full p-2.5 rounded border border-stone-300 bg-surface text-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">How are you feeling?</label>
                <div className="flex flex-wrap gap-1.5">
                  {emotionList.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        if (selectedEmotions.includes(em)) {
                          setSelectedEmotions(selectedEmotions.filter(e => e !== em));
                        } else {
                          setSelectedEmotions([...selectedEmotions, em]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                        selectedEmotions.includes(em)
                          ? 'bg-terracotta text-white'
                          : 'bg-surface border border-stone-300 text-charcoal'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold">How strong is it? (1 to 10)</label>
                  <span className="font-bold text-terracotta">{intensity} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">What do you need most right now?</label>
                <input
                  type="text"
                  value={needs}
                  onChange={(e) => setNeeds(e.target.value)}
                  placeholder="e.g. A safe place to rest and a warm cup of water"
                  className="w-full p-2.5 rounded border border-stone-300 bg-surface text-charcoal focus:outline-none"
                />
              </div>
            </div>

            {journalError && (
              <p role="alert" className="text-xs text-red-800 bg-red-50 border border-red-200 rounded p-2">{journalError}</p>
            )}
            <div className="pt-2 flex items-center justify-between">
              {journalSaved && (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Saved privately
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-4 py-2 bg-charcoal text-white rounded text-xs font-bold hover:bg-charcoal-dark transition"
              >
                Save Private Entry
              </button>
            </div>
          </form>

          {/* Past entries */}
          <div className="neu-card p-6 space-y-4">
            <h3 className="text-base font-extrabold text-charcoal">Your Past Entries ({journals.length})</h3>
            {journals.length === 0 ? (
              <p className="text-xs text-charcoal-muted">No entries yet.</p>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {journals.map(j => (
                  <div key={j.id} className="p-3.5 bg-surface-raised rounded-lg border border-stone-200 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-xs text-charcoal-muted">
                      <span>{new Date(j.created_at).toLocaleString('en-IN')}</span>
                      <span className="font-bold text-terracotta">Intensity: {j.emotional_intensity}/10</span>
                    </div>
                    <p className="font-bold text-charcoal">{j.situation}</p>
                    <p className="text-charcoal-light bg-stone-50 p-2 rounded">{j.thoughts}</p>
                    {j.emotions && j.emotions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {j.emotions.map((em, idx) => (
                          <span key={idx} className="text-xs px-1.5 py-0.5 bg-stone-200 rounded text-stone-700">
                            {em}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: THOUGHT REFLECTION (GROQ AI ASSISTED WITH GUARDRAILS) */}
      {activeTab === 'reframe' && (
        <div className="neu-card p-6 md:p-8 max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl mt-1">Reframe a thought</h2>
            <p className="text-xs text-charcoal-muted mt-1">
              Write down a thought that keeps coming back. You will get a kinder way to look at it. This is not a diagnosis.
            </p>
          </div>

          <form onSubmit={handleReframe} className="space-y-4 text-xs">
            <div>
              <label className="font-bold block mb-1">What happened?</label>
              <input
                type="text"
                required
                value={reframeSituation}
                onChange={(e) => setReframeSituation(e.target.value)}
                placeholder="e.g. Cyclone damaged our boundary wall and we had to evacuate"
                className="w-full p-2.5 rounded border border-stone-300 bg-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">What thought keeps coming back?</label>
              <textarea
                required
                rows={2}
                value={currentThought}
                onChange={(e) => setCurrentThought(e.target.value)}
                placeholder="e.g. 'Everything is completely ruined and we will never recover.'"
                className="w-full p-2.5 rounded border border-stone-300 bg-surface focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={reframeLoading}
              className="w-full py-2.5 bg-charcoal text-white rounded text-xs font-bold hover:bg-charcoal-light transition shadow-sm"
            >
              {reframeLoading ? 'Thinking…' : 'Reframe this thought'}
            </button>
            {reframeError && (
              <p role="alert" className="text-xs text-red-800 bg-red-50 border border-red-200 rounded p-2">{reframeError}</p>
            )}
          </form>

          {reframeResult?.is_crisis && (
            <div role="alert" className="p-4 rounded-xl bg-red-50 border-l-4 border-emergency space-y-3 text-xs">
              <p className="font-extrabold text-emergency text-sm">You don't have to face this alone.</p>
              <p className="text-charcoal leading-relaxed">
                {String(reframeResult.message || '').replace(/^CRISIS_ALERT:\s*/, '')}
              </p>
              <div className="flex flex-wrap gap-2">
                <a href="tel:112" className="px-3 py-2 bg-emergency text-white rounded font-bold">Call 112 (Emergency)</a>
                <a href="tel:14416" className="px-3 py-2 bg-charcoal text-white rounded font-bold">Call Tele-MANAS 14416</a>
                <button type="button" onClick={() => setActiveTab('helplines')} className="px-3 py-2 border border-stone-300 rounded font-bold text-charcoal hover:bg-stone-100">
                  See all helplines
                </button>
              </div>
            </div>
          )}

          {reframeResult && !reframeResult.is_crisis && (
            <div className="p-4 rounded-xl bg-surface-inset neu-inset space-y-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-stone-800">
                <MessageCircle className="w-4 h-4 text-terracotta" />
                <span>What you are feeling makes sense</span>
              </div>
              <p className="text-charcoal italic">{reframeResult.validation}</p>
              <div className="p-3 bg-surface rounded border border-stone-200">
                <p className="font-bold text-charcoal mb-1">Another way to see it</p>
                <AIText text={reframeResult.ai_reflection} className="text-charcoal-light leading-relaxed" />
              </div>
              <p className="text-xs text-emerald-800 font-semibold">
                🌿 {reframeResult.self_compassion_prompt}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: VERIFIED CRISIS HELPLINES */}
      {activeTab === 'helplines' && (
        <div className="space-y-4">
          <div className="neu-card p-5 bg-red-50 border-l-4 border-emergency">
            <h2 className="text-sm font-extrabold text-emergency">Talk to someone now</h2>
            <p className="text-xs text-charcoal mt-1">
              Trained counsellors answer these numbers day and night. The calls are free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {helplines.map((line, i) => (
              <div key={i} className="neu-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold capitalize bg-stone-100 text-stone-800">
                      {line.country}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {line.available_hours}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-charcoal text-base">{line.service_name}</h3>
                  <div className="mt-3 p-3 bg-surface-inset rounded neu-inset flex items-center justify-between">
                    <div>
                      <span className="text-xs text-charcoal-muted capitalize font-bold block">Helpline Number</span>
                      <span className="text-base font-black text-emergency">{line.phone_or_code}</span>
                    </div>
                    <a
                      href={`tel:${line.phone_or_code.split(' / ')[0].replace(/[^0-9+]/g, '')}`}
                      className="px-3 py-1.5 bg-emergency text-white rounded text-xs font-bold hover:bg-emergency-hover transition flex items-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Call Now
                    </a>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-200 text-xs text-charcoal-muted">
                  <span className="font-semibold text-stone-600">Source:</span> {line.verified_source}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const MentalHealthModule: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MentalHealthModuleInner />
    </QueryClientProvider>
  );
};
