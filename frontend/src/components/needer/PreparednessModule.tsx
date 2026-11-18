import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'kindminds.preparednessChecklist';
import { DemoBanner } from '../ui/DemoBanner';
import { CheckSquare, ShieldCheck, RefreshCw } from 'lucide-react';

export const PreparednessModule: React.FC = () => {
  const [items, setItems] = useState([
    { id: 'c1', text: 'Drinking water (at least 3 liters per person per day for 3 days)', completed: true, priority: 'critical' },
    { id: 'c2', text: 'Non-perishable food (ready-to-eat dry rations, canned goods, biscuits)', completed: true, priority: 'critical' },
    { id: 'c3', text: 'Medicines you take, for at least 7 days, and a first-aid kit', completed: false, priority: 'critical' },
    { id: 'c4', text: 'Battery-powered or hand-crank radio with spare batteries', completed: false, priority: 'essential' },
    { id: 'c5', text: 'Torch and a charged power bank', completed: true, priority: 'essential' },
    { id: 'c6', text: 'Aadhaar, insurance and medical papers in a waterproof pouch', completed: false, priority: 'critical' },
    { id: 'c7', text: 'A whistle, so rescue teams can find you', completed: false, priority: 'recommended' },
    { id: 'c8', text: 'Soap, sanitary pads, wet wipes and masks', completed: false, priority: 'recommended' },
  ]);

  const [loaded, setLoaded] = useState(false);

  // Restore saved checklist progress from this browser
  useEffect(() => {
    try {
      const saved: Record<string, boolean> = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) setItems(prev => prev.map(item => (item.id in saved ? { ...item, completed: saved[item.id] } : item)));
    } catch {
      /* storage unavailable, keep defaults */
    }
    setLoaded(true);
  }, []);

  // Persist progress whenever it changes
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(items.map(i => [i.id, i.completed]))));
    } catch {
      /* ignore */
    }
  }, [items, loaded]);

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
          <h1 className="text-[28px] md:text-[32px]">Preparedness</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Pack a bag that will keep your family going for three days.
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
      <div className="neu-card p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold capitalize text-charcoal-muted">
            Packed so far
          </span>
          <span className="text-sm font-extrabold text-sage">{progressPercent}% Ready</span>
        </div>
        <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-charcoal h-full transition-[width] duration-300 ease-[cubic-bezier(0.19,1,0.22,1)]"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <p className="text-xs text-charcoal-muted mt-2">
          {completedCount} of {items.length} essential items prepared for your household.
        </p>
      </div>

      {/* Checklist items */}
      <div className="neu-card p-6 space-y-3">
        <h2 className="text-base font-extrabold text-charcoal mb-4">Three-day bag</h2>
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between gap-3 transition ${
                item.completed
                  ? 'bg-surface-raised border-stone-200 text-charcoal'
                  : 'bg-surface-card border-stone-200 hover:bg-surface-raised'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => {}}
                  className="km-check" aria-label={item.text}
                />
                <span className={`text-xs font-medium ${item.completed ? 'line-through text-stone-500' : 'text-charcoal'}`}>
                  {item.text}
                </span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded capitalize font-bold shrink-0 ${
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

