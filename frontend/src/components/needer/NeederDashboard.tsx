import React, { useState } from 'react';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { api } from '../../lib/api';
import { DemoBanner } from '../ui/DemoBanner';
import { AlertBanner } from '../ui/AlertBanner';
import { StatusBadge } from '../ui/StatusBadge';
import {
  MapPin,
  PlusCircle,
  Search,
  HeartHandshake,
  Compass,
  Clock,
  Droplets,
  Home,
  Cross
} from 'lucide-react';

const NeederDashboardInner: React.FC = () => {
  const [userLocation, setUserLocation] = useState('Veraval / Porbandar Coast, Gujarat');

  const { data: disasters = [], isLoading: disastersLoading } = useQuery({
    queryKey: ['disasters'],
    queryFn: () => api.getDisasters(),
    staleTime: 60_000,
  });

  const { data: myRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['assistance-requests'],
    queryFn: () => api.getRequests(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const { data: allResources = [], isLoading: resourcesLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => api.getResources(),
    staleTime: 60_000,
  });

  const nearbyResources = allResources.slice(0, 4);

  return (
    <div className="space-y-6" id="main-content">
      <DemoBanner />
      <AlertBanner />

      {/* Location Bar */}
      <div className="neu-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-terracotta shrink-0" aria-hidden="true" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-muted block">
              Your Current Location / Region
            </span>
            <span className="text-sm font-extrabold text-charcoal">{userLocation}</span>
          </div>
        </div>
        <button
          onClick={() => {
            const loc = prompt('Enter your city, district or landmark:', userLocation);
            if (loc) setUserLocation(loc);
          }}
          aria-label={`Change location — currently: ${userLocation}`}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-surface-raised transition text-charcoal self-start sm:self-auto min-h-[44px]"
        >
          Change Location
        </button>
      </div>

      {/* Primary Action Grid */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="sr-only">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/needer/request"
            className="neu-card-interactive p-5 bg-gradient-to-br from-[#FDFBF7] to-[#F5ECE5] border-l-4 border-terracotta flex flex-col justify-between group"
            aria-label="Request Assistance — food, water, medical care, shelter, or evacuation"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center mb-3" aria-hidden="true">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-charcoal group-hover:text-terracotta transition">
                Request Assistance
              </h3>
              <p className="text-xs text-charcoal-muted mt-1">
                Submit a request for food, drinking water, medical care, shelter, or evacuation.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-terracotta inline-flex items-center gap-1" aria-hidden="true">
              Submit Request &rarr;
            </span>
          </a>

          <a
            href="/needer/find-help"
            className="neu-card-interactive p-5 bg-gradient-to-br from-[#FDFBF7] to-[#EBF0F3] border-l-4 border-dustyblue flex flex-col justify-between group"
            aria-label="Find Nearby Help — verified shelters, clinics, food centers, rescue teams"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-dustyblue/10 text-dustyblue flex items-center justify-center mb-3" aria-hidden="true">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-charcoal group-hover:text-dustyblue transition">
                Find Nearby Help
              </h3>
              <p className="text-xs text-charcoal-muted mt-1">
                Locate verified emergency shelters, field clinics, food centers, and rescue teams.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-dustyblue inline-flex items-center gap-1" aria-hidden="true">
              Browse Directory &rarr;
            </span>
          </a>

          <a
            href="/needer/mental-health"
            className="neu-card-interactive p-5 bg-gradient-to-br from-[#FDFBF7] to-[#EEF3EF] border-l-4 border-sage flex flex-col justify-between group"
            aria-label="Mental Health and Calming — grounding, breathing exercises, journal, crisis helplines"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-sage/10 text-sage flex items-center justify-center mb-3" aria-hidden="true">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-charcoal group-hover:text-sage transition">
                Mental Health &amp; Calming
              </h3>
              <p className="text-xs text-charcoal-muted mt-1">
                5-4-3-2-1 sensory grounding, breathing exercises, private journal, and crisis helplines.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-sage inline-flex items-center gap-1" aria-hidden="true">
              Ground Yourself &rarr;
            </span>
          </a>

          <a
            href="/needer/guidance"
            className="neu-card-interactive p-5 bg-gradient-to-br from-[#FDFBF7] to-[#FAF4E8] border-l-4 border-sand flex flex-col justify-between group"
            aria-label="Emergency Guidance — official safety procedures for flood, cyclone, and evacuation"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-sand/10 text-sand flex items-center justify-center mb-3" aria-hidden="true">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-charcoal group-hover:text-sand transition">
                Emergency Guidance
              </h3>
              <p className="text-xs text-charcoal-muted mt-1">
                Official verified safety procedures for flood water, cyclone winds, and safe evacuation.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-sand inline-flex items-center gap-1" aria-hidden="true">
              Read Procedures &rarr;
            </span>
          </a>
        </div>
      </section>

      {/* Active Disaster Advisories */}
      <section className="neu-card p-5" aria-labelledby="disasters-heading">
        <h2 id="disasters-heading" className="text-base font-extrabold text-charcoal mb-3 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emergency animate-ping" aria-hidden="true" />
          Active Disaster Situations Relevant to Your Region
        </h2>

        {disastersLoading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading disaster advisories">
            {[1, 2].map(i => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        ) : disasters.length === 0 ? (
          <p className="text-xs text-charcoal-muted p-4 bg-stone-50 rounded border border-stone-200">
            No active disaster advisories for your region at this time.
          </p>
        ) : (
          <ul className="space-y-3" role="list">
            {disasters.map(d => (
              <li key={d.id} className="p-4 rounded-lg bg-surface-raised border border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
                      {d.category}
                    </span>
                    <span className="text-xs font-extrabold text-charcoal">{d.name}</span>
                  </div>
                  <p className="text-xs text-charcoal-light mt-1 max-w-2xl">{d.description}</p>
                  <span className="text-[11px] text-charcoal-muted block mt-1">
                    Reported by: {d.source} | Lifecycle Stage: <strong>{d.lifecycle_stage}</strong>
                  </span>
                </div>
                <a
                  href="/needer/guidance"
                  aria-label={`View safety guidance for ${d.name}`}
                  className="px-3 py-1.5 bg-surface border border-stone-300 text-charcoal hover:bg-stone-100 rounded text-xs font-semibold whitespace-nowrap self-start md:self-auto min-h-[44px] inline-flex items-center"
                >
                  View Safety Guidance
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* User's Submitted Requests Status */}
      <section className="neu-card p-5" aria-labelledby="my-requests-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="my-requests-heading" className="text-base font-extrabold text-charcoal">Your Submitted Requests</h2>
            <p className="text-xs text-charcoal-muted">Track the response progress from humanitarian responders.</p>
          </div>
          <a href="/needer/my-requests" className="text-xs font-bold text-terracotta hover:underline focus-visible:underline">
            View All &rarr;
          </a>
        </div>

        {requestsLoading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading your requests">
            {[1, 2].map(i => <div key={i} className="skeleton h-10 w-full" />)}
          </div>
        ) : myRequests.length === 0 ? (
          <div className="p-6 text-center bg-stone-50 rounded border border-stone-200 space-y-2">
            <p className="text-xs text-charcoal-muted">You have not submitted any active requests.</p>
            <a href="/needer/request" className="text-xs font-bold text-terracotta hover:underline">
              Request Assistance →
            </a>
          </div>
        ) : (
          <ul className="space-y-2" role="list" aria-label="Your recent requests">
            {myRequests.slice(0, 3).map(req => (
              <li key={req.id} className="p-3 bg-surface-raised rounded-lg border border-stone-200 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-charcoal capitalize">{req.assistance_category} Request</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-charcoal-light text-[11px] mt-0.5 line-clamp-1">{req.description}</p>
                </div>
                <time
                  dateTime={req.created_at}
                  className="text-[10px] text-charcoal-muted whitespace-nowrap flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {new Date(req.created_at).toLocaleDateString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Nearby Resources Preview */}
      <section className="neu-card p-5" aria-labelledby="resources-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="resources-heading" className="text-base font-extrabold text-charcoal">Verified Relief Points Nearby</h2>
            <p className="text-xs text-charcoal-muted">Hospitals, evacuation shelters, and clean water distribution centers.</p>
          </div>
          <a href="/disaster/map" className="text-xs font-bold text-dustyblue hover:underline focus-visible:underline">
            Open Map &rarr;
          </a>
        </div>

        {resourcesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" aria-busy="true" aria-label="Loading nearby resources">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-20 w-full" />)}
          </div>
        ) : nearbyResources.length === 0 ? (
          <p className="text-xs text-charcoal-muted p-4 bg-stone-50 rounded border border-stone-200">
            No verified resources available in your area. Check back shortly.
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3" role="list">
            {nearbyResources.map(res => (
              <li key={res.id} className="p-3 rounded-lg border border-stone-200 bg-surface-raised flex items-start gap-3">
                <div className="p-2 rounded bg-stone-100 text-charcoal mt-1" aria-hidden="true">
                  {res.category === 'medical' && <Cross className="w-4 h-4 text-emergency" />}
                  {res.category === 'shelter' && <Home className="w-4 h-4 text-dustyblue" />}
                  {res.category === 'water' && <Droplets className="w-4 h-4 text-sky-600" />}
                  {!['medical', 'shelter', 'water'].includes(res.category) && <Home className="w-4 h-4 text-stone-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-xs font-bold text-charcoal truncate">{res.name}</h3>
                    <StatusBadge status={res.operational_status} />
                  </div>
                  <p className="text-[11px] text-charcoal-light mt-0.5 truncate">
                    <span aria-hidden="true">📍 </span>
                    <span className="sr-only">Location: </span>
                    {res.address_approximate}
                  </p>
                  {res.contact_public && (
                    <p className="text-[11px] text-stone-600 mt-1 font-medium">
                      <span className="sr-only">Contact: </span>{res.contact_public}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export const NeederDashboard: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <NeederDashboardInner />
    </QueryClientProvider>
  );
};
