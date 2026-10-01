import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FiCamera, 
  FiMapPin, 
  FiActivity, 
  FiShield, 
  FiArrowUp,
  FiGrid,
  FiAward,
  FiCheckCircle
} from "react-icons/fi";
import { LuLeaf, LuSparkles, LuRecycle } from "react-icons/lu";
import "./Footer.css";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavOrScroll = (targetId, path = "/") => {
    if (location.pathname === "/") {
      if (!targetId) {
        scrollToTop();
      } else {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      if (targetId) {
        navigate(`/#${targetId}`);
      } else {
        navigate(path);
      }
    }
  };

  return (
    <footer className="cleanify-small-footer">
      <div className="footer-small-container">
        
        {/* Top Mini Row: Brand + Back to Top */}
        <div className="footer-top-strip">
          
          {/* Brand & Tagline */}
          <div className="footer-mini-brand" onClick={scrollToTop} role="button" tabIndex={0}>
            <div className="footer-mini-logo">
              <LuLeaf size={20} />
            </div>
            <div className="footer-mini-brand-text">
              <span className="footer-brand-title">safAI</span>
              <span className="footer-brand-sub">Clean Today, Greener Tomorrow</span>
            </div>
          </div>

          {/* Back to Top Leaf Button */}
          <button 
            type="button" 
            className="btn-footer-back-to-top"
            onClick={scrollToTop}
            title="Scroll to top"
          >
            <span>Back to Top</span>
            <FiArrowUp size={15} />
          </button>

        </div>

        {/* Middle Quick Links */}
        <div className="footer-links-strip">
          
          <div className="footer-nav-pills">
            <button 
              type="button" 
              className="footer-nav-link"
              onClick={() => handleNavOrScroll(null, "/")}
            >
              Home
            </button>

            <button 
              type="button" 
              className="footer-nav-link highlight-report"
              onClick={() => navigate("/report")}
            >
              <FiCamera size={14} />
              <span>Report Waste (AI)</span>
            </button>

            <button 
              type="button" 
              className="footer-nav-link"
              onClick={() => handleNavOrScroll("cleanify-map-section")}
            >
              <FiMapPin size={14} />
              <span>Community Radar</span>
            </button>

            <button 
              type="button" 
              className="footer-nav-link"
              onClick={() => handleNavOrScroll("cleanify-workflow-section")}
            >
              How It Works
            </button>

            <button 
              type="button" 
              className="footer-nav-link"
              onClick={() => navigate("/my-complaints")}
            >
              <FiActivity size={14} />
              <span>My Reports</span>
            </button>

            <button 
              type="button" 
              className="footer-nav-link"
              onClick={() => navigate("/dashboard")}
            >
              <FiGrid size={14} />
              <span>Citizen Hub</span>
            </button>
          </div>

        </div>

        {/* Bottom Small Copyright Line */}
        <div className="footer-bottom-line">
          <p className="copyright-text">
            &copy; {new Date().getFullYear()} <strong>safAI Smart Waste Management</strong>. Powered by AI Neural Classification.
          </p>
          <div className="footer-bottom-tags">
            <span>High-Precision GPS</span>
            <span className="dot-sep">&bull;</span>
            <span>TensorFlow AI</span>
            <span className="dot-sep">&bull;</span>
            <span>Instant Civic Dispatch</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
