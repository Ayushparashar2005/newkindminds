import React, { useLayoutEffect, useRef, useState } from 'react';

interface PanelSwitcherProps {
  currentPanel: 'helper' | 'needer';
}

const items = [
  { id: 'needer', href: '/needer', label: 'I need help' },
  { id: 'helper', href: '/helper', label: "I'm helping" },
] as const;

// Segmented control (khe): subtle track with a white pill that slides to the
// item you pick, then the page changes.
export const PanelSwitcher: React.FC<PanelSwitcherProps> = ({ currentPanel }) => {
  const [selected, setSelected] = useState<string>(currentPanel);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const refs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useLayoutEffect(() => {
    const el = refs.current[selected];
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [selected]);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string, href: string) => {
    if (id === selected || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setSelected(id);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => { window.location.href = href; }, reduce ? 0 : 180);
  };

  return (
    <div
      className="relative inline-flex gap-0.5 p-[3px] rounded-[11px] bg-surface-raised border border-stone-200"
      role="group"
      aria-label="Switch panel"
    >
      {pill && (
        <span
          aria-hidden="true"
          className="km-seg-indicator absolute top-[3px] bottom-[3px] rounded-lg bg-surface-card shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {items.map((it) => {
        const on = selected === it.id;
        return (
          <a
            key={it.id}
            ref={(el) => { refs.current[it.id] = el; }}
            href={it.href}
            onClick={(e) => go(e, it.id, it.href)}
            aria-current={currentPanel === it.id ? 'page' : undefined}
            className={`relative z-10 px-3 py-[7px] rounded-lg text-[13px] font-medium leading-none transition-colors duration-150 ${
              on ? 'text-charcoal' : 'text-charcoal-muted hover:text-charcoal'
            } ${on && !pill ? 'bg-surface-card shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : ''}`}
          >
            {it.label}
          </a>
        );
      })}
    </div>
  );
};
