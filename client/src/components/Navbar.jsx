import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  FiBell, 
  FiChevronDown, 
  FiLogOut, 
  FiUser, 
  FiCamera,
  FiHome,
  FiAward,
  FiShield,
  FiLogIn,
  FiUserPlus
} from "react-icons/fi";
import { LuLeaf } from "react-icons/lu";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const navRef = useRef(null);

  // Sync auth state reactively on route changes and storage events
  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (savedUser && token) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, [location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Click outside listener for mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside, { passive: true });
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = (e) => {
    e?.stopPropagation();
    setMobileMenuOpen((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setMobileMenuOpen(false);
    window.dispatchEvent(new Event("storage"));
    navigate("/login");
  };

  const handleNav = (path, targetId = null) => {
    setMobileMenuOpen(false);
    if (path === "/" && targetId) {
      if (location.pathname === "/") {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate(`/#${targetId}`);
      }
      return;
    }
    navigate(path);
  };

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/" && !location.hash) return true;
    return location.pathname === path;
  };

  return (
    <header className="cleanify-navbar" ref={navRef}>
      <div className="cleanify-nav-container">
        
        {/* Brand Logo */}
        <div 
          className="cleanify-brand" 
          onClick={() => handleNav("/")}
          style={{ cursor: "pointer" }}
        >
          <div className="cleanify-logo-icon">
            <LuLeaf size={24} />
          </div>
          <div className="cleanify-brand-text">
            <span className="cleanify-brand-title">safAI</span>
            <span className="cleanify-brand-sub">Clean Today, Greener Tomorrow</span>
          </div>
        </div>

        {/* Center Pill Navigation Links (Laptop / Desktop) */}
        <nav className="cleanify-center-nav">
          <button 
            type="button"
            className={`cleanify-nav-pill ${isActive("/") ? "active" : ""}`}
            onClick={() => handleNav("/")}
          >
            Home
          </button>

          <button 
            type="button"
            className={`cleanify-nav-pill ${isActive("/report") ? "active" : ""}`}
            onClick={() => handleNav("/report")}
          >
            Report
          </button>

          <button 
            type="button"
            className="cleanify-nav-pill"
            onClick={() => handleNav("/", "cleanify-map-section")}
          >
            Map
          </button>

          {user && (
            <button 
              type="button"
              className={`cleanify-nav-pill ${isActive("/my-complaints") ? "active" : ""}`}
              onClick={() => handleNav("/my-complaints")}
            >
              My Reports
            </button>
          )}

          {user?.role === "admin" && (
            <button 
              type="button"
              className={`cleanify-nav-pill admin-nav-pill ${isActive("/admin") ? "active" : ""}`}
              onClick={() => handleNav("/admin")}
            >
              🛡️ Admin Portal
            </button>
          )}
        </nav>

        {/* Right Actions: Laptop Direct Buttons + Mobile Menu Trigger */}
        <div className="cleanify-right-actions">
          
          {/* Notification Bell */}
          <button 
            type="button"
            className="nav-icon-btn" 
            title={user ? "View Activity & Alerts" : "Sign in to see alerts"} 
            onClick={() => {
              if (user) navigate("/my-complaints");
              else navigate("/login");
            }}
          >
            <FiBell size={19} />
            <span className="bell-badge-dot"></span>
          </button>

          {/* Laptop Mode Direct Auth Buttons (NO DROPDOWN ON LAPTOP) */}
          <div className="desktop-direct-actions">
            {user ? (
              <div className="desktop-user-group">
                <div className="desktop-user-pill">
                  <div className="desktop-avatar">
                    <span>{user?.role === "admin" ? "👨🏻‍💼" : "🌱"}</span>
                  </div>
                  <span className="desktop-name">{user?.name ? user.name.split(" ")[0] : "Hero"}</span>
                </div>

                <button 
                  type="button"
                  className="btn-desktop-logout"
                  onClick={handleLogout}
                  title="Sign Out"
                >
                  <FiLogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="desktop-guest-group">
                <button 
                  type="button"
                  className="btn-desktop-signin"
                  onClick={() => navigate("/login")}
                >
                  <FiLogIn size={15} />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Only Menu Capsule Button (Beside Notification) */}
          <button 
            type="button"
            className={`mobile-menu-trigger ${mobileMenuOpen ? "open" : ""} ${user ? "is-user" : "is-guest"}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {user ? (
              <>
                <div className="nav-avatar-img">
                  <span>{user?.role === "admin" ? "👨🏻‍💼" : "🌱"}</span>
                </div>
                <FiChevronDown size={14} className={`chevron-icon ${mobileMenuOpen ? "rotate" : ""}`} />
              </>
            ) : (
              <>
                <div className="nav-avatar-img guest">
                  <FiUser size={15} />
                </div>
                <FiChevronDown size={14} className={`chevron-icon ${mobileMenuOpen ? "rotate" : ""}`} />
              </>
            )}
          </button>

        </div>

      </div>

      {/* =========================================================================
          MOBILE ONLY SIMPLE & CLEAN DROPDOWN CARD
      ========================================================================= */}
      {mobileMenuOpen && (
        <div 
          className="simple-dropdown-card animate-pop"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Top User Info (if logged in) */}
          {user && (
            <div className="dropdown-user-strip">
              <div className="dropdown-avatar-pill">
                <span>{user?.role === "admin" ? "👨🏻‍💼" : "🌱"}</span>
              </div>
              <div className="dropdown-user-info">
                <strong>{user?.name || "Eco Citizen"}</strong>
                <span>{user?.email || "citizen@safai.org"}</span>
              </div>
              <span className={`dropdown-role-tag ${user?.role === "admin" ? "admin" : "citizen"}`}>
                {user?.role === "admin" ? "Admin" : "Citizen"}
              </span>
            </div>
          )}

          {/* Simple Navigation Items */}
          <div className="dropdown-links-list">
            <button 
              type="button" 
              className={`dropdown-simple-item ${isActive("/") ? "active" : ""}`}
              onClick={() => handleNav("/")}
            >
              <FiHome size={17} />
              <span>Home Page</span>
            </button>

            <button 
              type="button" 
              className={`dropdown-simple-item highlight ${isActive("/report") ? "active" : ""}`}
              onClick={() => handleNav("/report")}
            >
              <FiCamera size={17} />
              <span>Report Waste</span>
            </button>

            {user ? (
              <>
                <button 
                  type="button" 
                  className={`dropdown-simple-item ${isActive("/my-complaints") ? "active" : ""}`}
                  onClick={() => handleNav("/my-complaints")}
                >
                  <FiAward size={17} />
                  <span>My Reports & Points</span>
                </button>

                {user?.role === "admin" && (
                  <button 
                    type="button" 
                    className={`dropdown-simple-item admin-link ${isActive("/admin") ? "active" : ""}`}
                    onClick={() => handleNav("/admin")}
                  >
                    <FiShield size={17} />
                    <span>Admin Portal</span>
                  </button>
                )}

                <div className="dropdown-sep-line"></div>

                <button 
                  type="button" 
                  className="dropdown-simple-item logout-btn"
                  onClick={handleLogout}
                >
                  <FiLogOut size={17} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <div className="dropdown-sep-line"></div>

                <button 
                  type="button" 
                  className={`dropdown-simple-item auth-btn ${isActive("/login") ? "active" : ""}`}
                  onClick={() => handleNav("/login")}
                >
                  <FiLogIn size={17} />
                  <span>Sign In</span>
                </button>

                <button 
                  type="button" 
                  className={`dropdown-simple-item auth-btn register ${isActive("/register") ? "active" : ""}`}
                  onClick={() => handleNav("/register")}
                >
                  <FiUserPlus size={17} />
                  <span>Create Account</span>
                </button>
              </>
            )}
          </div>

        </div>
      )}

    </header>
  );
};

export default Navbar;
