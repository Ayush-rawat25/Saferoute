const Incident = require('../models/Incident');
const reverseGeocode = require('../utils/reversegeocode');

exports.createIncident = async (req, res) => {
  try {
    const incident = new Incident(req.body);
    await incident.save();
    res.status(201).json(incident);
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(400).json({ error: 'Failed to create incident report' });
  }
};

exports.getIncidents = async (req, res) => {
  try {
    const { lat, lon, radius = 1000 } = req.query; // radius in meters

    const name = await reverseGeocode(lat, lon);

    const query = lat && lon ? {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lon), parseFloat(lat)],
            name,
          },
          $maxDistance: parseInt(radius),
        },
      },
    } : {};

    const incidents = await Incident.find(query)
      .sort({ reportedAt: -1 })
      .limit(100);

    res.json(incidents);
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
}; 
