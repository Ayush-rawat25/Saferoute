const axios = require("axios");
const Incident = require("../models/Incident");

const INCIDENT_THRESHOLD = 100; // meters

const calculateSafetyScore = (incidents) => {
  if (incidents.length === 0) return 100;

  const weights = {
    harassment: 0.3,
    theft: 0.3,
    poor_lighting: 0.2,
    unsafe_area: 0.1,
    other: 0.1,
  };

  const grouped = {};

  // Deduplicate spatially
  incidents.forEach((incident) => {
    const key = `${incident.location.coordinates[0].toFixed(4)}:${incident.location.coordinates[1].toFixed(4)}`;
    grouped[key] = incident;
  });

  const uniqueIncidents = Object.values(grouped);

  const severityImpact = uniqueIncidents.reduce((total, incident) => {
    const weight = weights[incident.type] || 0.1;
    return total + Math.min(5, incident.severity) * weight;
  }, 0);

  const cappedImpact = Math.min(severityImpact, 10); // limit extreme penalties
  const score = Math.max(0, 100 - cappedImpact * 10);
  return Math.round(score * 10) / 10;
};

const findDangerZones = (incidents) => {
  const zones = [];
  if (incidents.length === 0) return zones;

  incidents.forEach((incident) => {
    const existingZone = zones.find((zone) =>
      isNearby(zone.center, incident.location.coordinates)
    );

    if (existingZone) {
      existingZone.incidents.push(incident);
    } else {
      zones.push({
        center: incident.location.coordinates,
        incidents: [incident],
      });
    }
  });

  return zones.map((zone) => ({
    center: zone.center,
    count: zone.incidents.length,
    severity: Math.round(
      zone.incidents.reduce((sum, inc) => sum + inc.severity, 0) /
        zone.incidents.length
    ),
  }));
};

const isNearby = (point1, point2) => {
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= INCIDENT_THRESHOLD;
};

const generateDetourPoints = (start, end, count = 6, radius = 0.01) => {
  const [lon1, lat1] = start;
  const [lon2, lat2] = end;

  const midLon = (lon1 + lon2) / 2;
  const midLat = (lat1 + lat2) / 2;

  const detours = [];

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count;
    const offsetLat = radius * Math.cos(angle);
    const offsetLon = radius * Math.sin(angle);
    detours.push([midLon + offsetLon, midLat + offsetLat]);
  }

  return detours;
};

exports.calculateRoute = async (req, res) => {
  try {
    const { start, end } = req.body;

    if (
      !start ||
      !end ||
      !Array.isArray(start) ||
      !Array.isArray(end) ||
      start.length !== 2 ||
      end.length !== 2
    ) {
      return res
        .status(400)
        .json({ error: "Invalid start or end coordinates" });
    }

    // Fetch routes with alternatives
    const detours = generateDetourPoints(start, end);
    const routePromises = [];
    
    // Original direct route
    routePromises.push(
      axios.get(`http://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`)
    );
    
    // Routes with detours
    detours.forEach((via) => {
      const url = `http://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${via[0]},${via[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
      routePromises.push(axios.get(url));
    });
    
    const routeResponses = await Promise.allSettled(routePromises);
    
    const allRoutes = routeResponses
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value.data.routes);
    
    const evaluatedRoutes = [];

    for (let i = 0; i < allRoutes.length; i++) {
      const route = allRoutes[i];
      const routeGeometry = route.geometry;
      // Downsample route points for speed (every 10th point)
      const downsampled = routeGeometry.coordinates.filter((_, idx) => idx % 10 === 0);
      // Compute bounding box
      const lats = routeGeometry.coordinates.map(c => c[1]);
      const lngs = routeGeometry.coordinates.map(c => c[0]);
      const minLat = Math.min(...lats) - 0.01;
      const maxLat = Math.max(...lats) + 0.01;
      const minLng = Math.min(...lngs) - 0.01;
      const maxLng = Math.max(...lngs) + 0.01;
      // Query all incidents in this box ONCE
      const incidentsInBox = await Incident.find({
        "location.coordinates.0": { $gte: minLng, $lte: maxLng },
        "location.coordinates.1": { $gte: minLat, $lte: maxLat }
      });
      // For each downsampled route point, check distance to these incidents in-memory
      const allIncidents = [];
      for (const point of downsampled) {
        for (const inc of incidentsInBox) {
          if (isNearby(point, inc.location.coordinates)) {
            allIncidents.push(inc);
          }
        }
      }
      // Remove duplicates
      const incidentsMap = new Map();
      allIncidents.forEach((incident) => {
        incidentsMap.set(incident._id.toString(), incident);
      });
      const incidents = Array.from(incidentsMap.values());

      const safetyScore = calculateSafetyScore(incidents);
      const dangerZones = findDangerZones(incidents);

      evaluatedRoutes.push({
        id: i, // add id for identification
        type: "Feature",
        geometry: routeGeometry,
        properties: {
          distance: route.distance,
          duration: route.duration,
          safetyScore,
          dangerZones,
        },
      });
    }

    // Normalize scores and calculate composite
    const maxDistance = Math.max(...evaluatedRoutes.map(r => r.properties.distance));
    const maxDuration = Math.max(...evaluatedRoutes.map(r => r.properties.duration));

    evaluatedRoutes.forEach((route) => {
      const safetyWeight = 0.7;
      const distanceWeight = 0.15;
      const durationWeight = 0.15;

      const normalizedSafety = route.properties.safetyScore / 100;
      const normalizedDistance = route.properties.distance / maxDistance;
      const normalizedDuration = route.properties.duration / maxDuration;

      const compositeScore =
        safetyWeight * normalizedSafety +
        distanceWeight * (1 - normalizedDistance) +
        durationWeight * (1 - normalizedDuration);

      route.properties.compositeScore = compositeScore;
    });

    evaluatedRoutes.sort((a, b) => b.properties.compositeScore - a.properties.compositeScore);

    // Return all routes and best route id
    res.json({
      routes: evaluatedRoutes,
      bestRouteId: evaluatedRoutes[0].id,
    });

  } catch (error) {
    console.error("Route calculation error:", error);
    res.status(500).json({ error: "Failed to calculate route" });
  }
};

