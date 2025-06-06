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
import { Box, Paper } from "@mui/material";
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

const Map = ({
  routes = [],
  selectedRoute,
  startPoint,
  endPoint,
  onMapClick,
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

  const getRouteColor = (safetyScore) => {
    if (safetyScore >= 80) return "blue";
    if (safetyScore >= 50) return "orange";
    return "red";
  };

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
            const safetyScore = route.properties?.safetyScore ?? 0;

            if (!route.geometry?.coordinates) return null;

            const isSelected =
              selectedRoute && getRouteId(selectedRoute) === routeId;

            return (
              <Polyline
                key={`${routeId}-${safetyScore}`}
                positions={route.geometry.coordinates.map((coord) => [
                  coord[1],
                  coord[0],
                ])}
                color={getRouteColor(safetyScore)}
                weight={isSelected ? 6 : 3}
                opacity={isSelected ? 1 : 0.5}
              >
                <Popup>
                  <Box>
                    <strong>Safety Score: {safetyScore.toFixed(1)}</strong>
                    <br />
                    {route.properties?.dangerZones?.length > 0 && (
                      <span>
                        Warning: {route.properties.dangerZones.length} danger
                        zones
                      </span>
                    )}
                  </Box>
                </Popup>
              </Polyline>
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
