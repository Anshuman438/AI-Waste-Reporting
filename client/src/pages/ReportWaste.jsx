import React, { useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import axios from "axios";

const ReportWaste = () => {
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  //  Get real GPS location when page loads
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Location error:", error);
          alert("Please allow location access.");
        }
      );
    } else {
      alert("Geolocation not supported in this browser.");
    }
  }, []);

  //  Predict waste type
  const predictImage = async (selectedFile) => {
    setFile(selectedFile);
    setLoading(true);

    const model = await tf.loadLayersModel("/model/model.json");

    const img = document.createElement("img");
    img.src = URL.createObjectURL(selectedFile);

    img.onload = async () => {
      const tensor = tf.browser
        .fromPixels(img)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .expandDims();

      const predictions = await model.predict(tensor).data();

      const classes = ["metal", "plastic", "biodegradable"];
      const highestIndex = predictions.indexOf(Math.max(...predictions));

      setPrediction(classes[highestIndex]);
      setConfidence((predictions[highestIndex] * 100).toFixed(2));

      setLoading(false);
    };
  };

  // 🚀 Submit Complaint
  const handleSubmit = async () => {
    if (!file || !prediction || !location) {
      alert("Please upload image and allow location access.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("image", file);
      formData.append("wasteType", prediction);
      formData.append("description", "Auto detected waste");
      formData.append("location", JSON.stringify(location));

      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/complaints",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Complaint submitted successfully!");

      // Reset state
      setFile(null);
      setPrediction("");
      setConfidence(null);

    } catch (error) {
      console.error(error);
      alert("Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Report Waste</h2>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => predictImage(e.target.files[0])}
      />

      {loading && <p>Processing...</p>}

      {prediction && (
        <h3>
          Predicted: {prediction} ({confidence}% confidence)
        </h3>
      )}

      {location && (
        <p>
          Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!prediction || loading}
        style={{ marginTop: "10px" }}
      >
        Submit Complaint
      </button>
    </div>
  );
};

export default ReportWaste;