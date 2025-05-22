const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const incidentController = require('../controllers/incidentController');

// Route endpoints
router.post('/routes', routeController.calculateRoute);

// Incident endpoints
router.post('/incidents', incidentController.createIncident);
router.get('/incidents', incidentController.getIncidents);

module.exports = router; 