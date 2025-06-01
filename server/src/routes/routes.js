const express = require('express');
const Incident = require('../models/Incident');
const router = express.Router();
const routeController = require('../controllers/routeController');
const incidentController = require('../controllers/incidentController');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Route endpoints
router.post('/routes', routeController.calculateRoute);

//GET DANGER ZONE
router.get('/danger-zones', async (req, res) => {
    try {
      const incidents = await Incident.find({ type: ['harassment', 'theft', 'poor_lighting', 'unsafe_area', 'other']});
      const points = incidents.filter(inc => Array.isArray(inc.location?.coordinates) && inc.location.coordinates.length === 2)
      .map(incident => ({
        latitude: incident.location.coordinates[1],
        longitude: incident.location.coordinates[0],
        severity: incident.severity || 3, // scale 1-5
      }));
      res.json(points);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch incidents', error: err });
    }
  });
  
  router.get("/geocode", async (req, res) => {
    const { q } = req.query;
  
    if (!q) return res.status(400).json({ error: "Missing location query" });
  
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&email=your_email@example.com`,
        {
          headers: {
            'User-Agent': 'SafeRouteApp/1.0 (rawatayush004@example.com)'
          }
        }
      );
  
      if (response.data.length === 0) {
        return res.status(404).json({ error: "Location not found" });
      }
  
      return res.json(response.data[0]);
    } catch (error) {
      console.error("Geocode error:", error.response?.data || error.message || error);
      return res.status(500).json({ error: "Geocoding failed", details: error.message });
    }
  });
  
  
// Incident endpoints
router.post('/incidents', incidentController.createIncident);
router.get('/incidents', incidentController.getIncidents);


// Location sharing endpoints
const sharedLocations = new Map(); // In-memory store for shared locations
const locationUpdateIntervals = new Map(); // Store for update intervals

router.post('/location/share', (req, res) => {
  const { latitude, longitude } = req.body;
  const id = uuidv4();
  
  sharedLocations.set(id, {
    latitude,
    longitude,
    timestamp: Date.now(),
    isLive: true
  });

  // Set expiration for shared location (24 hours)
  setTimeout(() => {
    sharedLocations.delete(id);
    const interval = locationUpdateIntervals.get(id);
    if (interval) {
      clearInterval(interval);
      locationUpdateIntervals.delete(id);
    }
  }, 24 * 60 * 60 * 1000);

  res.json({ id });
});

router.post('/location/:id/update', (req, res) => {
  const { id } = req.params;
  const { latitude, longitude } = req.body;
  
  if (!sharedLocations.has(id)) {
    return res.status(404).json({ error: 'Location not found' });
  }
  
  sharedLocations.set(id, {
    latitude,
    longitude,
    timestamp: Date.now(),
    isLive: true
  });
  
  res.json({ success: true });
});

router.get('/location/:id', (req, res) => {
  const { id } = req.params;
  const location = sharedLocations.get(id);
  
  if (!location) {
    return res.status(404).json({ error: 'Location not found' });
  }
  
  res.json(location);
});

router.post('/location/:id/stop', (req, res) => {
  const { id } = req.params;
  
  if (!sharedLocations.has(id)) {
    return res.status(404).json({ error: 'Location not found' });
  }
  
  // Update the location to mark it as not live
  const location = sharedLocations.get(id);
  location.isLive = false;
  sharedLocations.set(id, location);
  
  // Clear any existing update interval
  const interval = locationUpdateIntervals.get(id);
  if (interval) {
    clearInterval(interval);
    locationUpdateIntervals.delete(id);
  }
  
  res.json({ success: true });
});

module.exports = router; 