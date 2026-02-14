import React from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Smarter Waste. <br />
            <span>Cleaner Cities.</span>
          </h1>

          <p>
            AI-powered waste reporting system with real-time
            tracking and analytics dashboard.
          </p>

          <div className="hero-buttons">
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

        <div className="hero-visual"></div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="feature-card card">
          <h3>AI Classification</h3>
          <p>
            Automatic detection of plastic, metal, and biodegradable waste.
          </p>
        </div>

        <div className="feature-card card">
          <h3>Real-Time Tracking</h3>
          <p>
            Track complaint status with admin dashboard visibility.
          </p>
        </div>

        <div className="feature-card card">
          <h3>Analytics Dashboard</h3>
          <p>
            Data-driven insights with visual charts and map integration.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Join the Clean Future</h2>
        <button
          className="btn-primary"
          onClick={() => navigate("/login")}
        >
          Start Now
        </button>
      </section>
    </div>
  );
};

export default Landing;
