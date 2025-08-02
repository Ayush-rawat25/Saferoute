import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import L from "leaflet";

const LocationSender = ({ onClose }) => {
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isBackground, setIsBackground] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const watchIdRef = useRef(null);
  const locationIdRef = useRef(null);

  // Check if we were already tracking
  useEffect(() => {
    const savedLocationId = localStorage.getItem('activeLocationShare');
    if (savedLocationId) {
      locationIdRef.current = savedLocationId;
      setLink(`${window.location.origin}/location/${savedLocationId}`);
      setShowLinkModal(true);
      setLoading(false);
      startLocationTracking(savedLocationId);
    } else {
      generateShareableLink();
    }

    // Handle visibility change
    const handleVisibilityChange = () => {
      setIsBackground(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const startLocationTracking = (locationId) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    locationIdRef.current = locationId;
    setIsTracking(true);
    localStorage.setItem('activeLocationShare', locationId);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await axios.post(`http://localhost:5000/api/location/${locationId}/update`, {
            latitude,
            longitude
          });
        } catch (err) {
          console.error('Error updating location:', err);
        }
      },
      (err) => {
        console.error('Error watching position:', err);
        setError('Error updating location');
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const stopSharing = async () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (locationIdRef.current) {
      try {
        await axios.post(`http://localhost:5000/api/location/${locationIdRef.current}/stop`);
      } catch (err) {
        console.error('Error stopping location share:', err);
      }
    }

    localStorage.removeItem('activeLocationShare');
    setIsTracking(false);
    setMinimized(false);
    handleClose();
  };

  const generateShareableLink = async () => {
    setLoading(true);
    setError('');
    try {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        const response = await axios.post('http://localhost:5000/api/location/share', {
          latitude,
          longitude
        });

        const shareableLink = `${window.location.origin}/location/${response.data.id}`;
        setLink(shareableLink);
        setError('');
        setLoading(false);
        setShowLinkModal(true);
        startLocationTracking(response.data.id);
      }, () => {
        setError('Unable to retrieve your location');
        setLoading(false);
      }, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    } catch (err) {
      setError('Error generating link. Please try again.');
      console.error(err);
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    localStorage.removeItem('activeLocationShare');
    setShowLinkModal(false);
    setMinimized(true);
    onClose();
  };

  const handleMinimize = () => {
    setShowLinkModal(false);
    setMinimized(true);
  };

  const handleMaximize = () => {
    setShowLinkModal(true);
    setMinimized(false);
  };

  if (minimized && isTracking) {
    return (
      <div 
        className="fixed bottom-4 left-4 bg-blue-600 text-white p-4 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 z-50"
        onClick={handleMaximize}
      >
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span>Sharing Location</span>
      </div>
    );
  }

  if (!showLinkModal || !link) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Share Your Location</h2>
        
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Getting your location...</span>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                  <button 
                    onClick={generateShareableLink}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 relative">
        <button 
          onClick={handleMinimize}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        
        <div className="mt-2">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Location Link is Ready!</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Share this link with others:</p>
            <div className="flex">
              <input 
                type="text" 
                value={link} 
                readOnly 
                onClick={(e) => e.target.select()}
                className="flex-1 p-2 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  alert('Link copied to clipboard!');
                }}
                className="px-4 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition duration-200"
              >
                Copy
              </button>
            </div>
            {isTracking && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-green-600 flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Live tracking enabled - your location will update automatically
                </p>
                {isBackground && (
                  <p className="text-sm text-amber-600">
                    ⚠️ App is in background - updates may be less frequent
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  You can minimize this window. Location sharing will continue in the background.
                </p>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-between">
            <button
              onClick={stopSharing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
            >
              Stop Sharing
            </button>
            <button
              onClick={handleMinimize}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Minimize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSender; 