import React, { useEffect, useState } from "react";
import {
  MapPin,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  Droplets,
  Search,
  RotateCw,
} from "lucide-react";

/**
 * IndiaWeatherAdvanced (v3)
 * - Shows last successful data if search fails
 * - Shows Retry + New Search controls in error state
 * - Village-only search behavior retained
 */
export default function IndiaWeatherAdvanced() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState([]); // search results
  const [isSearching, setIsSearching] = useState(false);

  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState({
    state: "",
    district: "",
    mandal: "",
    lat: null,
    lon: null,
  });

  // last successful snapshot (so UI can show something when errors happen)
  const [lastGood, setLastGood] = useState(null);

  // Auto-detect on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await reverseAndLoad(pos.coords.latitude, pos.coords.longitude);
        },
        async () => {
          // fallback Hyderabad
          await reverseAndLoad(17.385, 78.4867);
        }
      );
    } else {
      setError("Geolocation not supported");
      setLoading(false);
    }
  }, []);

  // do reverse geocode + weather loading
  async function reverseAndLoad(lat, lon) {
    try {
      setError(null);
      setLoading(true);

      // reverse geocode
      const revRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=14`
      );
      const revJson = await revRes.json();
      const addr = revJson.address || {};

      const derivedLocation = {
        state: addr.state || "",
        district: addr.county || addr.city_district || addr.state_district || "",
        mandal:
          addr.subdistrict ||
          addr.municipality ||
          addr.town ||
          addr.village ||
          addr.hamlet ||
          addr.suburb ||
          "",
        lat,
        lon,
      };

      setLocation(derivedLocation);
      await fetchWeatherAndSet(lat, lon, derivedLocation);
    } catch (err) {
      console.error("reverseAndLoad error", err);
      setError("Could not detect location");
      setLoading(false);
    }
  }

  // common wrapper to fetch weather and set lastGood snapshot
  async function fetchWeatherAndSet(lat, lon, locObj = null) {
    try {
      setError(null);
      setLoading(true);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FKolkata`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather API failed");
      const data = await res.json();

      // nearest hourly index
      const curr = data.current_weather?.time;
      let nearestIndex = 0;
      if (Array.isArray(data.hourly?.time) && curr) {
        const currMs = new Date(curr).getTime();
        let best = Infinity;
        for (let i = 0; i < data.hourly.time.length; i++) {
          const tMs = new Date(data.hourly.time[i]).getTime();
          const diff = Math.abs(tMs - currMs);
          if (diff < best) {
            best = diff;
            nearestIndex = i;
          }
        }
      }
      data._nearestHourlyIndex = nearestIndex;

      setWeatherData(data);
      const locToSave = locObj || { ...location, lat, lon };
      setLocation(locToSave);
      setLastGood({ location: locToSave, weatherData: data, timestamp: Date.now() });
      setLoading(false);
    } catch (err) {
      console.error("fetchWeatherAndSet error", err);
      setError("Failed to fetch weather data");
      setLoading(false);
    }
  }

  // SEARCH: query Nominatim
  const handleSearch = async (e) => {
    e?.preventDefault();
    setError(null);
    setCandidates([]);
    const term = (query || "").trim();
    if (!term) return;

    try {
      setIsSearching(true);
      setLoading(false);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        term + ", India"
      )}&format=json&addressdetails=1&limit=8`;
      const res = await fetch(url);
      const items = await res.json();

      if (!items || items.length === 0) {
        setError("No matching location found. Try a different village name.");
        setIsSearching(false);
        return;
      }

      // prioritize village/town/hamlet
      const prioritized = [];
      const others = [];
      for (const it of items) {
        const addr = it.address || {};
        const isVillage =
          !!addr.village || !!addr.hamlet || !!addr.town || addr.class === "place";
        if (isVillage) prioritized.push(it);
        else others.push(it);
      }
      const results = prioritized.length ? prioritized.concat(others) : items;

      // If first result seems village-like auto-select it
      const first = results[0];
      const firstAddr = first?.address || {};
      if (first && (firstAddr.village || firstAddr.hamlet || firstAddr.town)) {
        await selectCandidate(first);
        setCandidates(results);
        setIsSearching(false);
        return;
      }

      setCandidates(results);
      setIsSearching(false);
    } catch (err) {
      console.error("search error", err);
      setError("Search failed. Try again.");
      setIsSearching(false);
    }
  };

  // select a candidate (user clicked or auto)
  async function selectCandidate(item) {
    try {
      setIsSearching(false);
      setCandidates([]);
      setLoading(true);
      setError(null);

      const lat = Number(item.lat);
      const lon = Number(item.lon);
      const addr = item.address || {};

      const mandal =
        addr.subdistrict ||
        addr.municipality ||
        addr.town ||
        addr.village ||
        addr.hamlet ||
        addr.suburb ||
        "";
      const district =
        addr.county ||
        addr.district ||
        addr.city_district ||
        addr.state_district ||
        "";
      const state = addr.state || "";

      const locObj = {
        state,
        district,
        mandal,
        lat,
        lon,
      };

      setLocation(locObj);
      await fetchWeatherAndSet(lat, lon, locObj);
    } catch (err) {
      console.error("selectCandidate error", err);
      setError("Failed to select location");
      setLoading(false);
    }
  }

  // retry the last known good or geolocation
  const handleRetry = async () => {
    setError(null);
    if (lastGood) {
      // re-fetch using last known good coordinates
      const { location: loc } = lastGood;
      await fetchWeatherAndSet(loc.lat, loc.lon, loc);
      return;
    }

    // else attempt geolocation fallback
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await reverseAndLoad(pos.coords.latitude, pos.coords.longitude);
        },
        async () => {
          await reverseAndLoad(17.385, 78.4867);
        }
      );
    } else {
      setError("Geolocation not supported");
    }
  };

  // start fresh search
  const newSearch = () => {
    setQuery("");
    setCandidates([]);
    setError(null);
    setIsSearching(false);
    // keep lastGood displayed below (so user can compare)
  };

  // small icon helper
  const getIcon = (code) => {
    if (code === 0) return <Sun className="w-10 h-10 text-yellow-400" />;
    if ([1, 2, 3].includes(code))
      return <Cloud className="w-10 h-10 text-gray-400" />;
    if (code >= 45 && code <= 67)
      return <CloudRain className="w-10 h-10 text-blue-500" />;
    if (code >= 71 && code <= 77)
      return <CloudSnow className="w-10 h-10 text-blue-300" />;
    return <Cloud className="w-10 h-10 text-gray-400" />;
  };

  // If currently loading and we have lastGood, still show that content (but indicate loading)
  const showData = weatherData || lastGood?.weatherData;
  const showLocation = location && (location.lat !== null || lastGood?.location);

  // UI
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-10 items-start">
      {/* LEFT: Title & description */}
      <div className="lg:w-1/3">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-green-700 mb-3">
          Weather Forecast
        </h2>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          Enter your <strong>village name</strong> (one name) below — CropConnect
          will detect the village, mandal, district and state automatically and
          show real-time weather and a 5-day forecast.
        </p>
      </div>

      {/* RIGHT: search + weather */}
      <div className="flex-1 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl shadow-xl p-6 sm:p-8">
        <form onSubmit={handleSearch} className="mb-3">
          <div className="flex gap-2 items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type village name only (e.g., 'Narsingi')"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-green-300"
            />
            <button
              type="submit"
              className="bg-green-600 text-white p-2 rounded-md hover:bg-green-700"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          </div>

          {/* Candidate list */}
          {isSearching && <div className="text-sm text-gray-500 mt-2">Searching...</div>}
          {candidates?.length > 0 && (
            <div className="mt-3 grid gap-2">
              {candidates.map((it, i) => {
                const addr = it.address || {};
                const label =
                  addr.village ||
                  addr.town ||
                  addr.hamlet ||
                  it.display_name ||
                  `${it.lat}, ${it.lon}`;
                return (
                  <button
                    key={it.place_id || i}
                    type="button"
                    onClick={() => selectCandidate(it)}
                    className="text-left bg-white hover:bg-green-50 px-3 py-2 rounded-md border border-gray-100"
                  >
                    <div className="font-medium text-gray-800">{label}</div>
                    <div className="text-xs text-gray-500">
                      {addr.county || addr.state || it.display_name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </form>

        {/* Error + Retry + New Search */}
        {error && (
          <div className="mb-4">
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-md inline-block">
              {error}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-md hover:bg-green-50"
              >
                <RotateCw className="w-4 h-4" /> Retry
              </button>
              <button
                onClick={newSearch}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
              >
                New Search
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Tip: enter a single village/town name. If the village name is common,
              try adding district or nearby town.
            </div>
          </div>
        )}

        {/* Location header (shows lastGood location if available when error) */}
        {showData && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-800 font-semibold">
              <MapPin className="w-5 h-5 text-green-600" />
              {location.mandal
                ? `${location.mandal}, ${location.district}, ${location.state}`
                : lastGood?.location
                ? `${lastGood.location.mandal || ""}${lastGood.location.mandal ? ", " : ""}${lastGood.location.district || ""}, ${lastGood.location.state || ""}`
                : `${location.district}, ${location.state}`}
            </div>
            <div className="text-xs text-gray-500">
              Lat: {Number(location.lat || lastGood?.location?.lat || 0).toFixed(2)}, Lon:{" "}
              {Number(location.lon || lastGood?.location?.lon || 0).toFixed(2)}
            </div>
          </div>
        )}

        {/* Current weather (use current data or lastGood) */}
        {showData ? (
          (() => {
            const d = weatherData || lastGood?.weatherData;
            const current = d?.current_weather || {};
            const idx = d?._nearestHourlyIndex ?? 0;
            const humidity = d?.hourly?.relative_humidity_2m?.[idx] ?? "--";
            const precip = d?.hourly?.precipitation?.[idx] ?? 0;
            const wind = d?.hourly?.wind_speed_10m?.[idx] ?? current.windspeed ?? "--";

            return (
              <div>
                <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {getIcon(current.weathercode)}
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        {current.temperature ? Math.round(current.temperature) + "°C" : "--"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {current.time ? new Date(current.time).toLocaleString("en-IN") : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6 mt-4 sm:mt-0">
                    <div className="flex flex-col items-center">
                      <Wind className="w-5 h-5 text-green-600" />
                      <span className="text-sm">{wind} km/h</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Droplets className="w-5 h-5 text-blue-500" />
                      <span className="text-sm">{humidity}%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <CloudRain className="w-5 h-5 text-indigo-500" />
                      <span className="text-sm">{precip} mm</span>
                    </div>
                  </div>
                </div>

                {/* 5-day forecast */}
                {d?.daily?.time && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Next 5 Days Forecast</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {d.daily.time.slice(0, 5).map((day, i) => (
                        <div key={day} className="bg-white p-3 rounded-xl text-center shadow-sm hover:shadow-md transition">
                          <div className="text-sm text-gray-500">
                            {new Date(day).toLocaleDateString("en-IN", { weekday: "short" })}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(day).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                          </div>
                          <div className="text-xl font-bold text-green-700 mt-2">
                            {d.daily.temperature_2m_max?.[i] ?? "--"}°
                          </div>
                          <div className="text-xs text-gray-600">↓ {d.daily.temperature_2m_min?.[i] ?? "--"}°</div>
                          <div className="text-xs text-blue-500 mt-1">Rain: {d.daily.precipitation_sum?.[i] ?? 0} mm</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          // no data at all
          <div className="p-4 text-center text-gray-500">No weather data available.</div>
        )}
      </div>
    </div>
  );
}