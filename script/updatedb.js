// scripts/updateIncidentNames.js
require('dotenv').config();
const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const reverseGeocode = require('../utils/reversegeocode');

const MONGO_URI = process.env.MONGODB_URI; // Replace if different

async function updateIncidentNames() {
  await mongoose.connect(MONGO_URI);
  const incidents = await Incident.find({ "location.name": { $in: [null, ''] } });

  for (const incident of incidents) {
    const [lon, lat] = incident.location.coordinates;

    const name = await reverseGeocode(lat, lon);
    incident.location.name = name;
    await incident.save();

    console.log(`Updated incident at ${lat},${lon} => ${name}`);
    await new Promise(res => setTimeout(res, 1000)); // delay to avoid API rate limits
  }

  console.log("✅ All incident names updated.");
  process.exit();
}

updateIncidentNames();
