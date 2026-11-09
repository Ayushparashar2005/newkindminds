import React, { useState } from 'react';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { DemoBanner } from '../ui/DemoBanner';
import { StatusBadge } from '../ui/StatusBadge';
import { DataFreshness } from '../ui/DataFreshness';
import {
  Sparkles,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import type { SOPDocument } from '../../types';

interface SOPLibraryProps {
  panel?: 'helper' | 'needer';
}

const SOPLibraryInner: React.FC<SOPLibraryProps> = ({ panel = 'needer' }) => {
  const [activeStage, setActiveStage] = useState('all');
  const [selectedDisaster, setSelectedDisaster] = useState('all');
  const [summaries, setSummaries] = useState<Record<string, any>>({});
  const [summarizingId, setSummarizingId] = useState<string | null>(null);

  const { data: sops = [], isLoading: loading } = useQuery({
    queryKey: ['sops'],
    queryFn: () => api.getSOPs(),
    staleTime: 120_000,
  });

  const handleSummarize = async (sopId: string) => {
    setSummarizingId(sopId);
    try {
      const summary = await api.summarizeSOP(sopId);
      setSummaries(prev => ({ ...prev, [sopId]: summary }));
    } catch (err) {
      alert('Failed to summarize procedure');
    } finally {
      setSummarizingId(null);
    }
  };

  const stages = [
    { id: 'all', label: 'All Stages' },
    { id: 'prevention', label: '1. Prevention' },
    { id: 'preparedness', label: '2. Preparedness' },
    { id: 'mitigation', label: '3. Mitigation' },
    { id: 'response', label: '4. Immediate Response' },
    { id: 'recovery', label: '5. Recovery & Rebuilding' },
  ];

  const filtered = sops.filter(sop => {
    // Audience filter based on panel
    if (panel === 'needer') {
      if (sop.intended_audience === 'helpers' || sop.intended_audience === 'medical_teams') {
        return false;
      }
    }
    if (activeStage !== 'all' && sop.lifecycle_stage !== activeStage) return false;
    if (selectedDisaster !== 'all' && sop.disaster_type !== selectedDisaster) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <DemoBanner message="STANDARD OPERATING PROCEDURES: Verified protocols from NDMA, Red Cross, and WHO. AI summaries are strictly constrained to verified source text and never hallucinatory." />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal tracking-tight">Verified Emergency Guidance & SOPs</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Authoritative lifecycle protocols from disaster management authorities.
          </p>
        </div>
      </div>

      {/* Lifecycle Stage Filters */}
      <div className="neu-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {stages.map(st => (
            <button
              key={st.id}
              onClick={() => setActiveStage(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeStage === st.id
                  ? 'bg-charcoal text-white shadow-sm'
                  : 'bg-surface border border-stone-300 text-charcoal hover:bg-stone-100'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Disaster Type Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200 text-xs">
          <span className="font-bold text-charcoal mr-1">Disaster:</span>
          {['all', 'flood', 'cyclone', 'earthquake', 'heat'].map(d => (
            <button
              key={d}
              onClick={() => setSelectedDisaster(d)}
              className={`px-2.5 py-1 rounded capitalize font-medium transition ${
                selectedDisaster === d
                  ? 'bg-dustyblue text-white'
                  : 'bg-surface border border-stone-300 text-charcoal hover:bg-stone-100'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* SOPs Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-charcoal-muted">Loading verified procedures...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-sm text-charcoal-muted">No procedures found for this stage/category.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(sop => (
            <div key={sop.id} className="neu-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-900">
                      {sop.disaster_type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-800">
                      Stage: {sop.lifecycle_stage}
                    </span>
                    <span className="text-[11px] text-charcoal-muted">Audience: <strong>{sop.intended_audience}</strong></span>
                  </div>
                  <h3 className="font-extrabold text-charcoal text-lg">{sop.title}</h3>
                </div>

                {/* Groq AI Summarize Action */}
                <button
                  onClick={() => handleSummarize(sop.id)}
                  disabled={summarizingId === sop.id}
                  className="px-3 py-1.5 bg-sage text-white rounded text-xs font-semibold hover:bg-sage-hover transition flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {summarizingId === sop.id ? 'Generating Verified Summary...' : 'AI Quick Summary'}
                </button>
              </div>

              {/* AI Summary Banner if generated */}
              {summaries[sop.id] && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between text-emerald-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> AI Verified Summary (Groq LLM)
                    </span>
                    <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded">Verified Source Only</span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed font-medium">
                    {summaries[sop.id].summary_text}
                  </p>
                  <p className="text-[10px] text-emerald-700 italic border-t border-emerald-200 pt-1">
                    {summaries[sop.id].disclaimer}
                  </p>
                </div>
              )}

              {/* Action Steps */}
              {sop.instructions && sop.instructions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                    Step-by-Step Directives:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {sop.instructions.map((inst, idx) => (
                      <div key={idx} className="p-2.5 bg-surface-raised rounded border border-stone-200 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <span className="text-charcoal leading-snug">{inst}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {sop.warnings && sop.warnings.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs space-y-1">
                  <span className="font-bold text-red-900 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-emergency" /> Life Safety Warnings:
                  </span>
                  <ul className="list-disc list-inside text-red-800 space-y-0.5 pl-2">
                    {sop.warnings.map((warn, idx) => (
                      <li key={idx}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {sop.accessibility_notes && (
                <p className="text-[11px] text-stone-600 bg-stone-100 p-2 rounded">
                  ♿ <strong>Accessibility Protocol:</strong> {sop.accessibility_notes}
                </p>
              )}

              <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <a
                  href={sop.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dustyblue font-bold hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Official Source: {sop.source_organization}
                </a>
                <DataFreshness timestamp={sop.last_reviewed_at} source={sop.source_organization} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const SOPLibrary: React.FC<SOPLibraryProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SOPLibraryInner {...props} />
    </QueryClientProvider>
  );
};
