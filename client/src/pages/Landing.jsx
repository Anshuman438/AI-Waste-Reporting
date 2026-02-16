import React from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">

      {/*hero*/}
      <section className="hero">
        <div className="hero-content">
          <h1>
            AI-Powered Waste <span>Management Platform</span>
          </h1>

          <p>
            Smart civic waste reporting with AI classification,
            real-time tracking, and administrative control.
          </p>

          <div className="hero-actions">
            <button
              className="btn-primary"
              onClick={() => navigate("/login")}
            >
              Get Started
            </button>

            <button
              className="btn-secondary"
              onClick={() => navigate("/report")}
            >
              Report Waste
            </button>
          </div>
        </div>
      </section>

      {/*features*/}
      <section className="features-section">
        <div className="section-header">
          <h2>Core Capabilities</h2>
          <p>Everything needed to manage civic waste efficiently.</p>
        </div>

        <div className="features-grid">

          <div className="feature-box">
            <h3>AI Waste Classification</h3>
            <p>
              Automatically detect plastic, metal, and biodegradable waste
              using trained AI models.
            </p>
          </div>

          <div className="feature-box">
            <h3>Live Complaint Tracking</h3>
            <p>
              Track complaint progress from submission to resolution
              in real time.
            </p>
          </div>

          <div className="feature-box">
            <h3>Admin Analytics Dashboard</h3>
            <p>
              Monitor reports, filter waste types, update status,
              and view map insights.
            </p>
          </div>

        </div>
      </section>

      {/*cta*/}
      <section className="final-cta">
        <div className="cta-box">
          <h2>Build Smarter, Cleaner Cities</h2>
          <p>Start managing waste with AI-driven intelligence.</p>

          <button
            className="btn-primary"
            onClick={() => navigate("/register")}
          >
            Create Account
          </button>
        </div>
      </section>

    </div>
  );
};

export default Landing;
