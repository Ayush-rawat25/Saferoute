import React from "react";
import "./GlobeLoader.css"; // Add styling here

const GlobeLoader = () => {
  return (
    <div className="globe-container">
      <div className="globe" />
      <h2 className="loading-text">Finding Safest Route...</h2>
    </div>
  );
};

export default GlobeLoader;
