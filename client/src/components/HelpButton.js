import React, { useState } from 'react';
import LocationSender from './LocationSender';

const HelpButton = ({ position }) => {
  const [showLocationSender, setShowLocationSender] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  const handleClose = () => {
    setShowLocationSender(false);
  };

  const handleEmergencyCall = () => {
    let sended = false;
    setShowButtons(false);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    const latitude = position[0];
    const longitude = position[1];
    if (!{ latitude, longitude }) {
      alert("Location not available yet. Try again in a moment.");
      return;
    }
    if (!sended) {
      sended = true;
      fetch('http://localhost:5000/api/send-help-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude })
      })
        .then(res => res.json())
        .then(data => {
          alert("Help message sent successfully!");
        })
        .catch(err => {
          alert("Failed to send help message.");
          console.error(err);
        });
    }
  }

  return (
    <div className="relative">
      {/* Main Help Button */}
      <button
        onClick={() => setShowButtons(!showButtons)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-4 rounded-full shadow-lg transition duration-200 flex items-center space-x-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8a4 4 0 00-4 4h0a4 4 0 008 0c0-2.21-1.79-4-4-4zm0 0v2m0 4h.01M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        </svg>
        <span>Help</span>


      </button>

      {/* Expandable Buttons */}
      {showButtons && (
        <div className="absolute bottom-full right-0 mb-4 space-y-2 min-w-[200px]">
          {/* Report Incident Button */}
          <button
            onClick={() => {
              setShowButtons(false);
              window.dispatchEvent(new CustomEvent('openIncidentReport', { detail: { position } }));
            }}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg shadow transition duration-200 flex items-center justify-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Report Incident</span>
          </button>

          {/* Emergency Call Button */}
          <button
            onClick={handleEmergencyCall}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow transition duration-200 flex items-center justify-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Emergency Call</span>
          </button>

          {/* Share Location Button */}
          <button
            onClick={() => {
              setShowButtons(false);
              setShowLocationSender(true);
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow transition duration-200 flex items-center justify-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Share Location</span>
          </button>
        </div>
      )}

      {/* Location Sharing Component */}
      {showLocationSender && <LocationSender onClose={handleClose} />}
    </div>
  );
};

export default HelpButton;

