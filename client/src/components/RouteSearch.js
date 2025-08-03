import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
} from "@mui/material";
import axios from "axios";
import HeatmapWarnings from "./Heatedpoints";
import GlobeLoader from "./GlobeLoader";

const RouteSearch = ({ onRouteFound }) => {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [affectedAreas, setAffectedAreas] = useState([]);
  const [safetyScore, setsafetyScore] = useState(null);

  const geocodeLocation = async (location) => {
    try {
      const response = await axios.get(
        `https://saferoute-backend-qkyc.onrender.com/api/geocode?` +
          new URLSearchParams({ q: location })
      );
      return [parseFloat(response.data.lon), parseFloat(response.data.lat)];
    } catch (error) {
      console.error(error);
      throw new Error("Failed to geocode location");
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const startCoords = await geocodeLocation(startLocation);
      const endCoords = await geocodeLocation(endLocation);

      const response = await axios.post("https://saferoute-backend-qkyc.onrender.com/api/routes", {
        start: startCoords,
        end: endCoords,
      });

      const { routes, bestRouteId } = response.data;
      const bestRoute = routes.find((r) => r.id === bestRouteId);
      setsafetyScore(bestRoute.properties.safetyScore);

      if (bestRoute) {
        // 👉 Only get danger zones for the selected (best) route
        // const dangerRes = await axios.post(
        //   "https://saferoute-backend-qkyc.onrender.com/api/affected-zones",
        //   {
        //     routeCoords: bestRoute.geometry.coordinates,
        //   }
        // );

        // setAffectedAreas(dangerRes.data);

        // Show the best route
        onRouteFound(
          routes,
          [startCoords[1], startCoords[0]],
          [endCoords[1], endCoords[0]],
          bestRouteId
        );
      }
    } catch (error) {
      console.error(error);
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          backgroundColor: "#e6f4ff", // light blue background
        }}
      >
        <Box
          component="form"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Start
          </Typography>
          <TextField
            variant="outlined"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            fullWidth
            disabled={loading}
            sx={{
              backgroundColor: "#fff",
              borderRadius: 2,
            }}
            InputProps={{
              sx: { borderRadius: 2 },
            }}
          />

          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Destination
          </Typography>
          <TextField
            variant="outlined"
            value={endLocation}
            onChange={(e) => setEndLocation(e.target.value)}
            fullWidth
            disabled={loading}
            sx={{
              backgroundColor: "#fff",
              borderRadius: 2,
            }}
            InputProps={{
              sx: { borderRadius: 2 },
            }}
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
            sx={{
              mt: 2,
              backgroundColor: "#00c8aa", // teal color
              borderRadius: 2,
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: "#00b199",
              },
            }}
          >
            {loading ? (
              <GlobeLoader/>
            ) : (
              "FIND SAFE ROUTE"
            )}
          </Button>
        </Box>
      </Paper>

      {/* 🔥 Show incident warnings */}
      {/* <div className="mb-6 mt-0">
        <HeatmapWarnings
          affectedAreas={affectedAreas}
          safetyScore={safetyScore}
        />
      </div> */}
    </>
  );
};

export default RouteSearch;
