import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Helper component to ensure Leaflet renders tiles properly on mount
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.invalidateSize();
      map.setView(center, map.getZoom());
    }
  }, [map, center]);
  return null;
};

// Custom SVG pins matching Cleanify design
const createPinMarker = (type, status) => {
  let pinColor = "#ef4444"; // Red for Pending
  let symbol = "!";

  if (status === "in-progress") {
    pinColor = "#f59e0b"; // Orange / Yellow for In Progress
    symbol = "!";
  } else if (status === "resolved") {
    pinColor = "#10b981"; // Green for Resolved
    symbol = "✓";
  }

  const svgHtml = `
    <div style="
      position: relative;
      width: 32px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 3px 6px rgba(0,0,0,0.25));
    ">
      <svg viewBox="0 0 32 38" width="32" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.16344 0 0 7.16344 0 16C0 26 16 38 16 38C16 38 32 26 32 16C32 7.16344 24.8366 0 16 0Z" fill="${pinColor}"/>
        <circle cx="16" cy="15" r="9" fill="#ffffff"/>
      </svg>
      <span style="
        position: absolute;
        top: 6px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 11px;
        font-weight: 900;
        color: ${pinColor};
        font-family: sans-serif;
      ">${symbol}</span>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: "cleanify-map-pin",
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -36],
  });
};

// Default simulated pins around central coordinates for rich visual map
const defaultMapPoints = [
  { _id: "map-p1", lat: 22.5790, lng: 88.3610, wasteType: "Plastic Waste", status: "pending", desc: "Food Court East" },
  { _id: "map-p2", lat: 22.5710, lng: 88.3690, wasteType: "Overflowing Bin", status: "in-progress", desc: "Campus 3 Library" },
  { _id: "map-p3", lat: 22.5650, lng: 88.3580, wasteType: "Biodegradable", status: "resolved", desc: "Main Lawn Garden" },
  { _id: "map-p4", lat: 22.5830, lng: 88.3750, wasteType: "E-Waste", status: "resolved", desc: "Tech Innovation Hub" },
];

const ComplaintMap = ({ complaints = [] }) => {
  const mapRef = useRef(null);

  // Combine real reports with default points if none exist
  const validReportPoints = complaints
    .filter(c => c.location && c.location.lat && c.location.lng)
    .map(c => ({
      _id: c._id,
      lat: c.location.lat,
      lng: c.location.lng,
      wasteType: c.wasteType || "Waste Issue",
      status: c.status || "pending",
      desc: c.description || "Reported Location",
      imageUrl: c.imageUrl
    }));

  const allPoints = validReportPoints.length > 0 ? validReportPoints : defaultMapPoints;
  const centerPos = [22.5726, 88.3639];

  return (
    <div className="cleanify-map-outer-wrap">
      
      {/* Map Component */}
      <MapContainer
        center={centerPos}
        zoom={13}
        style={{ height: "100%", width: "100%", minHeight: "280px" }}
        scrollWheelZoom={false}
        ref={mapRef}
      >
        <MapUpdater center={centerPos} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Current Location Blue Pulse Dot */}
        <Marker
          position={centerPos}
          icon={L.divIcon({
            html: `
              <div style="
                width: 18px;
                height: 18px;
                background: #3b82f6;
                border: 3px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.4);
              "></div>
            `,
            className: "user-loc-dot",
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          })}
        >
          <Popup>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e3a8a" }}>
              📍 Your Current Location
            </div>
          </Popup>
        </Marker>

        {/* Incident Pins */}
        {allPoints.map((item) => (
          <Marker
            key={item._id}
            position={[item.lat, item.lng]}
            icon={createPinMarker(item.wasteType, item.status)}
          >
            <Popup>
              <div style={{ minWidth: "160px", padding: "2px" }}>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt="Waste"
                    style={{
                      width: "100%",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      marginBottom: "6px",
                    }}
                  />
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "13px", color: "#14281d" }}>
                    {item.wasteType}
                  </strong>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    padding: "2px 6px",
                    borderRadius: "999px",
                    background: item.status === "resolved" ? "#dcfce7" : item.status === "in-progress" ? "#fef3c7" : "#fee2e2",
                    color: item.status === "resolved" ? "#15803d" : item.status === "in-progress" ? "#d97706" : "#dc2626"
                  }}>
                    {item.status}
                  </span>
                </div>
                <p style={{ fontSize: "11px", color: "#475569", margin: "0" }}>
                  {item.desc}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Status Legend Inside Map */}
      <div className="cleanify-map-legend">
        <div className="legend-row">
          <span className="legend-dot red">!</span>
          <span>Pending</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot yellow">!</span>
          <span>In Progress</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot green">✓</span>
          <span>Resolved</span>
        </div>
      </div>

    </div>
  );
};

export default ComplaintMap;