import React from 'react';
import { HeartHandshake, UserPlus } from 'lucide-react';

interface PanelSwitcherProps {
  currentPanel: 'helper' | 'needer';
}

export const PanelSwitcher: React.FC<PanelSwitcherProps> = ({ currentPanel }) => {
  return (
    <div className="inline-flex p-1 bg-surface-inset rounded-lg neu-inset">
      <a
        href="/needer"
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
          currentPanel === 'needer'
            ? 'bg-terracotta text-white shadow-sm'
            : 'text-charcoal-muted hover:text-charcoal'
        }`}
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>Needer Panel</span>
      </a>
      <a
        href="/helper"
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
          currentPanel === 'helper'
            ? 'bg-dustyblue text-white shadow-sm'
            : 'text-charcoal-muted hover:text-charcoal'
        }`}
      >
        <HeartHandshake className="w-3.5 h-3.5" />
        <span>Helper Panel</span>
      </a>
    </div>
  );
};

