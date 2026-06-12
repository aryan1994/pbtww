/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";

import { Loader2, MapPin, Locate, X, CheckCircle2 } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { ORIGIN_COORDS } from "@/lib/booking";

export type PickedLocation = { lat: number; lng: number; address?: string };

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (loc: PickedLocation) => void;
  initial?: { lat: number; lng: number } | null;
}

export function MapPicker({ open, onClose, onPick, initial }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinned, setPinned] = useState<PickedLocation | null>(
    initial ? { lat: initial.lat, lng: initial.lng } : null
  );
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current) return;
        const center = initial ?? ORIGIN_COORDS;
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: initial ? 16 : 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapInstanceRef.current = map;
        geocoderRef.current = new google.maps.Geocoder();

        const marker = new google.maps.Marker({
          position: center,
          map,
          draggable: true,
        });
        markerRef.current = marker;
        if (initial) setPinned({ lat: initial.lat, lng: initial.lng });

        const update = (lat: number, lng: number) => {
          setPinned({ lat, lng });
          setResolving(true);
          geocoderRef.current?.geocode({ location: { lat, lng } }, (results, status) => {
            setResolving(false);
            if (status === "OK" && results?.[0]) {
              setPinned({ lat, lng, address: results[0].formatted_address });
            }
          });
        };

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          marker.setPosition(e.latLng);
          update(e.latLng.lat(), e.latLng.lng());
        });
        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          if (p) update(p.lat(), p.lng());
        });

        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [open, initial]);

  const useCurrent = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        const map = mapInstanceRef.current;
        const marker = markerRef.current;
        if (map && marker) {
          const pos = { lat, lng };
          map.setCenter(pos);
          map.setZoom(16);
          marker.setPosition(pos);
        }
        setPinned({ lat, lng });
        geocoderRef.current?.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            setPinned({ lat, lng, address: results[0].formatted_address });
          }
        });
      },
      undefined,
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm">
      <div className="relative flex h-full max-h-[640px] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-card shadow-elegant">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
            <MapPin className="h-4 w-4 text-primary" /> Pick delivery location
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative flex-1 bg-secondary/50">
          <div ref={mapRef} className="absolute inset-0" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/60">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="border-t border-border bg-card px-5 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              {pinned ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Selected
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">
                    {resolving
                      ? "Looking up address…"
                      : pinned.address ||
                        `${pinned.lat.toFixed(5)}, ${pinned.lng.toFixed(5)}`}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Tap or drag the marker to choose your exact spot.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={useCurrent}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground"
              >
                <Locate className="h-3.5 w-3.5" /> Use current
              </button>
              <button
                type="button"
                disabled={!pinned}
                onClick={() => {
                  if (pinned) {
                    onPick(pinned);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground shadow-card transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
