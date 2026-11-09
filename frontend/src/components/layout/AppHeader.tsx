import React from 'react';
import { PanelSwitcher } from './PanelSwitcher';
import { Activity, ShieldCheck, MapPin } from 'lucide-react';

interface AppHeaderProps {
  currentPanel: 'helper' | 'needer';
  activeDisasterName?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentPanel,
  activeDisasterName = "Active Cyclone Response (Western Coast)"
}) => {
  return (
    <header
      className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-stone-200/80 px-4 lg:px-8 py-3"
      role="banner"
    >
      {/* Skip-to-content (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-terracotta focus:text-white focus:rounded-lg focus:text-sm focus:font-bold"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 group" aria-label="KindMinds — return to home">
            <div
              className="w-8 h-8 rounded-lg bg-terracotta text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:bg-terracotta-hover transition"
              aria-hidden="true"
            >
              KM
            </div>
            <div>
              <span className="font-extrabold text-lg text-charcoal tracking-tight">KindMinds</span>
              <span className="text-[10px] block uppercase tracking-wider text-charcoal-muted font-semibold">
                Humanitarian &amp; Mental Health Response
              </span>
            </div>
          </a>

          {/* Active Disaster Pill */}
          {activeDisasterName && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-900 font-medium"
              role="status"
              aria-label={`Active situation: ${activeDisasterName}`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-600 animate-pulse" aria-hidden="true" />
              <span className="truncate max-w-[280px]">{activeDisasterName}</span>
            </div>
          )}
        </div>

        {/* Panel Switcher & Actions */}
        <nav className="flex items-center gap-4" aria-label="Global navigation">
          <PanelSwitcher currentPanel={currentPanel} />

          <a
            href="/disaster/map"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-light hover:text-charcoal px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-surface-raised transition"
            aria-label="Open interactive Disaster Map"
          >
            <MapPin className="w-3.5 h-3.5 text-terracotta" aria-hidden="true" />
            Disaster Map
          </a>
        </nav>
      </div>
    </header>
  );
};
