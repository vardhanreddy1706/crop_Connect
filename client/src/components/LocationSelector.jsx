// src/components/LocationSelector.jsx
import React, { useEffect, useState } from "react";
import WeatherWidget from "./WeatherWidget";

export default function LocationSelector({ onLocationChange }) {
  const [data, setData] = useState({});
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");

  useEffect(() => {
    fetch("/data/india-locations.sample.json")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => console.error("load locations", e));
  }, []);

  useEffect(() => {
    if (state && district && mandal) {
      // optional callback for parent to fetch weather by coordinates for selected mandal
      if (onLocationChange) onLocationChange({ state, district, mandal });
    }
  }, [state, district, mandal]);

  const states = Object.keys(data || {});
  const districts = state ? Object.keys(data[state] || {}) : [];
  const mandals = state && district ? (data[state][district] || []) : [];

  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select value={state} onChange={(e) => { setState(e.target.value); setDistrict(""); setMandal(""); }} className="p-2 border rounded">
          <option value="">Select State</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={district} onChange={(e) => { setDistrict(e.target.value); setMandal(""); }} disabled={!state} className="p-2 border rounded">
          <option value="">Select District</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select value={mandal} onChange={(e) => setMandal(e.target.value)} disabled={!district} className="p-2 border rounded">
          <option value="">Select Mandal</option>
          {mandals.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="mt-4">
        {state && <div className="text-sm text-gray-600">Selected: <strong>{`${state}${district ? " / " + district : ""}${mandal ? " / " + mandal : ""}`}</strong></div>}
      </div>
    </div>
  );
}