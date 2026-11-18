import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { PanelSwitcher } from './PanelSwitcher';
import { MapPin } from 'lucide-react';

interface AppHeaderProps {
  currentPanel: 'helper' | 'needer';
  activeDisasterName?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentPanel,
  activeDisasterName: initialName
}) => {
  const [activeDisasterName, setActiveDisasterName] = useState(initialName);
  useEffect(() => {
    if (initialName) return;
    api.getDisasters({ status: 'active' })
      .then((list) => {
        if (list.length) setActiveDisasterName(list.length > 1 ? `${list[0].name} and ${list.length - 1} more` : list[0].name);
      })
      .catch(() => { /* backend offline: hide the strip */ });
  }, [initialName]);

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-stone-200" role="banner">
      {/* Shown only while a disaster is active */}
      {activeDisasterName && (
        <div className="border-b border-stone-200 text-charcoal-muted text-[13px]" role="status">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-1.5 flex items-center gap-2">
                        <span className="truncate">
              <span className="mark font-medium">Active now</span> <span className="text-charcoal">{activeDisasterName}</span>
            </span>
            <a href="/disaster/map" className="ml-auto shrink-0 font-medium text-charcoal underline decoration-stone-300 underline-offset-[3px] hover:decoration-charcoal">
              See on map
            </a>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        <a href="/" className="flex items-baseline gap-2.5" aria-label="KindMinds home">
          <span className="signage text-[22px] text-charcoal">KindMinds</span>
          <span className="hidden sm:inline text-[13px] text-charcoal-muted">Disaster relief and mental health support, India</span>
        </a>

        <nav className="flex items-center gap-3" aria-label="Global navigation">
          <PanelSwitcher currentPanel={currentPanel} />
          <a
            href="/disaster/map"
            className="hidden sm:inline-flex items-center gap-1.5 h-[34px] px-3 text-sm font-medium text-charcoal rounded-lg border border-stone-300 bg-surface-card hover:bg-surface-inset transition-colors"
          >
            <MapPin className="w-4 h-4" aria-hidden="true" />
            Relief map
          </a>
        </nav>
      </div>
    </header>
  );
};
