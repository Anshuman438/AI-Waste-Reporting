import React, { useState, useEffect } from "react";
import axios from "axios";
import * as tf from "@tensorflow/tfjs";
import "./ReportWaste.css";

const ReportWaste = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [success, setSuccess] = useState(false);

  // Get real GPS location
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
        }
      );
    }
  }, []);

  const predictImage = async (selectedFile) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setLoading(true);
    setSuccess(false);

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
      const highestIndex = predictions.indexOf(
        Math.max(...predictions)
      );

      setPrediction(classes[highestIndex]);
      setLoading(false);
    };
  };

  const handleSubmit = async () => {
    if (!file || !prediction) return;

    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("wasteType", prediction);
    formData.append("description", description);
    formData.append("location", JSON.stringify(location));

    try {
      await axios.post(
      `${import.meta.env.VITE_API_URL}/api/complaints`,
      formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(true);
      setFile(null);
      setPreview(null);
      setPrediction("");
      setDescription("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="report-wrapper">
      <div className="glass-card report-card">
        <h2>Report Waste</h2>

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            predictImage(e.target.files[0])
          }
        />

        {preview && (
          <img
            src={preview}
            alt="preview"
            className="preview-img"
          />
        )}

        {loading && <div className="loader"></div>}

        {prediction && (
          <p className="prediction">
            AI Detected: {prediction}
          </p>
        )}

        <textarea
          placeholder="Describe the issue..."
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />

        <button
          className="orange-btn"
          disabled={!prediction || loading}
          onClick={handleSubmit}
        >
          Submit Complaint
        </button>

        {success && (
          <p className="success-msg">
            Complaint submitted successfully!
          </p>
        )}
      </div>
    </div>
  );
};

export default ReportWaste;
