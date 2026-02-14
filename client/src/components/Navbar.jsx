import React from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return null;

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="navbar">
      <h2>Waste AI</h2>

      {user.role !== "admin" && (
        <div className="nav-links">
          <button onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button onClick={() => navigate("/report")}>Report</button>
          <button onClick={() => navigate("/my-complaints")}>My Complaints</button>
        </div>
      )}

      <button className="btn-danger" onClick={logout}>Logout</button>
    </div>
  );
};

export default Navbar;
