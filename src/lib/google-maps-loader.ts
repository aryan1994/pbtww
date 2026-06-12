/// <reference types="google.maps" />
// Singleton Google Maps JavaScript API loader.

// Loads the script once (async + callback) and resolves when google.maps is ready.

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string;

let promise: Promise<typeof google> | null = null;

declare global {
  interface Window {
    __pbtwInitMaps?: () => void;
    google: typeof google;
  }
}

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.google?.maps) return Promise.resolve(window.google);
  if (promise) return promise;

  promise = new Promise((resolve, reject) => {
    if (!BROWSER_KEY) {
      reject(new Error("Google Maps key missing"));
      return;
    }
    window.__pbtwInitMaps = () => resolve(window.google);
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      loading: "async",
      libraries: "places",
      callback: "__pbtwInitMaps",
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });

  return promise;
}
