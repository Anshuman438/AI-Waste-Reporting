import React from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">

      {/* NAV STYLE HERO */}
      <section className="hero">

        <div className="hero-left">
          <span className="badge">AI Powered Civic Platform</span>

          <h1>
            Smarter Waste <br />
            <span>Cleaner Cities</span>
          </h1>

          <p>
            AI-driven waste reporting system with real-time tracking,
            live analytics and smart administrative control.
          </p>

          <div className="hero-buttons">
            <button
              className="btn-primary"
              onClick={() => navigate("/login")}
            >
              Get Started
            </button>

            <button
              className="btn-outline"
              onClick={() => navigate("/report")}
            >
              Report Now
            </button>
          </div>

          <div className="hero-stats">
            <div>
              <h3>1200+</h3>
              <p>Complaints Processed</p>
            </div>
            <div>
              <h3>95%</h3>
              <p>Resolution Rate</p>
            </div>
            <div>
              <h3>24/7</h3>
              <p>AI Monitoring</p>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="floating-card card">
            <h4>Live Waste Detection</h4>
            <p>Plastic detected in uploaded image</p>
          </div>

          <div className="floating-glow"></div>
        </div>

      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="feature-card card">
          <h3>AI Classification</h3>
          <p>
            Automatic detection of plastic, metal and biodegradable waste.
          </p>
        </div>

        <div className="feature-card card">
          <h3>Real-Time Dashboard</h3>
          <p>
            Admin panel with complaint tracking, filters and maps.
          </p>
        </div>

        <div className="feature-card card">
          <h3>Analytics Insights</h3>
          <p>
            Visual charts and resolution performance metrics.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta">
        <h2>Build a Cleaner Tomorrow</h2>
        <button
          className="btn-primary"
          onClick={() => navigate("/login")}
        >
          Launch Dashboard
        </button>
      </section>

    </div>
  );
};

export default Landing;
