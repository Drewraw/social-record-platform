import React, { useEffect, useState } from "react";
import MapView from "./components/MapView.jsx";
import ReportSheet from "./components/ReportSheet.jsx";

export default function App() {
  const [reports, setReports] = useState([]);
  const [open, setOpen] = useState(false);

  const loadReports = async () => {
    const res = await fetch('/api/potholes'); // ✅ Vite proxy handles this
    const data = await res.json();
    setReports(data);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleSubmitted = (r) => {
    setOpen(false);
    setReports([r, ...reports]);
  };

  return (
  <div className="app">
    <MapView reports={reports} />

    {/* Floating report button */}
    <button className="fab" onClick={() => setOpen(true)}>
      📸 Report Pothole
    </button>

    {open && (
      <ReportSheet
        onClose={() => setOpen(false)}
        onSubmitted={handleSubmitted}
      />
    )}
  </div>
);
}
