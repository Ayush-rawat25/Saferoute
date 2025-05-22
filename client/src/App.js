import './App.css';
import { useState } from 'react';
import IncidentReport from './components/IncidentReport.js';


function App() {
  const [open, setOpen] = useState(true); // Set to true to show dialog
  const location = [0, 0]; // Dummy location [lng, lat]
  return (
    <>
      <IncidentReport open={open}
        onClose={() => setOpen(false)}
        location={location}/>
    </>
  );
}

export default App;
