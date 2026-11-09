import urllib.request
import json

print("=== Testing Public APIs from public-apis repository ===")

# 1. USGS Earthquake Hazards Program
usgs_url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson"
req = urllib.request.Request(usgs_url, headers={"User-Agent": "KindMinds/1.0"})
with urllib.request.urlopen(req, timeout=10) as r:
    data = json.loads(r.read().decode())
    features = data.get("features", [])
    print(f"[USGS] Found {len(features)} significant earthquakes (M4.5+) in the past 24h")
    if features:
        sample = features[0]
        print(f"       Sample: {sample['properties']['title']} | Coords: {sample['geometry']['coordinates'][:2]}")

# 2. Open-Meteo Weather & Extreme Conditions
meteo_url = "https://api.open-meteo.com/v1/forecast?latitude=20.9&longitude=70.36&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m&timezone=auto"
req = urllib.request.Request(meteo_url, headers={"User-Agent": "KindMinds/1.0"})
with urllib.request.urlopen(req, timeout=10) as r:
    data = json.loads(r.read().decode())
    curr = data.get("current", {})
    print(f"[Open-Meteo] Veraval Coast Weather: Temp {curr.get('temperature_2m')}°C, Wind {curr.get('wind_speed_10m')} km/h, Gusts {curr.get('wind_gusts_10m')} km/h, Precip {curr.get('precipitation')} mm")

# 3. Open-Meteo Geocoding / Location Intelligence
geo_url = "https://geocoding-api.open-meteo.com/v1/search?name=Porbandar&count=1&language=en&format=json"
req = urllib.request.Request(geo_url, headers={"User-Agent": "KindMinds/1.0"})
with urllib.request.urlopen(req, timeout=10) as r:
    data = json.loads(r.read().decode())
    res = data.get("results", [{}])[0]
    print(f"[Geocoding] Resolved '{res.get('name')}', {res.get('admin1')}, {res.get('country')} -> Lat: {res.get('latitude')}, Lng: {res.get('longitude')}")

print("\nAll 3 public APIs are functional with zero API key requirement!")

