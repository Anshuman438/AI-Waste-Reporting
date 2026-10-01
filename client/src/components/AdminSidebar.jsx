import React, { useState } from "react";
import { 
  FiHome, 
  FiLayers, 
  FiLogOut, 
  FiMenu, 
  FiX, 
  FiActivity, 
  FiShield, 
  FiCheckCircle, 
  FiClock,
  FiBox,
  FiArrowLeft,
  FiExternalLink
} from "react-icons/fi";
import { LuLeaf, LuRecycle, LuTrash2 } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

const AdminSidebar = ({ setFilter, active, totalStats = {}, onChangePassword }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSelectFilter = (filterKey) => {
    setFilter(filterKey);
    setOpen(false); // Close on mobile selection
  };

  return (
    <>
      {/* Mobile Sticky Header Bar for Admin */}
      <div className="admin-mobile-bar">
        <div className="mobile-brand" onClick={() => navigate("/")}>
          <div className="mobile-logo-icon">
            <LuLeaf size={18} />
          </div>
          <span>safAI <strong>Admin</strong></span>
        </div>

        <button 
          type="button"
          className="admin-mobile-toggle" 
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation drawer"
        >
          {open ? <span>✕</span> : <span>☰</span>}
        </button>
      </div>

      {/* Backdrop for mobile */}
      <div 
        className={`admin-backdrop ${open ? "active" : ""}`} 
        onClick={() => setOpen(false)} 
      />

      {/* Main Sidebar */}
      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        
        {/* Top Logo */}
        <div className="sidebar-top">
          <div className="admin-logo-wrapper" onClick={() => navigate("/")}>
            <div className="admin-logo-badge">
              <LuLeaf size={22} className="admin-logo-icon" />
            </div>
            <div className="admin-title-group">
              <h2 className="admin-brand-name">safAI</h2>
              <div className="admin-tag">
                🛡️ Control Center
              </div>
            </div>
          </div>
        </div>

        {/* Quick Portal Switch */}
        <div className="sidebar-portal-switch">
          <button 
            type="button" 
            className="btn-switch-public"
            onClick={() => navigate("/")}
          >
            <LuLeaf size={14} />
            <span>View Public Website</span>
          </button>
        </div>

        {/* Categories / Navigation Menu */}
        <div className="sidebar-nav-section">
          <span className="section-label">Waste Type Filter</span>

          <div className="menu-list">
            <button
              type="button"
              className={`menu-btn ${active === "all" ? "active" : ""}`}
              onClick={() => handleSelectFilter("all")}
            >
              <div className="menu-left">
                <LuRecycle className="menu-icon" size={18} />
                <span>All Complaints</span>
              </div>
              {totalStats.all !== undefined && (
                <span className="count-pill">{totalStats.all}</span>
              )}
            </button>

            <button
              type="button"
              className={`menu-btn ${active === "plastic" ? "active" : ""}`}
              onClick={() => handleSelectFilter("plastic")}
            >
              <div className="menu-left">
                <span className="category-dot plastic"></span>
                <span>Plastic</span>
              </div>
              {totalStats.plastic !== undefined && (
                <span className="count-pill">{totalStats.plastic}</span>
              )}
            </button>

            <button
              type="button"
              className={`menu-btn ${active === "metal" ? "active" : ""}`}
              onClick={() => handleSelectFilter("metal")}
            >
              <div className="menu-left">
                <span className="category-dot metal"></span>
                <span>Metal & Cans</span>
              </div>
              {totalStats.metal !== undefined && (
                <span className="count-pill">{totalStats.metal}</span>
              )}
            </button>

            <button
              type="button"
              className={`menu-btn ${active === "biodegradable" || active === "bio" ? "active" : ""}`}
              onClick={() => handleSelectFilter("biodegradable")}
            >
              <div className="menu-left">
                <span className="category-dot bio"></span>
                <span>Biodegradable</span>
              </div>
              {totalStats.biodegradable !== undefined && (
                <span className="count-pill">{totalStats.biodegradable}</span>
              )}
            </button>
          </div>
        </div>

        {/* Quick System Status Card */}
        <div className="sidebar-system-card">
          <div className="system-status-indicator">
            <span className="pulse-dot"></span>
            <strong>AI Engine Active</strong>
          </div>
          <p className="system-sub">TensorFlow.js Computer Vision Connected</p>
        </div>

        {/* Footer Actions: Change Password & Sign Out */}
        <div className="sidebar-bottom">
          {onChangePassword && (
            <button 
              type="button" 
              className="admin-sidebar-action-btn btn-change-pwd" 
              onClick={() => { setOpen(false); onChangePassword(); }}
            >
              <span>🔑 Change Password</span>
            </button>
          )}
          <button type="button" className="admin-logout-btn" onClick={logout}>
            <span>🚪 Sign Out</span>
          </button>
        </div>

      </aside>
    </>
  );
};

export default AdminSidebar;
