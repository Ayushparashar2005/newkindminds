import React, { useEffect, useState } from 'react';
import { loadLocation, saveLocation, distanceKm as kmBetween, DEFAULT_LOCATION, type PickedLocation } from '../../lib/location';
import { LocationPicker } from '../ui/LocationPicker';
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
  Cross,
  CloudRain,
  Wind,
  Thermometer
} from 'lucide-react';

const NeederDashboardInner: React.FC = () => {
  const [loc, setLoc] = useState<PickedLocation>(DEFAULT_LOCATION);
  const [pickerOpen, setPickerOpen] = useState(false);
  const userLocation = loc.label;
  const userCoords: [number, number] = [loc.lat, loc.lng];

  useEffect(() => {
    loadLocation().then(setLoc);
  }, []);

  const { data: weather, isLoading: weatherLoading, isError: weatherError } = useQuery({
    queryKey: ['weather', loc.lat.toFixed(3), loc.lng.toFixed(3)],
    queryFn: () => api.getLiveWeather(loc.lat, loc.lng),
    staleTime: 10 * 60_000,
    retry: 1,
  });

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

  const distanceKm = (lat: number, lng: number) => kmBetween(userCoords[0], userCoords[1], lat, lng);
  const nearbyResources = allResources
    .filter((r) => r.visibility === 'public')
    .map((r) => ({ ...r, distance: distanceKm(r.latitude, r.longitude) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4);
  const activeDisasters = disasters.filter((d) => d.status === 'active');

  return (
    <div className="space-y-6" id="main-content">
      <DemoBanner />
      <AlertBanner />

      {/* Location Bar */}
      <div className="neu-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-terracotta shrink-0" aria-hidden="true" />
          <div>
            <span className="text-xs font-bold capitalize text-charcoal-muted block">
              Your location
            </span>
            <span className="text-sm font-extrabold text-charcoal">{userLocation}</span>
            <span className="text-xs text-charcoal-muted block">{loc.lat.toFixed(4)}° N, {loc.lng.toFixed(4)}° E</span>
          </div>
        </div>
        <button
          onClick={() => setPickerOpen(true)}
          aria-label={`Change location. Current: ${userLocation}`}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-surface-raised transition text-charcoal self-start sm:self-auto min-h-[44px]"
        >
          Change Location
        </button>
      </div>

      <LocationPicker
        open={pickerOpen}
        initial={loc}
        title="Set your location"
        onClose={() => setPickerOpen(false)}
        onSelect={(picked) => { setLoc(picked); saveLocation(picked); }}
      />

      {/* Live Weather for the chosen location */}
      <section className="neu-card p-4" aria-labelledby="weather-heading">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 id="weather-heading" className="text-sm font-extrabold text-charcoal">Weather here</h2>
          {weather && (
            <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${
              weather.hazard_level === 'critical' ? 'bg-red-100 text-red-800' : weather.hazard_level === 'elevated' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              Hazard: {weather.hazard_level}
            </span>
          )}
        </div>
        {weatherLoading ? (
          <div className="skeleton h-12 w-full" aria-busy="true" aria-label="Loading weather" />
        ) : weatherError || !weather ? (
          <p className="text-xs text-charcoal-muted">Live weather is unavailable right now. Check IMD (mausam.imd.gov.in) for official forecasts.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded bg-surface-raised border border-stone-200 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-terracotta" aria-hidden="true" />
                <span><strong>{Math.round(weather.current.temperature_c)}°C</strong> <span className="text-charcoal-muted">feels {Math.round(weather.current.feels_like_c)}°C</span></span>
              </div>
              <div className="p-2 rounded bg-surface-raised border border-stone-200 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-600" aria-hidden="true" />
                <span><strong>{weather.current.humidity_percent}%</strong> <span className="text-charcoal-muted">humidity</span></span>
              </div>
              <div className="p-2 rounded bg-surface-raised border border-stone-200 flex items-center gap-2">
                <Wind className="w-4 h-4 text-dustyblue" aria-hidden="true" />
                <span><strong>{Math.round(weather.current.wind_speed_kmh)} km/h</strong> <span className="text-charcoal-muted">gusts {Math.round(weather.current.wind_gusts_kmh)}</span></span>
              </div>
              <div className="p-2 rounded bg-surface-raised border border-stone-200 flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-sky-700" aria-hidden="true" />
                <span><strong>{weather.current.precipitation_mm} mm</strong> <span className="text-charcoal-muted">rain now</span></span>
              </div>
            </div>
            {weather.advisories?.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-amber-900" role="list">
                {weather.advisories.map((a: any, i: number) => (
                  <li key={i} className="p-2 rounded bg-amber-50 border border-amber-200">{typeof a === 'string' ? a : a.message || a.title || JSON.stringify(a)}</li>
                ))}
              </ul>
            )}
            <p className="text-xs text-charcoal-muted mt-2">Source: Open-Meteo. For official warnings follow IMD and your State Disaster Management Authority.</p>
          </>
        )}
      </section>

      {/* Primary Action Grid */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="sr-only">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/needer/request"
            className="neu-card-interactive p-5 flex flex-col justify-between group"
            aria-label="Ask for help: food, water, medical care, shelter or evacuation"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center mb-3" aria-hidden="true">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-charcoal group-hover:text-terracotta transition">
                Request Assistance
              </h3>
              <p className="text-xs text-charcoal-muted mt-1">
                Food, drinking water, medical care, shelter or evacuation.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-terracotta inline-flex items-center gap-1" aria-hidden="true">
              Submit Request
            </span>
          </a>

          <a
            href="/needer/find-help"
            className="neu-card-interactive p-5 flex flex-col justify-between group"
            aria-label="Find help nearby: shelters, clinics, food and rescue teams"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-dustyblue/10 text-dustyblue flex items-center justify-center mb-3" aria-hidden="true">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-charcoal group-hover:text-dustyblue transition">
                Find Nearby Help
              </h3>
              <p className="text-xs text-charcoal-muted mt-1">
                Shelters, clinics, food points and rescue teams, nearest first.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-dustyblue inline-flex items-center gap-1" aria-hidden="true">
              Browse Directory
            </span>
          </a>

          <a
            href="/needer/mental-health"
            className="neu-card-interactive p-5 flex flex-col justify-between group"
            aria-label="Mental health: grounding, breathing, journal and helplines"
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
              Ground Yourself
            </span>
          </a>

          <a
            href="/needer/guidance"
            className="neu-card-interactive p-5 flex flex-col justify-between group"
            aria-label="Emergency guidance: what to do in a flood, cyclone or evacuation"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-sand/10 text-sand-dark flex items-center justify-center mb-3" aria-hidden="true">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-charcoal group-hover:text-sand-dark transition">
                Emergency Guidance
              </h3>
              <p className="text-xs text-charcoal-muted mt-1">
                What to do in a flood, cyclone or evacuation.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-sand-dark inline-flex items-center gap-1" aria-hidden="true">
              Read Procedures
            </span>
          </a>
        </div>
      </section>

      {/* Active Disaster Advisories */}
      <section className="neu-card p-5" aria-labelledby="disasters-heading">
        <h2 id="disasters-heading" className="text-base font-extrabold text-charcoal mb-3 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emergency" aria-hidden="true" />
          Active now
        </h2>

        {disastersLoading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading disaster advisories">
            {[1, 2].map(i => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        ) : activeDisasters.length === 0 ? (
          <p className="text-xs text-charcoal-muted p-4 bg-stone-50 rounded border border-stone-200">
            Nothing active near you right now.
          </p>
        ) : (
          <ul className="space-y-3" role="list">
            {activeDisasters.map(d => (
              <li key={d.id} className="p-4 rounded-lg bg-surface-raised border border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold capitalize bg-red-100 text-red-800">
                      {d.category}
                    </span>
                    <span className="text-xs font-extrabold text-charcoal">{d.name}</span>
                  </div>
                  <p className="text-xs text-charcoal-light mt-1 max-w-2xl">{d.description}</p>
                  <span className="text-xs text-charcoal-muted block mt-1">
                    Reported by: {d.source} | Lifecycle Stage: <strong>{d.lifecycle_stage}</strong>
                  </span>
                </div>
                <a
                  href="/needer/guidance"
                  aria-label={`View safety guidance for ${d.name}`}
                  className="px-3 py-1.5 bg-surface border border-stone-300 text-charcoal hover:bg-stone-100 rounded text-xs font-semibold whitespace-nowrap self-start md:self-auto min-h-[44px] inline-flex items-center"
                >
                  What to do
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
            <h2 id="my-requests-heading" className="text-base font-extrabold text-charcoal">Your requests</h2>
            <p className="text-xs text-charcoal-muted">Whether a team has picked them up.</p>
          </div>
          <a href="/needer/my-requests" className="text-xs font-bold text-terracotta hover:underline focus-visible:underline">
            View All
          </a>
        </div>

        {requestsLoading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading your requests">
            {[1, 2].map(i => <div key={i} className="skeleton h-10 w-full" />)}
          </div>
        ) : myRequests.length === 0 ? (
          <div className="p-6 text-center bg-stone-50 rounded border border-stone-200 space-y-2">
            <p className="text-xs text-charcoal-muted">You have not asked for help yet.</p>
            <a href="/needer/request" className="text-xs font-bold text-terracotta hover:underline">
              Request Assistance
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
                  <p className="text-charcoal-light text-xs mt-0.5 line-clamp-1">{req.description}</p>
                </div>
                <time
                  dateTime={req.created_at}
                  className="text-xs text-charcoal-muted whitespace-nowrap flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {new Date(req.created_at).toLocaleDateString('en-IN')}
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
            <h2 id="resources-heading" className="text-base font-extrabold text-charcoal">Help nearby</h2>
            <p className="text-xs text-charcoal-muted">Hospitals, shelters and drinking water.</p>
          </div>
          <a href="/disaster/map" className="text-xs font-bold text-dustyblue hover:underline focus-visible:underline">
            Open Map
          </a>
        </div>

        {resourcesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" aria-busy="true" aria-label="Loading nearby resources">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-20 w-full" />)}
          </div>
        ) : nearbyResources.length === 0 ? (
          <p className="text-xs text-charcoal-muted p-4 bg-stone-50 rounded border border-stone-200">
            Nothing listed near you yet. Call 1078 for the district control room.
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
                  <p className="text-xs text-charcoal-light mt-0.5 truncate">
                    <span aria-hidden="true">📍 </span>
                    <span className="sr-only">Location: </span>
                    {res.address_approximate}
                  </p>
                  {(
                    <p className="text-xs text-charcoal-muted mt-0.5">
                      ~{Math.round(res.distance).toLocaleString('en-IN')} km from {userLocation}
                    </p>
                  )}
                  {res.contact_public && (
                    <p className="text-xs text-stone-600 mt-1 font-medium">
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
