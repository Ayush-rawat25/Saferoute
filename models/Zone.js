const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  geometry: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]],  // Array of arrays of coordinates
      required: true
    }
  },
  safetyScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 50
  },
  historicalCrimeCount: {
    type: Number,
    default: 0
  },
  recentIncidents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  }],
  metadata: {
    population: Number,
    lightingScore: {
      type: Number,
      min: 0,
      max: 10
    },
    policePresence: {
      type: Number,
      min: 0,
      max: 10
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
});

// Create a geospatial index on the geometry field
zoneSchema.index({ geometry: '2dsphere' });

// Method to update safety score based on incidents
zoneSchema.methods.updateSafetyScore = function() {
  const baseScore = 100;
  const incidentImpact = this.recentIncidents.length * 5;
  const historicalImpact = this.historicalCrimeCount * 2;
  
  let score = baseScore - incidentImpact - historicalImpact;
  
  // Adjust score based on metadata
  if (this.metadata.lightingScore) {
    score += this.metadata.lightingScore;
  }
  if (this.metadata.policePresence) {
    score += this.metadata.policePresence;
  }
  
  // Ensure score stays within bounds
  this.safetyScore = Math.max(0, Math.min(100, score));
  return this.safetyScore;
};

module.exports = mongoose.model('Zone', zoneSchema); 