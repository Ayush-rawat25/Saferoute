import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

const RouteSearch = ({ onRouteFound }) => {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const geocodeLocation = async (location) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/geocode?` + new URLSearchParams({ q: location })
      )
      return [
        parseFloat(response.data.lon),
        parseFloat(response.data.lat),
      ];
    } catch (error) {
      console.error(error);
      throw new Error('Failed to geocode location');
    }
  };
  

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const startCoords = await geocodeLocation(startLocation);
      const endCoords = await geocodeLocation(endLocation);

      const response = await axios.post('http://localhost:5000/api/routes', {
        start: startCoords,
        end: endCoords,
      });
      const { routes, bestRouteId } = response.data;

      onRouteFound(
        routes,
        [startCoords[1], startCoords[0]],
        [endCoords[1], endCoords[0]],
        bestRouteId
      );
    } catch (error) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" gutterBottom>
          Find Safe Route
        </Typography>

        <TextField
          label="Start Location"
          value={startLocation}
          onChange={(e) => setStartLocation(e.target.value)}
          fullWidth
          disabled={loading}
        />

        <TextField
          label="Destination"
          value={endLocation}
          onChange={(e) => setEndLocation(e.target.value)}
          fullWidth
          disabled={loading}
        />

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading || !startLocation || !endLocation}
          sx={{ mt: 1 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Find Safe Route'}
        </Button>
      </Box>
    </Paper>
  );
};

export default RouteSearch; 