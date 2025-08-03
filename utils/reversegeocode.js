// utils/reverseGeocode.js

const axios = require('axios');

async function reverseGeocode(lat, lon) {
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: {
        lat,
        lon,
        format: "json",
      },
      headers: {
        "User-Agent": "SafeRoute-App/1.0", // required
      },
    });

    return response.data.display_name || 'Unknown Area';
  } catch (error) {
    console.error("Reverse geocode error:", error.message);
    return 'Unknown Area';
  }
}

module.exports = reverseGeocode;
