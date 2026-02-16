import React from "react";
import { useNavigate } from "react-router-dom";
import { FiPlusCircle, FiClipboard } from "react-icons/fi";
import "./UserDashboard.css";

const UserDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="dashboard-wrapper">

      {/*header*/}
      <div className="dashboard-header-box">
        <h1>
          Welcome back, <span>{user?.name}</span>
        </h1>
        <p>
          Your actions contribute to cleaner and more sustainable cities.
        </p>
      </div>

      {/*impact stats*/}
      <div className="impact-section">
        <div className="impact-card">
          <h3>Reduce Urban Waste</h3>
          <p>
            Timely reporting helps reduce environmental pollution
            and improves community hygiene.
          </p>
        </div>

        <div className="impact-card">
          <h3>Support Sustainable Development</h3>
          <p>
            Responsible waste management aligns with global
            Sustainable Development Goals (SDGs).
          </p>
        </div>

        <div className="impact-card">
          <h3>Promote Smart Cities</h3>
          <p>
            AI-driven monitoring enables faster municipal response
            and smarter civic infrastructure.
          </p>
        </div>
      </div>

      {/*action cards*/}
      <div className="dashboard-grid">

        <div
          className="dashboard-card"
          onClick={() => navigate("/report")}
        >
          <div className="card-icon">
            <FiPlusCircle size={24} />
          </div>

          <div className="card-content">
            <h3>Report Waste</h3>
            <p>
              Upload waste images and let AI classify instantly.
            </p>
          </div>
        </div>

        <div
          className="dashboard-card"
          onClick={() => navigate("/my-complaints")}
        >
          <div className="card-icon">
            <FiClipboard size={24} />
          </div>

          <div className="card-content">
            <h3>My Complaints</h3>
            <p>
              View and track your submitted reports.
            </p>
          </div>
        </div>

      </div>

      {/*eco note*/}
      <div className="eco-box">
        <h2>Why Sustainable Waste Management Matters</h2>
        <p>
          Effective waste management reduces greenhouse gas emissions,
          prevents soil and water contamination, and protects biodiversity.
          By using AI-powered civic systems, communities can build
          cleaner, safer, and more sustainable urban environments.
        </p>
      </div>

    </div>
  );
};

export default UserDashboard;
