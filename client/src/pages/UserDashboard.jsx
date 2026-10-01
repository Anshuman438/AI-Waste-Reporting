import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FiPlusCircle, 
  FiClipboard, 
  FiCheckCircle, 
  FiClock, 
  FiArrowRight, 
  FiShield, 
  FiAward,
  FiActivity
} from "react-icons/fi";
import { LuLeaf, LuRecycle, LuSparkles } from "react-icons/lu";
import "./UserDashboard.css";

import { API } from "../config/api";

const UserDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(`${API}/api/complaints/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const list = res.data || [];
        const resolved = list.filter(c => c.status === "resolved").length;
        const pending = list.filter(c => c.status !== "resolved").length;

        setStats({
          total: list.length,
          resolved,
          pending
        });
      } catch (err) {
        console.error("Stats Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  return (
    <div className="dashboard-container">
      
      {/* Welcome Banner */}
      <div className="dashboard-hero-banner">
        <div className="hero-welcome-text">
          <h1>
            Welcome back, <span>{user?.name || "Citizen"}</span>
          </h1>
          <p>
            Your reports directly contribute to a cleaner, smarter, and greener urban community.
          </p>
        </div>

        <button 
          className="btn-quick-report"
          onClick={() => navigate("/report")}
        >
          <FiPlusCircle size={20} />
          <span>New Waste Report</span>
        </button>
      </div>

      {/* Citizen Stats Cards */}
      <div className="stats-row-grid">
        
        <div className="stat-card">
          <div className="stat-card-icon-bubble primary">
            <FiClipboard size={24} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">My Reports</span>
            <h3 className="stat-card-value">{loading ? "..." : stats.total}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon-bubble success">
            <FiCheckCircle size={24} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">Resolved Issues</span>
            <h3 className="stat-card-value">{loading ? "..." : stats.resolved}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon-bubble warning">
            <FiClock size={24} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">In Progress</span>
            <h3 className="stat-card-value">{loading ? "..." : stats.pending}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon-bubble eco">
            <FiAward size={24} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">Impact Points</span>
            <h3 className="stat-card-value">{stats.total * 50 + stats.resolved * 100} pts</h3>
          </div>
        </div>

      </div>

      {/* Quick Action Navigation Grid */}
      <div className="action-cards-grid">
        
        <div 
          className="action-card-interactive" 
          onClick={() => navigate("/report")}
        >
          <div className="action-card-header">
            <div className="action-icon-badge upload">
              <FiPlusCircle size={26} />
            </div>
            <span className="action-tag">AI Vision</span>
          </div>

          <div className="action-card-body">
            <h3>Report New Waste</h3>
            <p>Upload or take a photo of uncollected garbage. Our AI model will detect the material and tag GPS automatically.</p>
          </div>

          <div className="action-card-footer">
            <span>Launch Camera & Upload</span>
            <FiArrowRight />
          </div>
        </div>

        <div 
          className="action-card-interactive" 
          onClick={() => navigate("/my-complaints")}
        >
          <div className="action-card-header">
            <div className="action-icon-badge history">
              <FiClipboard size={26} />
            </div>
            <span className="action-tag">Live Status</span>
          </div>

          <div className="action-card-body">
            <h3>My Complaint History</h3>
            <p>Track the progress of your submitted complaints from pending triage to municipal resolution.</p>
          </div>

          <div className="action-card-footer">
            <span>View All Records</span>
            <FiArrowRight />
          </div>
        </div>

      </div>

      {/* SDG Goal 11 Card */}
      <div className="sdg-info-banner">
        <div className="sdg-icon-circle">
          <LuRecycle size={30} />
        </div>
        <div className="sdg-content">
          <h4>Why Sustainable Waste Management Matters</h4>
          <p>
            Proper waste segregation reduces greenhouse gas emissions and prevents toxic landfill contamination. By reporting waste through <strong>safAI</strong>, you are helping build sustainable cities and communities (UN SDG 11).
          </p>
        </div>
      </div>

    </div>
  );
};

export default UserDashboard;
