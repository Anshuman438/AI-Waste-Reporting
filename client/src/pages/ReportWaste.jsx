import React, { useState, useEffect } from "react";
import axios from "axios";
import * as tf from "@tensorflow/tfjs";
import "./ReportWaste.css";

const API = import.meta.env.VITE_API_URL;

const ReportWaste = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [success, setSuccess] = useState(false);
  const [model, setModel] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await tf.loadLayersModel("/model/model.json");
      setModel(loadedModel);
    };
    loadModel();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Location error:", error)
      );
    }
  }, []);

  const predictImage = async (selectedFile) => {
    if (!selectedFile || !model) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setLoading(true);
    setSuccess(false);

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
      await axios.post(`${API}/api/complaints`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(true);
      setFile(null);
      setPreview(null);
      setPrediction("");
      setDescription("");

    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  return (
    <div className="report-wrapper">
      <div className="report-card"> 
      <h2 className="main-logo">SaFai <span>withAI</span></h2>
        <h4>AI Waste Detection</h4>
        <p className="report-sub">
          Upload an image and let AI classify the waste automatically.
        </p>

        <div className="form-group">
          <label>Upload Waste Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => predictImage(e.target.files[0])}
          />
        </div>

        {preview && (
          <div className="preview-section">
            <img src={preview} alt="preview" />
          </div>
        )}

        {loading && <div className="loader"></div>}

        {prediction && (
          <div className="prediction-box">
            AI Detected: <span>{prediction}</span>
          </div>
        )}

        <div className="form-group">
          <label>Description (Optional)</label>
          <textarea
            placeholder="Add additional details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          className="submit-btn"
          disabled={!prediction || loading}
          onClick={handleSubmit}
        >
          Submit Complaint
        </button>

        {success && (
          <div className="success-msg">
            Complaint submitted successfully 
          </div>
        )}

      </div>
    </div>
  );
};

export default ReportWaste;
