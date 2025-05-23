const axios = require("axios");
const Incident = require("../models/Incident");

// Distance threshold in meters for considering incidents near a route
const INCIDENT_THRESHOLD = 100;

const calculateSafetyScore = (incidents) => {
  if (incidents.length === 0) return 100;

  const weights = {
    harassment: 0.3,
    theft: 0.3,
    poor_lighting: 0.2,
    unsafe_area: 0.1,
    other: 0.1,
  };

  const severityImpact = incidents.reduce((total, incident) => {
    return total + incident.severity * weights[incident.type];
  }, 0);

  // Normalize score between 0 and 100
  const score = Math.max(0, 100 - severityImpact * 10);
  return Math.round(score * 10) / 10; // Round to 1 decimal place
};

const findDangerZones = (incidents) => {
  const zones = [];
  if (incidents.length === 0) return zones;

  // Group nearby incidents
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
  // Simple distance check (can be improved with proper geodesic calculations)
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= INCIDENT_THRESHOLD;
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

    // Get route from OpenStreetMap (using OSRM)
    const routeResponse = await axios.get(
      `http://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson`
    );

    const route = routeResponse.data.routes[0];
    const routeGeometry = route.geometry;

    // Find incidents near each point along the route
    const allIncidents = [];

    for (const point of routeGeometry.coordinates) {
      const nearbyIncidents = await Incident.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: point,
            },
            $maxDistance: INCIDENT_THRESHOLD, // e.g., 100 meters
          },
        },
      });

      allIncidents.push(...nearbyIncidents);
    }

    // Remove duplicates (based on _id)
    const incidentsMap = new Map();
    allIncidents.forEach((incident) => {
      incidentsMap.set(incident._id.toString(), incident);
    });
    const incidents = Array.from(incidentsMap.values());

    const safetyScore = calculateSafetyScore(incidents);
    const dangerZones = findDangerZones(incidents);

    res.json({
      type: "Feature",
      geometry: routeGeometry,
      properties: {
        distance: route.distance,
        duration: route.duration,
        safetyScore,
        dangerZones,
      },
    });
  } catch (error) {
    console.error("Route calculation error:", error);
    res.status(500).json({ error: "Failed to calculate route" });
  }
};
