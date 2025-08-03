const express = require("express");
const Incident = require("../models/Incident");
const router = express.Router();
const routeController = require("../controllers/routeController");
const incidentController = require("../controllers/incidentController");
const axios = require("axios");
const nodemailer = require('nodemailer');
require('dotenv').config();
const reverseGeocode = require('../utils/reversegeocode'); // adjust path as needed
const { v4: uuidv4 } = require('uuid');
const Location = require('../models/Location');

// Route endpoints
router.post("/routes", routeController.calculateRoute);

//Affected Zones
router.post("/affected-zones", async (req, res) => {
  const { routeCoords } = req.body;

  if (!routeCoords || !Array.isArray(routeCoords)) {
    return res.status(400).json({ error: "Invalid route coordinates" });
  }

  try {
    const RADIUS = 200;
    const incidentSet = new Set();

    for (const point of routeCoords) {
      const nearby = await Incident.find({
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: point },
            $maxDistance: RADIUS,
          },
        },
      });

      nearby.forEach((inc) => incidentSet.add(inc._id.toString()));
    }

    const incidents = await Incident.find({ _id: { $in: Array.from(incidentSet) } });

    // Clustering
    const cache = {};
    const uniqueMap = {};

    for (const inc of incidents) {
      const [lon, lat] = inc.location.coordinates;
      const cacheKey = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
      let name;

      if (cache[cacheKey]) {
        name = cache[cacheKey];
      } else {
        name = await reverseGeocode(lat, lon);
        cache[cacheKey] = name || "Unknown Area";
      }

      if (!uniqueMap[name]) {
        uniqueMap[name] = {
          latitude: lat,
          longitude: lon,
          severity: inc.severity,
          name,
          count: 1,
        };
      } else {
        uniqueMap[name].severity += inc.severity;
        uniqueMap[name].count++;
      }
    }

    const clustered = Object.values(uniqueMap).map((loc) => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
      name: loc.name,
      severity: Math.round(loc.severity / loc.count),
    }));

    res.json(clustered);
  } catch (err) {
    console.error("Error finding affected zones:", err);
    res.status(500).json({ error: "Server error" });
  }
});




//GET DANGER ZONE
router.get("/danger-zones", async (req, res) => {
  try {
    const incidents = await Incident.find({
      type: ["harassment", "theft", "poor_lighting", "unsafe_area", "other"],
    });
    const points = incidents
      .filter(
        (inc) =>
          Array.isArray(inc.location?.coordinates) &&
          inc.location.coordinates.length === 2
      )
      .map((incident) => ({
        latitude: incident.location.coordinates[1],
        longitude: incident.location.coordinates[0],
        name: incident.location.name,
        severity: incident.severity || 3, // scale 1-5
      }));
    res.json(points);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch incidents", error: err });
  }
});

router.get("/geocode", async (req, res) => {
  const { q } = req.query;

  if (!q) return res.status(400).json({ error: "Missing location query" });

  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}&email=your_email@example.com`,
      {
        headers: {
          "User-Agent": "SafeRouteApp/1.0 (rawatayush004@example.com)",
        },
      }
    );

    if (response.data.length === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    return res.json(response.data[0]);
  } catch (error) {
    console.error(
      "Geocode error:",
      error.response?.data || error.message || error
    );
    return res
      .status(500)
      .json({ error: "Geocoding failed", details: error.message });
  }
});

// Incident endpoints
router.post("/incidents", incidentController.createIncident);
router.get("/incidents", incidentController.getIncidents);


router.post("/location/share", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const newLocation = await Location.create({ latitude, longitude, isLive: true });
    res.json({ id: newLocation._id });
  } catch (error) {
    console.error("Error sharing location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update live location
router.post("/location/:id/update", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const updatedLocation = await Location.findByIdAndUpdate(
      req.params.id,
      { latitude, longitude, timestamp: Date.now(), isLive: true },
      { new: true }
    );
    if (!updatedLocation) {
      return res.status(404).json({ error: "Location not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get location
router.get("/location/:id", async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }
    res.json(location);
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Stop sharing
router.post("/location/:id/stop", async (req, res) => {
  try {
    const stoppedLocation = await Location.findByIdAndUpdate(
      req.params.id,
      { isLive: false },
      { new: true }
    );
    if (!stoppedLocation) {
      return res.status(404).json({ error: "Location not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error stopping location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/send-help-email", async (req, res) => {
  const { latitude, longitude } = req.body;
  if (!latitude || !longitude) {
    return res.status(400).json({ error: "Location missing" });
  }

  const locationLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"SafeRoute Alert" <${process.env.EMAIL_USER}>`,
    to: process.env.TO_EMAIL,
    subject: "🚨 SOS Alert from SafeRoute",
    text: `An anonymous user requested help.
          Location: https://www.google.com/maps?q=${latitude},${longitude}
          Latitude: ${latitude}
          Longitude: ${longitude}
          Time: ${new Date().toLocaleString()}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Alert email sent" });
  } catch (error) {
    console.error("Email send error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

module.exports = router;
