import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FiCrosshair, FiMaximize2, FiExternalLink, FiMapPin, FiCalendar } from "react-icons/fi";
import "./ComplaintMap.css";

// Fix default Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Map Controller for Dynamic Auto-Bounds and Camera Control
const MapController = ({ points = [], userLoc = null, triggerFit = 0, triggerLocate = 0 }) => {
  const map = useMap();
  const hasFittedRef = useRef(false);

  // Invalidate size on mount to prevent gray/unrendered tiles
  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  // Fit bounds to show all pins accurately whenever points change
  useEffect(() => {
    if (!map) return;
    if (points.length > 0) {
      if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], 15, { animate: true });
      } else {
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16, animate: true });
      }
      hasFittedRef.current = true;
    } else if (userLoc && !hasFittedRef.current) {
      map.setView([userLoc.lat, userLoc.lng], 14, { animate: true });
      hasFittedRef.current = true;
    }
  }, [map, points, userLoc, triggerFit]);

  // Handle explicit Locate Me trigger
  useEffect(() => {
    if (!map || !userLoc || triggerLocate === 0) return;
    map.setView([userLoc.lat, userLoc.lng], 16, { animate: true });
  }, [map, userLoc, triggerLocate]);

  return null;
};

// Custom SVG Pin Generator matching Royal/Cleanify aesthetic
const createIncidentPin = (wasteType, status) => {
  let pinColor = "#ef4444"; // Red for Pending
  let symbol = "!";

  if (status === "in-progress") {
    pinColor = "#f59e0b"; // Amber/Orange for In Progress
    symbol = "🚚";
  } else if (status === "resolved") {
    pinColor = "#10b981"; // Emerald Green for Resolved
    symbol = "✓";
  }

  const svgHtml = `
    <div style="
      position: relative;
      width: 34px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.30));
    ">
      <svg viewBox="0 0 34 42" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 17 42 17 42C17 42 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="${pinColor}"/>
        <circle cx="17" cy="16" r="10" fill="#ffffff"/>
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
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">${symbol}</span>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: "cleanify-map-pin",
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -40],
  });
};

// User Live Pulse Icon
const userPulseIcon = L.divIcon({
  html: `
    <div class="user-pulse-marker">
      <div class="user-pulse-ring"></div>
      <div class="user-pulse-dot"></div>
    </div>
  `,
  className: "user-loc-marker-wrapper",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Available Tile Providers (High-Quality Google Maps & OSM)
const TILE_LAYERS = {
  google_roadmap: {
    id: "google_roadmap",
    name: "🗺️ Google Map",
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
    attribution: "&copy; Google Maps",
  },
  google_satellite: {
    id: "google_satellite",
    name: "🛰️ Satellite",
    url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
    attribution: "&copy; Google Maps Satellite",
  },
  osm: {
    id: "osm",
    name: "🌍 Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: ["a", "b", "c"],
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
};

const ComplaintMap = ({ complaints = [] }) => {
  const [selectedLayer, setSelectedLayer] = useState("google_roadmap");
  const [userLocation, setUserLocation] = useState(null);
  const [triggerFit, setTriggerFit] = useState(0);
  const [triggerLocate, setTriggerLocate] = useState(0);

  // Fetch actual browser GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("Map GPS notice:", err.message);
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    }
  }, []);

  // Parse and validate all complaint coordinates
  const validPoints = useMemo(() => {
    return complaints
      .map((c) => {
        const rawLat = c.location?.lat ?? c.lat;
        const rawLng = c.location?.lng ?? c.lng;
        const lat = parseFloat(rawLat);
        const lng = parseFloat(rawLng);

        // Discard invalid coordinates
        if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
          return null;
        }
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return null;
        }

        const id = String(c._id || c.id || Math.random());
        const address = c.location?.address || c.locationName || "Reported Civic Area";
        const wasteType = (c.wasteType || "mixed").toLowerCase();
        const status = (c.status || "pending").toLowerCase();
        const desc = c.description || "Civic waste reported via safAI AI Neural Triage.";
        const imageUrl = c.imageUrl || c.image || "";
        const createdAt = c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) : "Recently";

        return {
          id,
          lat,
          lng,
          wasteType,
          status,
          desc,
          address,
          imageUrl,
          createdAt,
          reportedByName: c.reportedBy?.name || "Citizen Reporter",
        };
      })
      .filter(Boolean);
  }, [complaints]);

  // Compute sensible initial center: either first complaint, user location, or default
  const defaultCenter = useMemo(() => {
    if (validPoints.length > 0) {
      return [validPoints[0].lat, validPoints[0].lng];
    }
    if (userLocation) {
      return [userLocation.lat, userLocation.lng];
    }
    // Neutral fallback
    return [20.3640, 85.8154];
  }, [validPoints, userLocation]);

  const activeTileConfig = TILE_LAYERS[selectedLayer] || TILE_LAYERS.google_roadmap;

  return (
    <div className="cleanify-map-outer-wrap">
      
      {/* Top Map Action Bar */}
      <div className="map-top-controls">
        {/* Layer Switcher */}
        <div className="map-layer-switcher">
          {Object.values(TILE_LAYERS).map((layer) => (
            <button
              key={layer.id}
              type="button"
              className={`map-layer-btn ${selectedLayer === layer.id ? "active" : ""}`}
              onClick={() => setSelectedLayer(layer.id)}
            >
              <span>{layer.name}</span>
            </button>
          ))}
        </div>

        {/* Recenter / Fit All Pins Button */}
        {validPoints.length > 0 && (
          <button
            type="button"
            className="map-action-icon-btn"
            onClick={() => setTriggerFit((prev) => prev + 1)}
            title="Fit all reported pins on map"
          >
            <FiMaximize2 size={15} />
          </button>
        )}

        {/* Locate User Button */}
        {userLocation && (
          <button
            type="button"
            className="map-action-icon-btn"
            onClick={() => setTriggerLocate((prev) => prev + 1)}
            title="Locate my position"
          >
            <FiCrosshair size={16} />
          </button>
        )}
      </div>

      {/* Core Leaflet Container */}
      <MapContainer
        center={defaultCenter}
        zoom={validPoints.length > 0 ? 14 : 12}
        style={{ height: "100%", width: "100%", minHeight: "380px" }}
        scrollWheelZoom={true}
      >
        <MapController
          points={validPoints}
          userLoc={userLocation}
          triggerFit={triggerFit}
          triggerLocate={triggerLocate}
        />

        {/* Active Tile Layer with subdomains */}
        <TileLayer
          key={activeTileConfig.id}
          url={activeTileConfig.url}
          subdomains={activeTileConfig.subdomains}
          maxZoom={activeTileConfig.maxZoom}
          attribution={activeTileConfig.attribution}
        />

        {/* Live GPS User Location Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userPulseIcon}>
            <Popup>
              <div style={{ padding: "6px 8px", fontSize: "12px", fontWeight: "700", color: "#1e3a8a" }}>
                📍 You Are Here
              </div>
            </Popup>
          </Marker>
        )}

        {/* Real Complaint Markers */}
        {validPoints.map((item) => (
          <Marker
            key={item.id}
            position={[item.lat, item.lng]}
            icon={createIncidentPin(item.wasteType, item.status)}
          >
            <Popup>
              <div className="map-popup-card">
                {/* Media Banner */}
                {item.imageUrl && (
                  <div className="map-popup-media">
                    <img src={item.imageUrl} alt="Incident" className="map-popup-img" />
                    <div className="map-popup-badge-overlay">
                      <span style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        textTransform: "capitalize",
                        padding: "3px 8px",
                        borderRadius: "999px",
                        background: "rgba(13, 56, 43, 0.90)",
                        color: "#ffffff"
                      }}>
                        {item.wasteType}
                      </span>
                    </div>
                  </div>
                )}

                {/* Details Body */}
                <div className="map-popup-body">
                  <div className="map-popup-title">
                    <span>REF #{item.id.slice(-6)}</span>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: "800",
                      textTransform: "uppercase",
                      padding: "2px 7px",
                      borderRadius: "999px",
                      background: item.status === "resolved" ? "#dcfce7" : item.status === "in-progress" ? "#fef3c7" : "#fee2e2",
                      color: item.status === "resolved" ? "#15803d" : item.status === "in-progress" ? "#b45309" : "#b91c1c"
                    }}>
                      {item.status}
                    </span>
                  </div>

                  <p className="map-popup-desc">{item.desc}</p>

                  <div className="map-popup-location">
                    <FiMapPin size={12} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.address}
                    </span>
                  </div>

                  {/* Footer with Google Maps Turn-by-Turn Link */}
                  <div className="map-popup-footer">
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {item.createdAt}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-gmaps-link"
                      title="Open coordinates in Google Maps"
                    >
                      <FiExternalLink size={12} />
                      <span>Google Maps</span>
                    </a>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Status Legend */}
      <div className="cleanify-map-legend">
        <div className="legend-row">
          <span className="legend-dot red">!</span>
          <span>Pending</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot yellow">🚚</span>
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