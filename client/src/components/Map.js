import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Paper } from "@mui/material";
import HeatmapLayer from "./heatLayer";
import axios from "axios";

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Helper to get route id
const getRouteId = (route, index) => route.id ?? index;

const Map = ({
  routes = [],
  selectedRoute,
  startPoint,
  endPoint,
  onMapClick,
}) => {
  const [map, setMap] = useState(null);
  const [dangerZones, setDangerZones] = useState([]);

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
    if (map && selectedRoute && selectedRoute.geometry?.coordinates) {
      const latLngs = selectedRoute.geometry.coordinates.map((coord) => [
        coord[1],
        coord[0],
      ]);
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, selectedRoute]);


  const getRouteColor = (safetyScore) => {
    if (safetyScore >= 80) return "blue";
    if (safetyScore >= 50) return "orange";
    return "red";
  };

  return (
    <Paper elevation={3} sx={{ height: "70vh", width: "100%" }}>
      <MapContainer
        center={startPoint || [20.5937, 78.9629]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        whenCreated={setMap}
        onClick={onMapClick}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <HeatmapLayer points={dangerZones} />

        {routes.map((route, index) => {
          const routeId = getRouteId(route, index);
          const safetyScore = route.properties?.safetyScore ?? 0;

          if (!route.geometry?.coordinates) return null;

          const isSelected = selectedRoute && getRouteId(selectedRoute) === routeId;

          return (
            <Polyline
              key={`${routeId}-${safetyScore}`}
              positions={route.geometry.coordinates.map((coord) => [coord[1], coord[0]])}
              color={getRouteColor(safetyScore)}
              weight={isSelected ? 6 : 3}
              opacity={isSelected ? 1 : 0.3}
            >
              <Popup>
                <Box>
                  <strong>Safety Score: {safetyScore.toFixed(1)}</strong>
                  <br />
                  {route.properties?.dangerZones?.length > 0 && (
                    <span>
                      Warning: {route.properties.dangerZones.length} danger zones
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
  );
};

export default Map;
