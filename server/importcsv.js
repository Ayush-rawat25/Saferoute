const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Incident = require('./src/models/Incident.js');
require('./src/db'); // Connect to DB

const results = [];

fs.createReadStream('transformed_incident_data.csv')
  .pipe(csv())
  .on('data', (data) => {
    const incident = {
      type: data['type'],
      description: data['description'],
      severity: Number(data['severity']),
      location: {
        type: data['location.type'],
        coordinates: JSON.parse(data['location.coordinates'].replace(/'/g, '"')),
      },
      reportedAt: new Date(data['reportedAt']),
      verified: data['verified'] === 'true',
    };
    results.push(incident);
  })
  .on('end', async () => {
    try {
      await Incident.insertMany(results);
      console.log('Data successfully inserted');
      mongoose.connection.close();
    } catch (err) {
      console.error('Error inserting data:', err);
    }
  });
