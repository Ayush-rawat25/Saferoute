import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Paper } from '@mui/material';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Map = ({ routes, selectedRoute, onRouteSelect, startPoint, endPoint, onMapClick }) => {
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (map && startPoint && endPoint) {
      const bounds = L.latLngBounds([startPoint, endPoint]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, startPoint, endPoint]);

  const getRouteColor = (safetyScore) => {
    if (safetyScore >= 80) return '#4CAF50';
    if (safetyScore >= 60) return '#FFC107';
    if (safetyScore >= 40) return '#FF9800';
    return '#F44336';
  };

  return (
    <Paper elevation={3} sx={{ height: '70vh', width: '100%' }}>
      <MapContainer
        center={[20.5937, 78.9629]} // Center of India
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        whenCreated={setMap}
        onClick={onMapClick}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {routes.map((route, index) => (
          <Polyline
            key={index}
            positions={route.geometry.coordinates.map(coord => [coord[1], coord[0]])}
            color={getRouteColor(route.properties.safetyScore)}
            weight={selectedRoute === route ? 6 : 3}
            opacity={selectedRoute === route ? 1 : 0.6}
            onClick={() => onRouteSelect(route)}
          >
            <Popup>
              <Box>
                <strong>Safety Score: {route.properties.safetyScore.toFixed(1)}</strong>
                <br />
                {route.properties.dangerZones.length > 0 && (
                  <span>Warning: {route.properties.dangerZones.length} danger zones</span>
                )}
              </Box>
            </Popup>
          </Polyline>
        ))}

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