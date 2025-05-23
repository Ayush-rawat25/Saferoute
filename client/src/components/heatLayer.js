// src/components/HeatmapLayer.js
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayer = ({ points = [] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.1: 'blue',
        0.4: 'lime',
        0.7: 'orange',
        1.0: 'red',
      },
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer); // cleanup when unmounted
    };
  }, [map, points]);

  return null;
};

export default HeatmapLayer;
