import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LocationReceiver = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const mapRef = useRef(null);
  const updateIntervalRef = useRef(null);

  console.log('LocationReceiver mounted with id:', id);

  useEffect(() => {
    const fetchLocation = async () => {
      console.log('Fetching location for id:', id);
      try {
        const response = await axios.get(`/api/location/${id}`);
        console.log('Location response:', response.data);
        setLocation(response.data);
        setError('');
        
        // If this is a new location or the map exists, update the view
        if (mapRef.current && response.data) {
          mapRef.current.setView(
            [response.data.latitude, response.data.longitude],
            mapRef.current.getZoom()
          );
        }
      } catch (err) {
        console.error('Error fetching location:', err);
        setError('Error fetching location. The link might be expired or invalid.');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchLocation();

    // Set up polling for updates
    updateIntervalRef.current = setInterval(fetchLocation, 2000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading location...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Location Not Found</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!location) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Shared Location</h1>
            <div className="h-[400px] rounded-lg overflow-hidden mb-4">
              <MapContainer
                center={[location.latitude, location.longitude]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[location.latitude, location.longitude]}>
                  <Popup>
                    Shared Location<br />
                    Last updated: {new Date(location.timestamp).toLocaleString()}
                    {location.isLive && (
                      <div className="mt-2 text-green-600 flex items-center">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        Live tracking
                      </div>
                    )}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => window.open(`https://www.google.com/maps?q=${location.latitude},${location.longitude}`, '_blank')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Open in Google Maps
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationReceiver; 