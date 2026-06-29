import { Geofence } from "@/types";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { FeatureGroup } from "react-leaflet";

interface GeofenceLayerProps {
  readonly geofences: Geofence[];
  readonly currentBreaches: string[]; // geofence_ids currently breached
}

export function GeofenceLayer({
  geofences,
  currentBreaches,
}: GeofenceLayerProps) {
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  useEffect(() => {
    if (!featureGroupRef.current) return;

    // Clear existing layers
    featureGroupRef.current.clearLayers();

    // Add geofence polygons
    geofences.forEach((geofence) => {
      const isBreached = currentBreaches.includes(geofence.id);
      const color =
        geofence.type === "safe"
          ? "#10b981"
          : isBreached
            ? "#ff2d55"
            : "#ef4444";
      const fillOpacity = isBreached ? 0.4 : 0.2;

      try {
        const geoJSON = L.geoJSON(geofence.polygon_coordinates, {
          style: {
            color,
            weight: 2,
            opacity: 0.8,
            fillColor: color,
            fillOpacity,
          },
          onEachFeature: (feature, layer) => {
            const popup = L.popup().setContent(
              `<div class="font-semibold">${geofence.name}</div><div class="text-sm text-gray-600">${geofence.type === "safe" ? "✅ Safe Zone" : "⚠️ Unsafe Zone"}</div>`,
            );
            layer.bindPopup(popup);

            // Add hover effect
            layer.on("mouseover", () => {
              if (layer instanceof L.Path) {
                layer.setStyle({ weight: 3, opacity: 1 });
              }
            });
            layer.on("mouseout", () => {
              if (layer instanceof L.Path) {
                layer.setStyle({ weight: 2, opacity: 0.8 });
              }
            });
          },
        });

        featureGroupRef.current?.addLayer(geoJSON);
      } catch (e) {
        console.warn(`Error adding geofence ${geofence.name}:`, e);
      }
    });
  }, [geofences, currentBreaches]);

  return <FeatureGroup ref={featureGroupRef} />;
}
