import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [open, setOpen] = useState(false);

  if (!user || user.role === "admin") return null;

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <div className="nav-toggle" onClick={() => setOpen(!open)}>
        <FiMenu />
      </div>

      <div className={`navbar ${open ? "open" : ""}`}>
        <h2 onClick={() => navigate("/")}>
          SaFai <span>withAI</span>
        </h2>

        <div className="nav-links">
          <button onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button onClick={() => navigate("/report")}>Report</button>
          <button onClick={() => navigate("/my-complaints")}>
            My Complaints
          </button>
        </div>

        <button className="btn-logout" onClick={logout}>
          Logout
        </button>
      </div>
    </>
  );
};

export default Navbar;
