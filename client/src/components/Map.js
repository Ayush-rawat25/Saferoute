import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Paper } from "@mui/material";
import HeatmapLayer from "./heatLayer";
import axios from "axios";
import icon from "../assets/focus.png";
import IncidentReport from "./IncidentReport";
import HelpButton from "./HelpButton";

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const userIcon = L.icon({
  iconUrl: icon,
  iconSize: [25, 25],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const getRouteId = (route, index) => route.id ?? index;

// ✅ This component uses useMap to access map instance and fit bounds
const MapViewControl = ({ selectedRoute, startPoint, endPoint }) => {
  const map = useMap();

  useEffect(() => {
    const bounds = [];

    if (selectedRoute?.geometry?.coordinates?.length > 0) {
      const latLngs = selectedRoute.geometry.coordinates.map((coord) => [
        coord[1],
        coord[0],
      ]);
      bounds.push(...latLngs);
    }

    if (startPoint) bounds.push(startPoint);
    if (endPoint) bounds.push(endPoint);

    if (bounds.length === 0) return;

    setTimeout(() => {
      if (bounds.length >= 2) {
        const leafletBounds = L.latLngBounds(bounds);
        map.fitBounds(leafletBounds, { padding: [75, 75] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 15);
      }
    }, 200);
  }, [map, selectedRoute, startPoint, endPoint]);

  return null;
};

// Helper to check if a point is near any danger zone
function isNearDangerZone(point, dangerZones, radius = 100) {
  // radius in meters
  return dangerZones.some((zone) => {
    const dist = L.latLng(point).distanceTo([zone[0], zone[1]]);
    return dist < radius;
  });
}

// Split route into colored segments
function getColoredSegments(routeCoords, dangerZones) {
  let minDist = Infinity;
  let closestPair = null;
  let anyDanger = false;
  const segments = [];

  // Preprocess zones into Leaflet latLngs once
  const dzLatLngs = dangerZones.map((zone) => L.latLng(zone[0], zone[1]));

  for (let i = 0; i < routeCoords.length - 1; i++) {
    const start = routeCoords[i];
    const end = routeCoords[i + 1];
    const startLatLng = L.latLng(start);
    const endLatLng = L.latLng(end);

    // Danger check with early escape
    let isDanger = false;
    for (const dz of dzLatLngs) {
      const d1 = startLatLng.distanceTo(dz);
      const d2 = endLatLng.distanceTo(dz);

      if (d1 < minDist) {
        minDist = d1;
        closestPair = { route: start, dz: [dz.lat, dz.lng] };
      }
      if (d2 < minDist) {
        minDist = d2;
        closestPair = { route: end, dz: [dz.lat, dz.lng] };
      }

      if (d1 < 1000 || d2 < 1000) {
        isDanger = true;
        break; // Early break improves performance
      }
    }

    if (isDanger) anyDanger = true;
    segments.push({
      coords: [start, end],
      color: isDanger ? "red" : "blue",
    });
  }

  return { segments, closestPair };
}

const Map = ({
  routes = [],
  selectedRoute,
  startPoint,
  endPoint,
  onMapClick,
  bestRouteId,
}) => {
  const [dangerZones, setDangerZones] = useState([]);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    const handleIncidentReport = () => setOpen(true);
    window.addEventListener("openIncidentReport", handleIncidentReport);
    return () =>
      window.removeEventListener("openIncidentReport", handleIncidentReport);
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/danger-zones")
      .then((res) => {
        const validPoints = res.data
          .filter(
            (zone) =>
              typeof zone.latitude === "number" &&
              typeof zone.longitude === "number"
          )
          .map((zone) => [zone.latitude, zone.longitude, zone.severity]);
        setDangerZones(validPoints);
      })
      .catch((err) => {
        console.error("Failed to fetch danger zones:", err);
      });
  }, []);

  useEffect(() => {
    navigator.geolocation.watchPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.error("Error getting location:", err);
      }
    );
  }, []);

  return (
    <>
      <Paper elevation={3} sx={{ height: "70vh", width: "100%" }}>
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          onClick={onMapClick}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* ✅ Map behavior logic with useMap */}
          <MapViewControl
            selectedRoute={selectedRoute}
            startPoint={startPoint}
            endPoint={endPoint}
          />

          {position && (
            <Marker position={position} icon={userIcon}>
              <Popup>You are here!</Popup>
            </Marker>
          )}

          <HeatmapLayer points={dangerZones} />

          {routes.map((route, index) => {
            const routeId = getRouteId(route, index);
            const isBest = bestRouteId === routeId;
            if (!route.geometry?.coordinates) return null;

            const routeCoords = route.geometry.coordinates.map((coord) => [
              coord[1],
              coord[0],
            ]);
            const { segments } = getColoredSegments(routeCoords, dangerZones);
            return (
              <React.Fragment key={routeId}>
                {segments.map((seg, idx) => (
                  <Polyline
                    key={`${routeId}-seg-${idx}`}
                    positions={seg.coords}
                    pathOptions={{
                      color: seg.color,                          
                      weight: isBest ? 5 : 3,
                      opacity: isBest ? 1 : 0.5,
                      dashArray: isBest ? null : "6 8",         
                    }}
                    zIndex={isBest ? 1000 : 500}
                  />
                ))}
              </React.Fragment>
            );
          })}

          {startPoint && (
            <Marker position={startPoint}>
              <Popup>Start Point</Popup>
            </Marker>
          )}

          {endPoint && (
            <Marker position={endPoint}>
              <Popup>Destination</Popup>
            </Marker>
          )}

          <div className="absolute top-4 left-4 bg-white p-3 rounded shadow z-[9999]">
            <div className="flex items-center mb-1">
              <div className="w-6 h-2 bg-blue-500 mr-2 rounded"></div>
              <span className="text-sm text-gray-700">Safe Route</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-2 bg-red-500 mr-2 rounded"></div>
              <span className="text-sm text-gray-700">Danger Zone Segment</span>
            </div>
          </div>
        </MapContainer>
      </Paper>

      <div className="fixed bottom-5 right-5 z-[9999]">
        <HelpButton position={position} />
      </div>

      {open && (
        <IncidentReport
          open={open}
          onClose={() => setOpen(false)}
          location={position}
        />
      )}
    </>
  );
};

export default Map;
