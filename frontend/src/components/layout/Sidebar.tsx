import React from 'react';
import {
  LayoutDashboard,
  Map,
  ClipboardList,
  Boxes,
  Users2,
  Building2,
  BookOpen,
  BarChart3,
  Search,
  PlusCircle,
  Clock,
  HeartHandshake,
  Compass,
  CheckSquare,
  Phone
} from 'lucide-react';

interface SidebarProps {
  panel: 'helper' | 'needer';
  currentPath: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ panel, currentPath }) => {
  const helperLinks = [
    { name: 'Dashboard', path: '/helper', icon: LayoutDashboard },
    { name: 'Disaster Map', path: '/disaster/map', icon: Map },
    { name: 'Assistance Requests', path: '/helper/requests', icon: ClipboardList },
    { name: 'Resources & Stock', path: '/helper/resources', icon: Boxes },
    { name: 'Search Groups', path: '/helper/search-groups', icon: Users2 },
    { name: 'Organizations', path: '/disaster/organizations', icon: Building2 },
    { name: 'Preparedness & SOPs', path: '/helper/sop', icon: BookOpen },
    { name: 'Relief Impact', path: '/disaster/impact', icon: BarChart3 },
  ];

  const neederLinks = [
    { name: 'Dashboard', path: '/needer', icon: LayoutDashboard },
    { name: 'Find Help', path: '/needer/find-help', icon: Search },
    { name: 'Disaster Map', path: '/disaster/map', icon: Map },
    { name: 'Request Assistance', path: '/needer/request', icon: PlusCircle },
    { name: 'My Requests', path: '/needer/my-requests', icon: Clock },
    { name: 'Emergency Guidance', path: '/needer/guidance', icon: Compass },
    { name: 'Mental Health Support', path: '/needer/mental-health', icon: HeartHandshake },
    { name: 'Preparedness', path: '/needer/preparedness', icon: CheckSquare },
  ];

  const links = panel === 'helper' ? helperLinks : neederLinks;
  const panelLabel = panel === 'helper' ? 'Helper Operations navigation' : 'Citizen & Community Needs navigation';

  return (
    <aside
      className="w-full md:w-64 bg-surface-raised/80 border-r border-stone-200/80 p-4 shrink-0"
      aria-label={panel === 'helper' ? 'Helper panel sidebar' : 'Needer panel sidebar'}
    >
      <div className="mb-4 px-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-muted" aria-hidden="true">
          {panel === 'helper' ? 'Helper Operations' : 'Citizen & Community Needs'}
        </span>
      </div>

      <nav aria-label={panelLabel}>
        <ul className="space-y-1" role="list">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.path || (link.path !== `/${panel}` && currentPath.startsWith(link.path));

            return (
              <li key={link.path}>
                <a
                  href={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition min-h-[44px] ${
                    isActive
                      ? panel === 'helper'
                        ? 'bg-dustyblue text-white shadow-sm'
                        : 'bg-terracotta text-white shadow-sm'
                      : 'text-charcoal hover:bg-surface hover:text-charcoal-dark'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{link.name}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Helper Verification Status Badge */}
      {panel === 'helper' && (
        <div className="mt-8 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs neu-flat" role="status" aria-label="Verified Responder Desk — active">
          <p className="font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" aria-hidden="true"></span>
            Verified Responder Desk
          </p>
          <p className="text-[11px] text-emerald-700 mt-1">
            Access to live requests, warehouse allocation, and field coordination.
          </p>
        </div>
      )}

      {/* Emergency Helpline shortcut */}
      {panel === 'needer' && (
        <div className="mt-8 p-3 rounded-lg bg-surface border border-stone-300 text-charcoal text-xs neu-flat">
          <p className="font-bold text-terracotta flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            Need urgent help?
          </p>
          <p className="text-[11px] text-charcoal-muted mt-1">
            National Helplines available 24/7.
          </p>
          <a
            href="/needer/mental-health"
            className="mt-2 inline-block text-[11px] font-bold text-dustyblue hover:underline focus-visible:underline"
          >
            View Emergency Numbers →
          </a>
        </div>
      )}
    </aside>
  );
};
