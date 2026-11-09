import React, { useState, useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { AlertBanner } from '../ui/AlertBanner';
import { DemoBanner } from '../ui/DemoBanner';
import {
  Wind,
  BookOpen,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  CheckCircle,
  Eye,
  Hand,
  Volume2,
  Smile,
  Utensils
} from 'lucide-react';
import type { CrisisHelpline, MentalHealthJournalEntry } from '../../types';

const MentalHealthModuleInner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'grounding' | 'breathing' | 'journal' | 'reframe' | 'helplines'>('grounding');
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

  // Breathing timer — uses ref to avoid stale closure on phase transitions
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
      setJournalSaved(true);
      setSituation('');
      setThoughts('');
      setNeeds('');
      setTimeout(() => setJournalSaved(false), 3000);
    } catch (err) {
      alert("Failed to save private journal entry");
    }
  };

  const handleReframe = async (e: React.FormEvent) => {
    e.preventDefault();
    setReframeLoading(true);
    try {
      const res = await api.reframeThought({
        situation: reframeSituation,
        current_thought: currentThought,
        emotion: reframeEmotion
      });
      setReframeResult(res);
    } catch (err) {
      alert("Reframing reflection failed. Please try again.");
    } finally {
      setReframeLoading(false);
    }
  };

  const groundingSteps = [
    { count: 5, sense: "Sight", icon: Eye, prompt: "Acknowledge 5 things you can see around you right now (the texture of a wall, shoes, a window, hands, a glass)." },
    { count: 4, sense: "Touch", icon: Hand, prompt: "Feel 4 physical textures (your clothes on your arms, the solid ground under your feet, the coolness of a surface, a smooth object)." },
    { count: 3, sense: "Sound", icon: Volume2, prompt: "Listen for 3 distinct sounds (ambient air, distant voices, your own breath)." },
    { count: 2, sense: "Smell", icon: Smile, prompt: "Notice 2 scents in the air, or imagine a comforting scent like rain or mint." },
    { count: 1, sense: "Taste", icon: Utensils, prompt: "Notice 1 taste, or take a gentle sip of clean water and feel the coolness." }
  ];

  const emotionList = ['Overwhelmed', 'Anxious', 'Numb', 'Afraid', 'Grieving', 'Exhausted', 'Relieved', 'Grounded'];

  return (
    <div className="space-y-6">
      <AlertBanner />

      <div>
        <h1 className="text-2xl font-black text-charcoal tracking-tight">Mental Health & Psychological First Aid</h1>
        <p className="text-sm text-charcoal-muted mt-1">
          Evidence-based grounding exercises, private journaling, compassionate thought reflection, and verified crisis helplines.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200">
        {[
          { id: 'grounding', label: '5-4-3-2-1 Grounding', icon: Eye },
          { id: 'breathing', label: 'Gentle Breathing', icon: Wind },
          { id: 'journal', label: 'Private Journal', icon: BookOpen },
          { id: 'reframe', label: 'Thought Reflection', icon: Sparkles },
          { id: 'helplines', label: 'Verified Helplines', icon: PhoneCall },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-surface border-t-2 border-sage text-charcoal shadow-xs'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: 5-4-3-2-1 SENSORY GROUNDING */}
      {activeTab === 'grounding' && (
        <div className="neu-card p-6 md:p-8 max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sage">Present-Moment Stabilization</span>
            <h2 className="text-xl font-extrabold text-charcoal">5-4-3-2-1 Sensory Grounding</h2>
            <p className="text-xs text-charcoal-muted">
              When disaster shock or distress pulls your mind into panic, your physical senses help anchor you safely in the present moment.
            </p>
          </div>

          <div className="p-6 bg-surface-inset rounded-xl neu-inset text-center space-y-4">
            <div className="inline-flex p-4 rounded-full bg-surface shadow-sm text-sage">
              {React.createElement(groundingSteps[groundingStep].icon, { className: "w-8 h-8" })}
            </div>
            <div className="text-2xl font-black text-charcoal">
              {groundingSteps[groundingStep].count} Things to {groundingSteps[groundingStep].sense}
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
              Previous Sense
            </button>
            <span className="text-xs text-charcoal-muted font-bold">
              Step {groundingStep + 1} of 5
            </span>
            {groundingStep < 4 ? (
              <button
                onClick={() => setGroundingStep(prev => prev + 1)}
                className="px-5 py-2 rounded bg-sage text-white text-xs font-bold hover:bg-sage-hover transition shadow-sm"
              >
                Next Sense &rarr;
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
            <span className="text-xs font-bold uppercase tracking-wider text-dustyblue">Autonomic Nervous System Pacing</span>
            <h2 className="text-xl font-extrabold text-charcoal mt-1">Gentle Paced Breathing</h2>
            <p className="text-xs text-charcoal-muted mt-1">
              Soft, unforced exhalations signal safety to the brain. Stop at any time if you feel lightheaded.
            </p>
          </div>

          <div className="py-8 flex flex-col items-center justify-center">
            <div
              className={`w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-1000 shadow-md ${
                breathingPhase === 'Inhale'
                  ? 'bg-dustyblue/20 scale-110 border-4 border-dustyblue text-dustyblue-dark'
                  : breathingPhase === 'Pause'
                  ? 'bg-amber-100 scale-110 border-4 border-amber-400 text-amber-900'
                  : breathingPhase === 'Exhale'
                  ? 'bg-sage/20 scale-95 border-4 border-sage text-sage-dark'
                  : 'bg-stone-200 scale-90 border-4 border-stone-300 text-charcoal'
              }`}
            >
              <span className="text-base font-black uppercase tracking-wider">{breathingPhase}</span>
              <span className="text-3xl font-extrabold mt-1">{breathCount}</span>
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
                  : 'bg-dustyblue text-white hover:bg-dustyblue-hover'
              }`}
            >
              {breathingActive ? 'Pause Exercise' : 'Begin Paced Breathing'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PRIVATE JOURNAL */}
      {activeTab === 'journal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleSaveJournal} className="neu-card p-6 space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-charcoal">Private Trauma-Informed Journal</h2>
              <p className="text-xs text-charcoal-muted">
                Your entries remain strictly private. They are never sent to public dashboards or AI models without your consent.
              </p>
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                🔒 <strong>Privacy Notice:</strong> For maximum safety, do not include full government IDs, bank details, or passwords in journal reflections.
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">What is happening right now? (Situation)</label>
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
                <label className="font-bold block mb-1">Select Emotions Present:</label>
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
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
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
                  <label className="font-bold">Emotional Intensity (1 to 10):</label>
                  <span className="font-bold text-terracotta">{intensity} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="w-full accent-terracotta"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">What do you need most right now? (Comfort, reassurance, quiet, water...)</label>
                <input
                  type="text"
                  value={needs}
                  onChange={(e) => setNeeds(e.target.value)}
                  placeholder="e.g. A safe place to rest and a warm cup of water"
                  className="w-full p-2.5 rounded border border-stone-300 bg-surface text-charcoal focus:outline-none"
                />
              </div>
            </div>

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
              <p className="text-xs text-charcoal-muted">No journal entries saved yet. Your notes will appear here.</p>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {journals.map(j => (
                  <div key={j.id} className="p-3.5 bg-surface-raised rounded-lg border border-stone-200 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-charcoal-muted">
                      <span>{new Date(j.created_at).toLocaleString()}</span>
                      <span className="font-bold text-terracotta">Intensity: {j.emotional_intensity}/10</span>
                    </div>
                    <p className="font-bold text-charcoal">{j.situation}</p>
                    <p className="text-charcoal-light bg-stone-50 p-2 rounded">{j.thoughts}</p>
                    {j.emotions && j.emotions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {j.emotions.map((em, idx) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-stone-200 rounded text-stone-700">
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
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dustyblue">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trauma-Sensitive Perspective Reflection</span>
            </div>
            <h2 className="text-xl font-extrabold text-charcoal mt-1">Gentle Thought Reframing</h2>
            <p className="text-xs text-charcoal-muted mt-1">
              Explore alternative, compassionate ways of viewing distressing thoughts. This tool does not diagnose or dismiss your real challenges.
            </p>
          </div>

          <form onSubmit={handleReframe} className="space-y-4 text-xs">
            <div>
              <label className="font-bold block mb-1">What event or situation is causing distress?</label>
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
              <label className="font-bold block mb-1">What distressing thought is playing in your mind?</label>
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
              className="w-full py-2.5 bg-dustyblue text-white rounded text-xs font-bold hover:bg-dustyblue-hover transition shadow-sm"
            >
              {reframeLoading ? 'Reflecting gently...' : 'Generate Compassionate Reflection'}
            </button>
          </form>

          {reframeResult && (
            <div className="p-4 rounded-xl bg-surface-inset neu-inset space-y-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-stone-800">
                <Sparkles className="w-4 h-4 text-terracotta" />
                <span>Compassionate Validation:</span>
              </div>
              <p className="text-charcoal italic">{reframeResult.validation}</p>
              <div className="p-3 bg-surface rounded border border-stone-200">
                <p className="font-bold text-charcoal mb-1">Alternative Perspective to Consider:</p>
                <p className="text-charcoal-light leading-relaxed">{reframeResult.ai_reflection}</p>
              </div>
              <p className="text-[11px] text-emerald-800 font-semibold">
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
            <h2 className="text-sm font-extrabold text-emergency">Immediate Crisis Support Contacts</h2>
            <p className="text-xs text-charcoal mt-1">
              If you or someone nearby is experiencing acute psychological distress, panic, or grief, trained counselors are available 24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {helplines.map((line, i) => (
              <div key={i} className="neu-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800">
                      {line.country}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {line.available_hours}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-charcoal text-base">{line.service_name}</h3>
                  <div className="mt-3 p-3 bg-surface-inset rounded neu-inset flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-charcoal-muted uppercase font-bold block">Helpline Number</span>
                      <span className="text-base font-black text-emergency">{line.phone_or_code}</span>
                    </div>
                    <a
                      href={`tel:${line.phone_or_code.split(' ')[0].replace(/[^0-9]/g, '')}`}
                      className="px-3 py-1.5 bg-emergency text-white rounded text-xs font-bold hover:bg-emergency-hover transition flex items-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Call Now
                    </a>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-200 text-[10px] text-charcoal-muted">
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
