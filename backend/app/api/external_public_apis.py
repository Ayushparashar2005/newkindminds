import urllib.request
import urllib.parse
from datetime import datetime, timedelta
import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/external", tags=["Public APIs (External Disaster & Weather Intelligence)"])
logger = logging.getLogger(__name__)

USER_AGENT = "KindMinds-Humanitarian-Platform/1.0"

@router.get("/earthquakes", summary="Fetch live real-time earthquakes from USGS")
def get_live_earthquakes(
    min_magnitude: float = Query(4.0, ge=1.0, le=10.0, description="Minimum earthquake magnitude"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of events to return")
):
    """
    Ingests live global seismic events from the USGS Earthquake Hazards Program (Public APIs repository).
    Normalizes coordinates and severity into KindMinds disaster format.
    """
    # India & neighbourhood (Himalaya, Hindu Kush, Myanmar arc, Andaman–Sumatra), last 30 days
    starttime = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
    url = (
        "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time"
        f"&starttime={starttime}&minmagnitude={min_magnitude}&limit={limit}"
        "&minlatitude=5&maxlatitude=38&minlongitude=66&maxlongitude=98"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())

        events = []
        for feat in data.get("features", [])[:limit]:
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [0, 0, 0])
            mag = props.get("mag") or 0.0

            if mag < min_magnitude:
                continue

            events.append({
                "id": f"usgs_{feat.get('id')}",
                "name": props.get("title", "Seismic Activity"),
                "category": "earthquake",
                "severity": "critical" if mag >= 6.5 else "high" if mag >= 5.0 else "moderate",
                "magnitude": mag,
                "place": props.get("place", "Unknown epicenter"),
                "latitude": coords[1],
                "longitude": coords[0],
                "depth_km": coords[2] if len(coords) > 2 else 0,
                "tsunami_alert": bool(props.get("tsunami", 0)),
                "time": props.get("time"),
                "url": props.get("url"),
                "source": "USGS Earthquake Hazards Program"
            })
        return {
            "source": "USGS Earthquake Hazards Program (Public APIs)",
            "count": len(events),
            "events": events
        }
    except Exception as e:
        logger.error(f"Failed to fetch USGS earthquakes: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to fetch USGS earthquake data: {str(e)}")

@router.get("/weather", summary="Fetch live weather & severe alert conditions from Open-Meteo")
def get_live_weather(
    lat: float = Query(..., description="Latitude of target region"),
    lng: float = Query(..., description="Longitude of target region")
):
    """
    Fetches real-time weather and severe atmospheric hazard metrics from Open-Meteo (Public APIs repository).
    Evaluates hazard flags: Cyclone Risk (gale wind speeds), Flash Flood Risk (heavy precipitation).
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lng}&current="
        f"temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m,wind_gusts_10m&timezone=auto"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        
        current = data.get("current", {})
        wind_gusts = current.get("wind_gusts_10m", 0)
        precip = current.get("precipitation", 0)
        temp = current.get("temperature_2m", 0)

        # Hazard risk assessments
        cyclone_warning = wind_gusts >= 60.0
        high_wind_advisory = wind_gusts >= 40.0
        flood_risk_advisory = precip >= 10.0
        heat_warning = temp >= 40.0

        advisories = []
        if cyclone_warning:
            advisories.append("CRITICAL: Severe gale / storm gusts detected. Seek reinforced shelter.")
        elif high_wind_advisory:
            advisories.append("ADVISORY: Strong wind gusts. Secure loose outdoor fixtures and avoid sea coasts.")
        if flood_risk_advisory:
            advisories.append("ADVISORY: High precipitation rate. Stay alert to rising low-lying water.")
        if heat_warning:
            advisories.append("ADVISORY: Extreme ambient heat. Maintain hydration and keep emergency medical salts ready.")

        return {
            "source": "Open-Meteo Meteorological Service (Public APIs)",
            "coordinates": {"latitude": lat, "longitude": lng},
            "current": {
                "temperature_c": temp,
                "feels_like_c": current.get("apparent_temperature"),
                "humidity_percent": current.get("relative_humidity_2m"),
                "wind_speed_kmh": current.get("wind_speed_10m"),
                "wind_gusts_kmh": wind_gusts,
                "precipitation_mm": precip,
            },
            "hazard_level": "critical" if cyclone_warning else "elevated" if (high_wind_advisory or flood_risk_advisory) else "normal",
            "advisories": advisories
        }
    except Exception as e:
        logger.error(f"Failed to fetch Open-Meteo weather: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to fetch Open-Meteo weather data: {str(e)}")

@router.get("/geocode", summary="Resolve place name to coordinates via Open-Meteo Geocoding")
def geocode_location(
    query: str = Query(..., min_length=2, description="City, town, district, or landmark name"),
    count: int = Query(5, ge=1, le=10)
):
    """
    Forward geocodes natural language location queries via Open-Meteo Geocoding (Public APIs repository).
    """
    safe_q = urllib.parse.quote(query)
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={safe_q}&count={count}&language=en&format=json"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        
        results = []
        for r in data.get("results", []):
            results.append({
                "name": r.get("name"),
                "latitude": r.get("latitude"),
                "longitude": r.get("longitude"),
                "country": r.get("country"),
                "admin1": r.get("admin1"),
                "timezone": r.get("timezone"),
                "display_name": f"{r.get('name')}, {r.get('admin1', '')}, {r.get('country', '')}".replace(" ,", "")
            })
        return {
            "source": "Open-Meteo Geocoding API (Public APIs)",
            "query": query,
            "results": results
        }
    except Exception as e:
        logger.error(f"Failed to geocode location: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to geocode location: {str(e)}")



# --- OpenStreetMap Nominatim (address-level search + reverse geocoding) -------------
# Usage policy: identify the app with a generic User-Agent, keep volume low (user-triggered only).
NOMINATIM = "https://nominatim.openstreetmap.org"
NOMINATIM_UA = "KindMinds/1.0"


def _nominatim(path: str, params: dict):
    url = f"{NOMINATIM}/{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": NOMINATIM_UA, "Accept-Language": "en"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())


def _short_label(addr: dict, fallback: str) -> str:
    parts = []
    for key in ("road", "neighbourhood", "suburb", "village", "town", "city_district", "city", "county", "state_district", "state"):
        val = addr.get(key)
        if val and val not in parts:
            parts.append(val)
    return ", ".join(parts[:4]) if parts else fallback


@router.get("/places", summary="Search Indian addresses, localities and landmarks (OpenStreetMap Nominatim)")
def search_places(
    query: str = Query(..., min_length=2, description="Street, locality, landmark, city or PIN code"),
    limit: int = Query(6, ge=1, le=10),
):
    try:
        data = _nominatim("search", {
            "q": query, "format": "jsonv2", "addressdetails": 1, "limit": limit, "countrycodes": "in",
        })
        results = [
            {
                "label": _short_label(r.get("address", {}), r.get("display_name", query)),
                "display_name": r.get("display_name"),
                "latitude": float(r["lat"]),
                "longitude": float(r["lon"]),
                "type": r.get("type"),
            }
            for r in data
        ]
        return {"source": "OpenStreetMap Nominatim", "query": query, "results": results}
    except Exception as e:
        logger.error(f"Nominatim search failed: {e}")
        raise HTTPException(status_code=502, detail="Place search is temporarily unavailable")


@router.get("/reverse-geocode", summary="Resolve coordinates to a readable Indian address (OpenStreetMap Nominatim)")
def reverse_geocode(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
):
    try:
        r = _nominatim("reverse", {"lat": lat, "lon": lng, "format": "jsonv2", "addressdetails": 1, "zoom": 17})
        if "error" in r:
            raise HTTPException(status_code=404, detail="No address found for this point")
        addr = r.get("address", {})
        return {
            "source": "OpenStreetMap Nominatim",
            "latitude": lat,
            "longitude": lng,
            "label": _short_label(addr, f"{lat:.4f}, {lng:.4f}"),
            "display_name": r.get("display_name"),
            "country_code": addr.get("country_code"),
            "postcode": addr.get("postcode"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Nominatim reverse geocode failed: {e}")
        raise HTTPException(status_code=502, detail="Reverse geocoding is temporarily unavailable")
