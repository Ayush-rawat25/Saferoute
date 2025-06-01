import './App.css';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Map from './components/Map.js';
import RouteSearch from './components/RouteSearch.js';
import LocationReceiver from './components/LocationReceiver';

function HomePage() {
  const [routeData, setRouteData] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [selectedRoute, setselectedRoute] = useState(null);

  const handleRouteFound = (routes, startLatLng, endLatLng, bestRouteId) => {
    setRouteData(routes);
    setStartPoint(startLatLng);
    setEndPoint(endLatLng);
    const best = routes.find(r => r.id === bestRouteId);
    setselectedRoute(best);
  };

  const onMapClick = (event) => {
    const clickedCoordinates = event.latlng || event.lngLat; // depends on library
    setStartPoint(clickedCoordinates);
  };

  return (
    <>
      <RouteSearch onRouteFound={handleRouteFound} />
      {routeData && (
        <Map
          routes={routeData}
          selectedRoute={selectedRoute}
          startPoint={startPoint}
          endPoint={endPoint}
          onMapClick={onMapClick}
        />
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/location/:id" element={<LocationReceiver />} />
      </Routes>
    </Router>
  );
}

export default App;
