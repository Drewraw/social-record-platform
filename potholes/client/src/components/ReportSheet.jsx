import React, { useEffect, useRef, useState } from "react";

export default function ReportSheet({ apiBase, onClose, onSubmitted }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [coords, setCoords] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [desc, setDesc] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setCoords(pos.coords),
      () => alert("Please allow location access"),
      { enableHighAccuracy: true }
    );

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(s => (videoRef.current.srcObject = s))
      .catch(() => alert("Please allow camera access"));

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(
      b => {
        setPhoto(b);
        setPreview(URL.createObjectURL(b));
      },
      "image/jpeg",
      0.8
    );
  };

  const submit = async () => {
    if (!coords) return alert("GPS not ready");
    if (!photo) return alert("Take a photo first");
    setSending(true);

    const fd = new FormData();
    fd.append("photo", photo, "pothole.jpg");
    fd.append("lat", coords.latitude);
    fd.append("lng", coords.longitude);
    fd.append("description", desc);

    try {
      const res = await fetch(`${apiBase}/api/potholes`, {
        method: "POST",
        body: fd
      });
      const json = await res.json();
      onSubmitted(json);
    } catch (e) {
      alert("Upload failed: " + e.message);
    } finally {
      setSending(false);
      onClose();
    }
  };

  return (
    <div className="report-panel">
      <div className="report-header">
        <h2>📸 Report a Pothole</h2>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      <div className="coords">
        {coords
          ? `📍 ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
          : "Fetching GPS..."}
      </div>

      {!preview && (
        <video ref={videoRef} autoPlay playsInline className="camera-preview"></video>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {preview && <img src={preview} className="photo-preview" alt="pothole" />}

      <div className="actions">
        {!preview ? (
          <button onClick={capture} className="btn btn-secondary">
            📸 Take Photo
          </button>
        ) : (
          <button onClick={() => setPreview("")} className="btn btn-secondary">
            ↩ Retake
          </button>
        )}
        <label className="btn btn-secondary">
          Upload
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => {
              const f = e.target.files[0];
              if (f) {
                setPhoto(f);
                setPreview(URL.createObjectURL(f));
              }
            }}
          />
        </label>
      </div>

      <textarea
        rows="3"
        placeholder="Short description..."
        value={desc}
        onChange={e => setDesc(e.target.value)}
      />

      <button onClick={submit} className="btn btn-primary" disabled={sending}>
        {sending ? "Sending..." : "Send Report 🟠"}
      </button>

      <p className="note">Photos are stored locally on the server</p>
    </div>
  );
}
