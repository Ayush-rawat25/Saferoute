const mongoose = require('mongoose');
const Incident = require('./src/models/Incident');
require('./db');

function euclideanDist(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

function calculateCentroids(points, labels, k) {
  const centroids = Array(k).fill(0).map(() => [0, 0]);
  const counts = Array(k).fill(0);

  points.forEach((p, i) => {
    const label = labels[i];
    centroids[label][0] += p[0];
    centroids[label][1] += p[1];
    counts[label]++;
  });

  return centroids.map((sum, i) =>
    counts[i] ? [sum[0] / counts[i], sum[1] / counts[i]] : [Math.random(), Math.random()]
  );
}

function kmeans(points, k = 100, maxIter = 100) {
  const centroids = points.slice(0, k); // initial centroids: first k points
  let labels = Array(points.length).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign clusters
    labels = points.map(p => {
      let minDist = Infinity;
      let label = 0;
      centroids.forEach((c, i) => {
        const dist = euclideanDist(p, c);
        if (dist < minDist) {
          minDist = dist;
          label = i;
        }
      });
      return label;
    });

    // Recompute centroids
    const newCentroids = calculateCentroids(points, labels, k);

    // Check convergence
    const done = centroids.every((c, i) =>
      euclideanDist(c, newCentroids[i]) < 1e-6
    );
    if (done) break;

    for (let i = 0; i < k; i++) centroids[i] = newCentroids[i];
  }

  return { centroids, labels };
}

async function fixClusters(k = 100) {
  try {
    const allIncidents = await Incident.find({}, 'location');

    const coords = allIncidents
      .filter(inc => inc.location?.coordinates?.length === 2)
      .map(inc => [inc.location.coordinates[1], inc.location.coordinates[0]]); // [lat, lon]

    if (coords.length < k) {
      console.error('Not enough points for clustering.');
      return;
    }

    console.log(`Clustering ${coords.length} incidents into ${k} clusters...`);

    const { centroids, labels } = kmeans(coords, k);

    const updates = allIncidents.map((incident, index) => {
      const clusterId = labels[index];
      const [lat, lon] = centroids[clusterId];

      const jitterLat = lat + (Math.random() - 0.5) * 0.005;
      const jitterLon = lon + (Math.random() - 0.5) * 0.005;

      incident.location.coordinates = [jitterLon, jitterLat]; // GeoJSON [lon, lat]
      return incident.save();
    });

    await Promise.all(updates);
    console.log('✅ Clustering fix applied to dataset.');
  } catch (err) {
    console.error('❌ Error during clustering fix:', err);
  } finally {
    mongoose.connection.close();
  }
}

fixClusters();

