const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const { parse, isValid } = require('date-fns');
const Incident = require('./src/models/Incident.js');
require('./src/db'); // Connect to DB

const results = [];

fs.createReadStream('updated_crime_data.csv')
  .pipe(csv())
  .on('data', (data) => {
    // Parse date in "dd-MM-yyyy HH:mm" format
    const parsedDate = parse(data['reportedAt'], 'dd-MM-yyyy HH:mm', new Date());

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
        coordinates: JSON.parse(data['location.coordinates'].replace(/'/g, '"')),
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
