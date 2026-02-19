import React, { useState } from "react";
import { FiHome, FiLayers, FiLogOut, FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

const AdminSidebar = ({ setFilter, active }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      {/*mobile toggle*/}
      <div className="mobile-toggle" onClick={() => setOpen(!open)}>
        <FiMenu />
      </div>

      <div className={`sidebar ${open ? "open" : ""}`}>

        {/*logo*/}
        <div className="sidebar-logo" onClick={() => navigate("/admin")}>
          SaFai <span>withAI</span>
          <p className="admin-badge">Admin Panel</p>
        </div>

        {/*menu*/}
        <div className="sidebar-menu">

          <div
            className={`menu-item ${active === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            <FiHome />
            <span>All Complaints</span>
          </div>

          <div
            className={`menu-item ${active === "plastic" ? "active" : ""}`}
            onClick={() => setFilter("plastic")}
          >
            <FiLayers />
            <span>Plastic</span>
          </div>

          <div
            className={`menu-item ${active === "metal" ? "active" : ""}`}
            onClick={() => setFilter("metal")}
          >
            <FiLayers />
            <span>Metal</span>
          </div>

          <div
            className={`menu-item ${active === "bio" ? "active" : ""}`}
            onClick={() => setFilter("bio")}
          >
            <FiLayers />
            <span>Biodegradable</span>
          </div>

        </div>

        {/*footer*/}
        <div className="sidebar-footer" onClick={logout}>
          <FiLogOut />
          <span>Logout</span>
        </div>

      </div>
    </>
  );
};

export default AdminSidebar;
