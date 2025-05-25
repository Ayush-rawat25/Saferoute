import './App.css';
import { useState } from 'react';
import IncidentReport from './components/IncidentReport.js';
import Map from './components/Map.js';
import RouteSearch from './components/RouteSearch.js';


function App() {
  const [open, setOpen] = useState(true); // Set to true to show dialog
  const location = [0, 0]; // Dummy location [lng, lat]
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
  function onMapClick(event) {
    const clickedCoordinates = event.lngLat; // Or similar, depending on map library
    setStartPoint(clickedCoordinates); // Set a new starting point
    // Possibly recalculate routes based on the new point
  }
  
  
  return (
    <>
      {/* <IncidentReport open={open}
        onClose={() => setOpen(false)}
        location={location}/> */}
      <RouteSearch onRouteFound={handleRouteFound}/>
      {routeData && <Map routes={routeData} selectedRoute={selectedRoute} startPoint={startPoint} endPoint={endPoint} onMapClick={onMapClick}/>}
    </>
  );
}

export default App;
