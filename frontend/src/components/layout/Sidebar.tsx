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
    { name: 'Relief map', path: '/disaster/map', icon: Map },
    { name: 'Requests', path: '/helper/requests', icon: ClipboardList },
    { name: 'Relief stock', path: '/helper/resources', icon: Boxes },
    { name: 'Rescue teams', path: '/helper/search-groups', icon: Users2 },
    { name: 'Organisations', path: '/disaster/organizations', icon: Building2 },
    { name: 'Safety procedures', path: '/helper/sop', icon: BookOpen },
    { name: 'Relief coverage', path: '/disaster/impact', icon: BarChart3 },
  ];

  const neederLinks = [
    { name: 'Dashboard', path: '/needer', icon: LayoutDashboard },
    { name: 'Find help nearby', path: '/needer/find-help', icon: Search },
    { name: 'Relief map', path: '/disaster/map', icon: Map },
    { name: 'Ask for help', path: '/needer/request', icon: PlusCircle },
    { name: 'My requests', path: '/needer/my-requests', icon: Clock },
    { name: 'Emergency guidance', path: '/needer/guidance', icon: Compass },
    { name: 'Mental health', path: '/needer/mental-health', icon: HeartHandshake },
    { name: 'Preparedness', path: '/needer/preparedness', icon: CheckSquare },
  ];

  const links = panel === 'helper' ? helperLinks : neederLinks;
  const panelLabel = panel === 'helper' ? 'Helper Operations navigation' : 'Citizen & Community Needs navigation';


  return (
    <aside
      className="w-full md:w-60 border-r border-stone-200 px-3 py-4 shrink-0"
      aria-label={panel === 'helper' ? 'Helper panel sidebar' : 'Needer panel sidebar'}
    >
      <p className="px-2.5 mb-2 text-[13px] text-charcoal-muted" aria-hidden="true">
        {panel === 'helper' ? 'Responder desk' : 'Get help'}
      </p>

      <nav aria-label={panelLabel}>
        <ul role="list" className="space-y-0.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.path || (link.path !== `/${panel}` && currentPath.startsWith(link.path));

            return (
              <li key={link.path}>
                <a
                  href={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-surface-inset text-charcoal'
                      : 'text-charcoal-muted hover:text-charcoal hover:bg-surface-raised'
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

      {panel === 'helper' && (
        <div className="mx-2.5 mt-6 pt-4 border-t border-stone-200 text-[13px] text-charcoal-muted" role="status">
          <p className="font-bold text-charcoal flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sage" aria-hidden="true"></span>
            Responder access
          </p>
          <p className="mt-1">You can see live requests, manage stock and coordinate field teams.</p>
        </div>
      )}

      {panel === 'needer' && (
        <div className="mx-1 mt-6 p-3 rounded-xl border border-stone-200 bg-surface-card text-[13px]">
          <p className="font-bold text-emergency flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            In danger right now?
          </p>
          <p className="text-charcoal mt-1">
            Call <a href="tel:112" className="font-bold underline">112</a>. For mental-health support, Tele-MANAS <a href="tel:14416" className="font-bold underline">14416</a>.
          </p>
          <a href="/needer/mental-health" className="mt-2 inline-block font-semibold text-charcoal underline underline-offset-2">
            All helpline numbers
          </a>
        </div>
      )}
    </aside>
  );
};
