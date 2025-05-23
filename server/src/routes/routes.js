const express = require('express');
const Incident = require('../models/Incident');
const router = express.Router();
const routeController = require('../controllers/routeController');
const incidentController = require('../controllers/incidentController');

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

// Incident endpoints
router.post('/incidents', incidentController.createIncident);
router.get('/incidents', incidentController.getIncidents);

module.exports = router; 