import React, { useState } from 'react';
import { DemoBanner } from '../ui/DemoBanner';
import { CheckSquare, ShieldCheck, RefreshCw } from 'lucide-react';

export const PreparednessModule: React.FC = () => {
  const [items, setItems] = useState([
    { id: 'c1', text: 'Drinking water (at least 3 liters per person per day for 3 days)', completed: true, priority: 'critical' },
    { id: 'c2', text: 'Non-perishable food (ready-to-eat dry rations, canned goods, biscuits)', completed: true, priority: 'critical' },
    { id: 'c3', text: 'Essential prescription medications & first aid supplies (min. 7-day supply)', completed: false, priority: 'critical' },
    { id: 'c4', text: 'Battery-powered or hand-crank radio with spare batteries', completed: false, priority: 'essential' },
    { id: 'c5', text: 'High-lumen LED flashlight and heavy-duty power bank (charged to 100%)', completed: true, priority: 'essential' },
    { id: 'c6', text: 'Waterproof zip pouch for Aadhaar/ID cards, insurance, and land/medical records', completed: false, priority: 'critical' },
    { id: 'c7', text: 'Emergency whistle to signal location to search & rescue teams', completed: false, priority: 'recommended' },
    { id: 'c8', text: 'Sanitation & personal hygiene supplies, wet wipes, and masks', completed: false, priority: 'recommended' },
  ]);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const resetAll = () => {
    setItems(prev => prev.map(item => ({ ...item, completed: false })));
  };

  const completedCount = items.filter(i => i.completed).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal tracking-tight">Household Emergency Preparedness</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Build your family 72-hour survival kit and emergency communication readiness.
          </p>
        </div>
        <button
          onClick={resetAll}
          className="px-3 py-1.5 rounded border border-stone-300 text-xs font-semibold text-charcoal hover:bg-surface-raised flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Checklist
        </button>
      </div>

      {/* Progress Card */}
      <div className="neu-card p-6 border-l-4 border-sage">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
            Emergency Kit Readiness
          </span>
          <span className="text-sm font-extrabold text-sage">{progressPercent}% Ready</span>
        </div>
        <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-sage h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <p className="text-xs text-charcoal-muted mt-2">
          {completedCount} of {items.length} essential items prepared for your household.
        </p>
      </div>

      {/* Checklist items */}
      <div className="neu-card p-6 space-y-3">
        <h2 className="text-base font-extrabold text-charcoal mb-4">72-Hour Survival Kit Items</h2>
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between gap-3 transition ${
                item.completed
                  ? 'bg-emerald-50/70 border-emerald-300 text-charcoal'
                  : 'bg-surface border-stone-300 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => {}}
                  className="w-4 h-4 accent-sage rounded cursor-pointer"
                />
                <span className={`text-xs font-medium ${item.completed ? 'line-through text-stone-500' : 'text-charcoal'}`}>
                  {item.text}
                </span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider shrink-0 ${
                item.priority === 'critical'
                  ? 'bg-red-100 text-red-800'
                  : item.priority === 'essential'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-stone-100 text-stone-700'
              }`}>
                {item.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

