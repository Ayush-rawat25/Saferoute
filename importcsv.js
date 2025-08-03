const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const { parseISO, isValid } = require('date-fns');
const Incident = require('./src/models/Incident.js');
require('./db.js'); // Connect to DB

const results = [];

fs.createReadStream('road_incidents_delhi_ncr_filtered.csv')
  .pipe(csv())
  .on('data', (data) => {
    const parsedDate = parseISO(data['reportedAt']);
    if (!isValid(parsedDate)) {
      console.warn(`Skipping row with invalid date: "${data['reportedAt']}"`);
      return;
    }

    const incident = {
      type: data['type'],
      description: data['description'],
      severity: Number(data['severity']),
      location: {
        type: data['location.type'],
        coordinates: [
          parseFloat(data['location.coordinates[0]']),
          parseFloat(data['location.coordinates[1]']),
        ],
        name: data['location.name'] || '',
      },
      reportedAt: parsedDate,
      verified: data['verified'] === 'true',
    };

    results.push(incident);
  })
  .on('end', async () => {
    try {
      await Incident.insertMany(results);
      console.log('Data successfully inserted');
    } catch (err) {
      console.error('Error inserting data:', err);
    } finally {
      mongoose.connection.close();
    }
  });
