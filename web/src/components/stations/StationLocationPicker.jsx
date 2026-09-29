// -----------------------------------------------------------------------------
// Member 2 - Interactive station GPS location picker.
//
// Loads Leaflet without adding a build dependency, displays OpenStreetMap tiles,
// and returns selected coordinates and a reverse-geocoded address to the form.
// -----------------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react';

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_SCRIPT_ID = 'station-location-leaflet-script';
const LEAFLET_STYLE_ID = 'station-location-leaflet-style';
const DEFAULT_POSITION = [6.9271, 79.8612];

let leafletPromise;

// Loads Leaflet once for every station form opened during the browser session.
const loadLeaflet = () => {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;

  if (!document.getElementById(LEAFLET_STYLE_ID)) {
    const stylesheet = document.createElement('link');
    stylesheet.id = LEAFLET_STYLE_ID;
    stylesheet.rel = 'stylesheet';
    stylesheet.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
    document.head.appendChild(stylesheet);
  }

  leafletPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(LEAFLET_SCRIPT_ID);
    const script = existingScript || document.createElement('script');
    script.id = LEAFLET_SCRIPT_ID;
    script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('The map library could not be loaded.'));
    if (!existingScript) document.body.appendChild(script);
  });

  return leafletPromise;
};

const StationLocationPicker = ({ latitude, longitude, onLocationChange }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const requestRef = useRef(null);
  const [mapError, setMapError] = useState('');
  const [locating, setLocating] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);

  // Attempts to convert the selected GPS point into a readable address.
  const selectLocation = async (selectedLatitude, selectedLongitude) => {
    const nextLatitude = Number(selectedLatitude.toFixed(6));
    const nextLongitude = Number(selectedLongitude.toFixed(6));
    onLocationChange({ latitude: nextLatitude, longitude: nextLongitude });

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setResolvingAddress(true);

    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('lat', nextLatitude);
      url.searchParams.set('lon', nextLongitude);
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('Address lookup failed.');
      const result = await response.json();
      if (result.display_name) {
        onLocationChange({
          latitude: nextLatitude,
          longitude: nextLongitude,
          address: result.display_name,
        });
      }
    } catch (error) {
      if (error.name !== 'AbortError') setMapError('Coordinates selected. Enter the address manually if lookup is unavailable.');
    } finally {
      if (requestRef.current === controller) setResolvingAddress(false);
    }
  };

  // Initializes the map and records a new station position when it is clicked.
  useEffect(() => {
    let active = true;

    loadLeaflet()
      .then((L) => {
        if (!active || !containerRef.current || mapRef.current) return;
        const hasSavedPosition = Number.isFinite(latitude) && Number.isFinite(longitude)
          && !(latitude === 0 && longitude === 0);
        const initialPosition = hasSavedPosition ? [latitude, longitude] : DEFAULT_POSITION;
        const map = L.map(containerRef.current).setView(initialPosition, hasSavedPosition ? 14 : 8);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        const marker = L.circleMarker(initialPosition, {
          radius: 8,
          color: '#047857',
          fillColor: '#10b981',
          fillOpacity: 0.9,
          weight: 3,
        }).addTo(map);
        if (!hasSavedPosition) marker.setStyle({ opacity: 0, fillOpacity: 0 });
        map.on('click', ({ latlng }) => {
          marker.setLatLng(latlng).setStyle({ opacity: 1, fillOpacity: 0.9 });
          selectLocation(latlng.lat, latlng.lng);
        });
        mapRef.current = map;
        markerRef.current = marker;
      })
      .catch((error) => active && setMapError(`${error.message} Enter the coordinates manually.`));

    return () => {
      active = false;
      requestRef.current?.abort();
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Keeps the marker synchronized when coordinates are manually edited.
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    if (latitude === 0 && longitude === 0) return;
    markerRef.current.setLatLng([latitude, longitude]).setStyle({ opacity: 1, fillOpacity: 0.9 });
  }, [latitude, longitude]);

  // Uses browser geolocation and centers the map on the detected station position.
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError('Location access is not supported by this browser.');
      return;
    }
    setLocating(true);
    setMapError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = [coords.latitude, coords.longitude];
        mapRef.current?.setView(point, 16);
        markerRef.current?.setLatLng(point).setStyle({ opacity: 1, fillOpacity: 0.9 });
        selectLocation(coords.latitude, coords.longitude).finally(() => setLocating(false));
      },
      () => {
        setMapError('Current location could not be detected. Select the station on the map instead.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="md:col-span-2">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-700">Station location</p>
          <p className="text-xs text-slate-500">Click the map to select the GPS point and address.</p>
        </div>
        <button type="button" onClick={useCurrentLocation} disabled={locating} className="rounded-md border border-emerald-600 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
          {locating ? 'Locating...' : 'Use current location'}
        </button>
      </div>
      <div ref={containerRef} className="h-72 w-full overflow-hidden rounded-lg border border-slate-300 bg-slate-100" />
      {resolvingAddress && <p className="mt-2 text-xs text-slate-500">Finding the selected address...</p>}
      {mapError && <p className="mt-2 text-xs text-amber-700">{mapError}</p>}
    </div>
  );
};

export default StationLocationPicker;
