import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const ComplaintMap = ({ complaints }) => {
  const defaultPosition = [22.57, 88.36];

  return (
    <MapContainer
      center={defaultPosition}
      zoom={12}
      style={{ height: "400px", width: "100%", marginBottom: "20px" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {complaints.map((complaint) =>
        complaint.location?.lat ? (
          <Marker
            key={complaint._id}
            position={[
              complaint.location.lat,
              complaint.location.lng,
            ]}
          >
            <Popup>
              <strong>{complaint.wasteType}</strong>
              <br />
              {complaint.status}
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
};

export default ComplaintMap;