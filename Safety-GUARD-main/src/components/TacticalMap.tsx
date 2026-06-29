import type { LocationPoint } from "@/types";
import { useEffect, useRef } from "react";

// Dynamically import Leaflet to avoid SSR issues
let L: typeof import("leaflet") | null = null;
import("leaflet").then((m) => {
  L = m.default ?? m;
});

type Props = Readonly<{
  locations: LocationPoint[];
  current: LocationPoint | null;
  height?: number;
  showPulse?: boolean;
  sosActive?: boolean;
  profileUrl?: string | null;
  users?: any[];
  selectedUserId?: string | null;
}>;

export default function TacticalMap({
  locations,
  current,
  height = 400,
  showPulse = false,
  sosActive = false,
  profileUrl = null,
  users: usersProp,
  selectedUserId,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const markersMap = useRef<Record<string, import("leaflet").Marker>>({});
  const polylinesMap = useRef<Record<string, import("leaflet").Polyline>>({});
  const polylineRef = useRef<import("leaflet").Polyline | null>(null);
  const pulseRef = useRef<import("leaflet").Circle | null>(null);
  const policeRefs = useRef<Array<import("leaflet").Marker>>([]);
  const animRef = useRef<number | null>(null);
  const targetPosRef = useRef<[number, number] | null>(null);
  const currentPosRef = useRef<[number, number] | null>(null);

  const renderUserMarkers = () => {
    if (!mapInstanceRef.current || !L || !Array.isArray(usersProp)) return;
    const map = mapInstanceRef.current;
    const users = usersProp as any[];

    users.forEach((u) => {
      const uid = u.userId;
      const lat = u.current?.lat;
      const lng = u.current?.lng;
      if (!lat || !lng) return;
      const pos = [lat, lng] as [number, number];

      if (!markersMap.current[uid]) {
        const icon = L.divIcon({
          html: `<div class="sg-marker-wrap" style="background:${u.status === "EMERGENCY" ? "#ff2d55" : "#21d4ff"}; border:2px solid #111; box-shadow:0 0 18px ${u.status === "EMERGENCY" ? "#ff2d55" : "#21d4ff"}88;"><img src="${u.photoUrl ?? ""}" class="sg-marker-img" alt="${u.name ?? u.userId} profile photo"/></div>`,
          iconSize: [48, 48],
          iconAnchor: [24, 24],
          className: "",
        });
        markersMap.current[uid] = L.marker(pos, { icon }).addTo(map);
      } else {
        markersMap.current[uid].setLatLng(pos);
      }

      if (u.trail && u.trail.length > 1) {
        const pts = u.trail.map((p: any) => [p.lat, p.lng]);
        if (!polylinesMap.current[uid]) {
          polylinesMap.current[uid] = L.polyline(pts, {
            color: u.status === "EMERGENCY" ? "#ff2d55" : "#21d4ff",
            weight: 3,
            opacity: 0.9,
            className: "sg-glow-line",
          }).addTo(map);
        } else {
          polylinesMap.current[uid].setLatLngs(pts);
        }
      }
    });

    const active = new Set(users.map((u) => u.userId));
    Object.keys(markersMap.current).forEach((k) => {
      if (!active.has(k)) {
        markersMap.current[k].remove();
        delete markersMap.current[k];
      }
    });
    Object.keys(polylinesMap.current).forEach((k) => {
      if (!active.has(k)) {
        polylinesMap.current[k].remove();
        delete polylinesMap.current[k];
      }
    });
  };

  const renderEmergencyMarkers = () => {
    if (!mapInstanceRef.current || !L) return;
    const map = mapInstanceRef.current;
    const pos: [number, number] | null = current
      ? [current.lat, current.lng]
      : null;

    if (!pos) return;
    if (!markerRef.current) {
      markerRef.current = L.marker(pos, {
        icon: createMarkerIcon(profileUrl ?? null),
      }).addTo(map);
      currentPosRef.current = pos;
    }

    targetPosRef.current = pos;
    if (!animRef.current) {
      const step = () => {
        const m = markerRef.current;
        const tgt = targetPosRef.current;
        let cur = currentPosRef.current;
        if (!m || !tgt) {
          animRef.current = requestAnimationFrame(step);
          return;
        }
        if (!cur) cur = tgt;
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const nx = lerp(cur[0], tgt[0], 0.12);
        const ny = lerp(cur[1], tgt[1], 0.12);
        currentPosRef.current = [nx, ny];
        m.setLatLng([nx, ny]);
        animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    }

    if (showPulse) {
      if (!pulseRef.current) {
        pulseRef.current = L.circle(pos, {
          radius: 10,
          color: "#ff2d55",
          fillColor: "#ff2d55",
          fillOpacity: 0.08,
          weight: 1,
        }).addTo(map);
      } else {
        pulseRef.current.setLatLng(pos);
      }
    }

    if (showPulse) {
      const animateRipple = () => {
        if (!pulseRef.current) return;
        const start = performance.now();
        const dur = sosActive ? 600 : 1600;
        const baseRadius = 30;
        const maxRadius = sosActive ? 200 : 120;
        const stepAnim = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          const r = baseRadius + (maxRadius - baseRadius) * p;
          pulseRef.current!.setRadius(r);
          pulseRef.current!.setStyle({ fillOpacity: (1 - p) * 0.12 });
          if (p < 1) requestAnimationFrame(stepAnim);
        };
        requestAnimationFrame(stepAnim);
      };
      animateRipple();
      return globalThis.setInterval(animateRipple, sosActive ? 600 : 3000);
    }

    if (locations.length > 1) {
      const points = locations.map((p) => [p.lat, p.lng] as [number, number]);
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(points);
      } else {
        polylineRef.current = L.polyline(points, {
          color: "#ff2d55",
          weight: 4,
          opacity: 0.9,
          className: "sg-glow-line",
        }).addTo(map);
      }
    }

    if (showPulse) {
      map.flyTo(pos, Math.max(map.getZoom(), 15), {
        animate: true,
        duration: 1,
      });
    }

    if (sosActive) {
      policeRefs.current.forEach((m) => m.remove());
      policeRefs.current = [];
      const [lat, lng] = pos;
      const nearby = [
        { name: "Central Police Station", lat: lat + 0.003, lng: lng + 0.002 },
        { name: "North Precinct", lat: lat - 0.0025, lng: lng - 0.0033 },
      ];
      nearby.forEach((p) => {
        const pin = L.circleMarker([p.lat, p.lng], {
          radius: 8,
          color: "#00e5ff",
          fillColor: "#00e5ff",
          fillOpacity: 0.9,
          weight: 1,
        }).addTo(map);
        pin.bindPopup(`<strong>${p.name}</strong>`);
        policeRefs.current.push(pin as any);
      });
      map.flyTo(pos, 16, { animate: true, duration: 1.2 });
    }
  };

  const renderPolylines = () => {
    if (!mapInstanceRef.current || !L || Array.isArray(usersProp)) return;
    const map = mapInstanceRef.current;
    if (locations.length <= 1) return;
    const points = locations.map((p) => [p.lat, p.lng] as [number, number]);
    if (polylineRef.current) {
      polylineRef.current.setLatLngs(points);
    } else {
      polylineRef.current = L.polyline(points, {
        color: "#ff2d55",
        weight: 4,
        opacity: 0.9,
        className: "sg-glow-line",
      }).addTo(map);
    }
  };

  const focusSelectedUser = () => {
    const map = mapInstanceRef.current;
    if (!map || !selectedUserId) return;
    const marker = markersMap.current[selectedUserId];
    if (marker) {
      map.flyTo(marker.getLatLng(), 15, {
        animate: true,
        duration: 0.8,
      });
    }
  };

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const init = async () => {
      const Lm = await import("leaflet");
      const Leaflet = Lm.default ?? Lm;

      const map = Leaflet.map(mapRef.current!, {
        center: [20.5937, 78.9629], // India center fallback
        zoom: 5,
        zoomControl: true,
        attributionControl: false,
      });

      Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    };

    init();

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers + trails when locations or users change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    // If multi-user info provided, render multiple markers
    if (
      Array.isArray((arguments as any)[0]) ||
      typeof (arguments as any) === "object"
    ) {
      // noop to satisfy TS; actual users handled below
    }

    // ensure map styles (keyframes) are injected once
    if (
      typeof document !== "undefined" &&
      !document.getElementById("safetyguard-map-styles")
    ) {
      const style = document.createElement("style");
      style.id = "safetyguard-map-styles";
      style.innerHTML = `
        @keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 0.9 } 100% { transform: scale(2.6); opacity: 0 } }
        .sg-marker-img { width: 44px; height:44px; border-radius:50%; object-fit:cover; display:block }
        .sg-marker-wrap { width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center }
      `;
      document.head.appendChild(style);
    }

    const pos: [number, number] | null = current
      ? [current.lat, current.lng]
      : null;

    // Marker factory
    const createMarkerIcon = (imgUrl?: string | null, color = "#ff2d55") => {
      const html = imgUrl
        ? `
        <div class="sg-marker-wrap" style="background:linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.06)); border:2px solid #fff; box-shadow:0 0 18px ${color}88;">
          <img src="${imgUrl}" class="sg-marker-img" />
          <span style="position:absolute;inset:auto 0 0 0;height:8px;display:block"></span>
        </div>
      `
        : `
        <div class="sg-marker-wrap" style="background:${color}; border:3px solid #111; box-shadow:0 0 18px ${color}88;">
          <div style="width:20px;height:20px;border-radius:50%;background:#111;opacity:0.12"></div>
        </div>
      `;
      return L.divIcon({
        html,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        className: "",
      });
    };

    // If `users` prop provided, render all users
    // NOTE: keep backward compatibility: if no users and current exists use single marker
    // The actual `users` prop is handled in a separate block further below
    if (!Array.isArray(usersProp || null) && pos) {
      if (!markerRef.current) {
        markerRef.current = L.marker(pos, {
          icon: createMarkerIcon(profileUrl ?? null),
        }).addTo(map);
        currentPosRef.current = pos;
      }

      // set target pos and start animation loop
      targetPosRef.current = pos;
      if (!animRef.current) {
        const step = () => {
          const m = markerRef.current;
          const tgt = targetPosRef.current;
          let cur = currentPosRef.current;
          if (!m || !tgt) {
            animRef.current = requestAnimationFrame(step);
            return;
          }
          if (!cur) cur = tgt;
          // lerp towards target
          const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
          const nx = lerp(cur[0], tgt[0], 0.12);
          const ny = lerp(cur[1], tgt[1], 0.12);
          currentPosRef.current = [nx, ny];
          m.setLatLng([nx, ny]);
          animRef.current = requestAnimationFrame(step);
        };
        animRef.current = requestAnimationFrame(step);
      }
    }

    // -- END single-marker handling --

    // Pulse circle and animated ripple every 3s (faster when SOS active)
    const pulseInterval = showPulse ? (sosActive ? 600 : 3000) : 0;
    let rippleTimer: number | undefined;
    if (showPulse) {
      if (!pulseRef.current) {
        pulseRef.current = L.circle(pos, {
          radius: 10,
          color: "#ff2d55",
          fillColor: "#ff2d55",
          fillOpacity: 0.08,
          weight: 1,
        }).addTo(map);
      } else {
        pulseRef.current.setLatLng(pos);
      }

      const animateRipple = () => {
        if (!pulseRef.current) return;
        let start = performance.now();
        const dur = sosActive ? 600 : 1600;
        const baseRadius = 30;
        const maxRadius = sosActive ? 200 : 120;
        const stepAnim = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          const r = baseRadius + (maxRadius - baseRadius) * p;
          pulseRef.current!.setRadius(r);
          pulseRef.current!.setStyle({ fillOpacity: (1 - p) * 0.12 });
          if (p < 1) requestAnimationFrame(stepAnim);
        };
        requestAnimationFrame(stepAnim);
      };

      // run immediately and then on interval
      animateRipple();
      if (pulseInterval > 0)
        rippleTimer = globalThis.setInterval(animateRipple, pulseInterval);
    }

    // Route trail
    if (!Array.isArray(usersProp || null) && locations.length > 1) {
      const points = locations.map((p) => [p.lat, p.lng] as [number, number]);
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(points);
      } else {
        polylineRef.current = L.polyline(points, {
          color: "#ff2d55",
          weight: 4,
          opacity: 0.9,
          dashArray: null,
          className: "sg-glow-line",
        }).addTo(map);
      }
    }

    // center map smoothly to target when new position arrives
    if (showPulse) {
      map.flyTo(pos, Math.max(map.getZoom(), 15), {
        animate: true,
        duration: 1,
      });
    }

    // If SOS active, show nearby police stations (mocked) and zoom
    if (sosActive) {
      // clear existing police markers
      policeRefs.current.forEach((m) => m.remove());
      policeRefs.current = [];
      const [lat, lng] = pos;
      const nearby = [
        { name: "Central Police Station", lat: lat + 0.003, lng: lng + 0.002 },
        { name: "North Precinct", lat: lat - 0.0025, lng: lng - 0.0033 },
      ];
      nearby.forEach((p) => {
        const pin = L.circleMarker([p.lat, p.lng], {
          radius: 8,
          color: "#00e5ff",
          fillColor: "#00e5ff",
          fillOpacity: 0.9,
          weight: 1,
        }).addTo(map);
        pin.bindPopup(`<strong>${p.name}</strong>`);
        policeRefs.current.push(pin as any);
      });
      map.flyTo(pos, 16, { animate: true, duration: 1.2 });
    }

    // cleanup for ripple timer
    return () => {
      if (rippleTimer) globalThis.clearInterval(rippleTimer);
    };
  }, [current, locations, showPulse]);

  // Multi-user rendering effect
  useEffect(() => {
    renderUserMarkers();
    focusSelectedUser();
  }, [usersProp, selectedUserId]);

  // cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      policeRefs.current.forEach((m) => m.remove());
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height,
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    />
  );
}
