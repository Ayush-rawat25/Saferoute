import "./App.css";
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Map from "./components/Map.js";
import RouteSearch from "./components/RouteSearch.js";
import LocationReceiver from "./components/LocationReceiver";
import Navbar from "./components/Navbar.js";
import About from "./components/About.js";

function HomePage() {
  const [routeData, setRouteData] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [selectedRoute, setselectedRoute] = useState(null);
  const [bestRouteId, setBestRouteId] = useState(null);

  const handleRouteFound = (routes, startLatLng, endLatLng, bestRouteId) => {
    setRouteData(routes);
    setStartPoint(startLatLng);
    setEndPoint(endLatLng);
    setBestRouteId(bestRouteId);
    const best = routes.find((r) => r.id === bestRouteId);
    setselectedRoute(best);
  };

  const onMapClick = (event) => {
    const clickedCoordinates = event.latlng || event.lngLat; // depends on library
    setStartPoint(clickedCoordinates);
  };

  return (
    <>
      <main className="p-6 bg-indigo-200 min-h-screen">
          <RouteSearch onRouteFound={handleRouteFound} />
          {routeData && (
            <Map
              routes={routeData}
              selectedRoute={selectedRoute}
              startPoint={startPoint}
              endPoint={endPoint}
              onMapClick={onMapClick}
              bestRouteId={bestRouteId}
            />
          )}
      </main>
    </>
  );
}

function App() {
  console.log('App component rendered');
  return (
    <>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/location/:id" element={<LocationReceiver />} />
          <Route path="/about" element={<About/>}/>
        </Routes>
      </Router>
    </>
  );
}

export default App;
