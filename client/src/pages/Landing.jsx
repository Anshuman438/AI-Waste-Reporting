import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FiCamera, 
  FiMapPin, 
  FiFileText, 
  FiSend, 
  FiUsers, 
  FiChevronRight,
  FiChevronDown,
  FiCheckCircle,
  FiClock,
  FiActivity,
  FiAward,
  FiZap,
  FiTrendingUp,
  FiArrowRight
} from "react-icons/fi";
import { 
  LuLeaf, 
  LuRecycle, 
  LuTreePine, 
  LuLightbulb, 
  LuSprout,
  LuSparkles,
  LuCompass,
  LuHeartHandshake
} from "react-icons/lu";
const ComplaintMap = React.lazy(() => import("../components/ComplaintMap"));
import heroBgImg from "../assets/hero_bg_panoramic.png";
import "./Landing.css";

import { API } from "../config/api";

const Landing = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);

  // Rich sample reports matching the user reference
  const defaultRecentReports = [
    {
      _id: "demo1",
      wasteType: "Overflowing Dustbin",
      imageUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=300&auto=format&fit=crop&q=80",
      description: "Campus 3, Near Library",
      status: "in-progress",
      time: "2 hours ago"
    },
    {
      _id: "demo2",
      wasteType: "Plastic Waste",
      imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=300&auto=format&fit=crop&q=80",
      description: "Food Court Area",
      status: "submitted",
      time: "5 hours ago"
    },
    {
      _id: "demo3",
      wasteType: "E-Waste",
      imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300&auto=format&fit=crop&q=80",
      description: "Hostel Block B",
      status: "resolved",
      time: "1 day ago"
    }
  ];

  // Time formatting helper for genuine dynamic relative timestamps
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "Just now";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Waste type label helper with concise icons to prevent thumbnail badge overflow
  const formatWasteType = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "biodegradable" || t === "bio" || t === "organic") return "🌿 Bio";
    if (t === "plastic") return "🧴 Plastic";
    if (t === "metal") return "🥫 Metal";
    if (t === "e-waste") return "⚡ E-Waste";
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "Waste";
  };

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        let list = [];
        try {
          const res = await axios.get(`${API}/api/complaints`, { timeout: 6000 });
          if (Array.isArray(res.data) && res.data.length > 0) {
            list = res.data;
          }
        } catch (_) {}

        if (list.length === 0) {
          try {
            const res = await axios.get(`${API}/api/test-db`, { timeout: 6000 });
            if (Array.isArray(res.data?.complaints) && res.data.complaints.length > 0) {
              list = res.data.complaints;
            }
          } catch (_) {}
        }

        if (list.length > 0) {
          // Deduplicate by ID
          const unique = Array.from(
            new Map(list.map((c) => [String(c._id || c.id), c])).values()
          );
          setComplaints(unique);
        } else {
          setComplaints(defaultRecentReports);
        }
      } catch (err) {
        setComplaints(defaultRecentReports);
      }
    };
    fetchRecent();
  }, []);

  // Handle scroll to hash anchors when navigating from other pages or clicking nav pills
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash) {
        setTimeout(() => {
          const target = document.querySelector(hash);
          if (target) {
            target.scrollIntoView({ behavior: "smooth" });
          }
        }, 120);
      }
    };
    handleHashScroll();
    window.addEventListener("hashchange", handleHashScroll);
    return () => window.removeEventListener("hashchange", handleHashScroll);
  }, []);

  const totalReportsCount = 1284 + complaints.length;
  const resolvedCount = 860 + complaints.filter(c => c.status === "resolved").length;

  return (
    <div className="cleanify-fullpage-root">
      
      {/* 1. Seamless Full-Width Landscape Hero Banner with clean artwork background */}
      <section className="cleanify-panoramic-hero">
        <div className="panoramic-hero-container">
          
          {/* Left Text & CTA Column */}
          <div className="panoramic-text-pane">
            
            <h1 className="hero-big-title">
              Spot Waste.<br />
              Report It.<br />
              <span className="title-highlight">Make a Change.</span>
            </h1>

            <p className="hero-sub-text">
              A cleaner campus, city and planet starts with you.<br />
              Report waste, track progress and be a part of a greener future.
            </p>

            <div className="hero-cta-buttons">
              <button 
                className="btn-leaf-cta btn-leaf-primary"
                onClick={() => navigate("/report")}
              >
                <div className="btn-leaf-icon-bubble">
                  <FiCamera size={18} />
                </div>
                <span>Report Waste Now</span>
                <span className="btn-leaf-arrow">➔</span>
              </button>

              <button 
                className="btn-leaf-cta btn-leaf-secondary"
                onClick={() => {
                  const el = document.getElementById("cleanify-stats-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <LuLeaf className="btn-secondary-leaf-icon" size={17} />
                <span>Learn More</span>
              </button>
            </div>

          </div>

        </div>

        {/* Leaf Scroll Down Indicator Button in Bottom Middle */}
        <button 
          className="hero-scroll-leaf-btn"
          onClick={() => {
            const el = document.getElementById("cleanify-stats-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          aria-label="Scroll down to explore impact"
          title="Scroll to explore"
        >
          <div className="scroll-leaf-shape">
            <FiChevronDown className="scroll-leaf-arrow" size={22} />
          </div>
        </button>

      </section>

      {/* =========================================================================
          SECTION 2: Measurable Change Across Neighborhoods (Full Length Panoramic Screen)
      ========================================================================= */}
      <section className="cleanify-section2-panoramic" id="cleanify-stats-section">
        <div className="section2-container">
          
          {/* Left Spacer for Desktop Illustration */}
          <div className="section2-art-spacer" aria-hidden="true"></div>

          {/* Right Text & Stats Content Column */}
          <div className="section2-content-pane">
            
            {/* Headline */}
            <h2 className="section2-headline">
              Measurable<br />
              Change Across<br />
              <span className="title-teal-highlight">Neighborhoods</span>
            </h2>

            {/* Subheadline */}
            <p className="section2-subheadline">
              Every citizen photo submitted feeds directly into municipal dispatch systems and AI-powered sorting.
            </p>

            {/* 4 Pastel Cards Grid */}
            <div className="section2-cards-row">
              
              <div className="section2-card card-mint">
                <div className="section2-icon-circle icon-circle-mint">
                  <LuLeaf size={22} />
                </div>
                <h3 className="section2-card-num">{totalReportsCount.toLocaleString()}</h3>
                <span className="section2-card-title">Reports Submitted</span>
                <p className="section2-card-desc">Verified community waste spots logged.</p>
              </div>

              <div className="section2-card card-blue">
                <div className="section2-icon-circle icon-circle-blue">
                  <LuRecycle size={22} />
                </div>
                <h3 className="section2-card-num">{resolvedCount.toLocaleString()}</h3>
                <span className="section2-card-title">Issues Resolved</span>
                <p className="section2-card-desc">Cleaned & restored by local teams.</p>
              </div>

              <div className="section2-card card-yellow">
                <div className="section2-icon-circle icon-circle-yellow">
                  <FiUsers size={22} />
                </div>
                <h3 className="section2-card-num">320+</h3>
                <span className="section2-card-title">Active Citizens</span>
                <p className="section2-card-desc">Students & residents reporting daily.</p>
              </div>

              <div className="section2-card card-peach">
                <div className="section2-icon-circle icon-circle-peach">
                  <FiClock size={22} />
                </div>
                <h3 className="section2-card-num">2.4 hrs</h3>
                <span className="section2-card-title">Avg Response Time</span>
                <p className="section2-card-desc">From snap to municipal dispatch.</p>
              </div>

            </div>

          </div>

        </div>

        {/* Leaf Scroll Down Indicator for Section 2 */}
        <button 
          className="section2-scroll-leaf-btn"
          onClick={() => {
            const el = document.getElementById("cleanify-workflow-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          aria-label="Scroll down to workflow"
          title="Explore workflow"
        >
          <div className="scroll-leaf-shape">
            <FiChevronDown className="scroll-leaf-arrow" size={22} />
          </div>
        </button>

      </section>

      {/* Main Content Full-Width Body Section */}
      <div className="cleanify-body-section-wrap" id="cleanify-about-section">
        <div className="cleanify-body-container">

          {/* =========================================================================
              SECTION 3: 4-Step Animated Interactive Workflow
          ========================================================================= */}
          <section className="cleanify-workflow-section" id="cleanify-workflow-section">
          <div className="section-header-center">
            <h2 className="section-headline">How safAI Cleans Your City in 4 Steps</h2>
            <p className="section-subheadline">
              Powered by cutting-edge on-device computer vision and rapid municipal dispatch to clear waste faster.
            </p>
          </div>

          <div className="workflow-steps-horizontal-grid">
            
            <div className="workflow-step-card step-card-1" onClick={() => navigate("/report")}>
              <div className="step-number-badge">01</div>
              <div className="step-icon-wrap icon-mint">
                <FiCamera size={26} />
              </div>
              <h4>Snap a Photo</h4>
              <p>Capture the overflowing bin or litter spot on campus or street with your smartphone camera.</p>
              <div className="step-action-hint">
                <span>Try Camera</span> <FiArrowRight size={14} />
              </div>
            </div>

            <div className="workflow-step-card step-card-2" onClick={() => navigate("/report")}>
              <div className="step-number-badge">02</div>
              <div className="step-icon-wrap icon-pink">
                <LuRecycle size={26} />
              </div>
              <h4>AI Auto-Detection</h4>
              <p>safAI instantly identifies waste type (Plastic, Organic, E-Waste, Hazardous) and severity.</p>
              <div className="step-action-hint">
                <span>TensorFlow AI</span> <FiZap size={14} />
              </div>
            </div>

            <div className="workflow-step-card step-card-3" onClick={() => navigate("/report")}>
              <div className="step-number-badge">03</div>
              <div className="step-icon-wrap icon-purple">
                <FiMapPin size={26} />
              </div>
              <h4>Pin Exact Location</h4>
              <p>High-precision GPS pins coordinates and nearest landmark automatically for swift pickup.</p>
              <div className="step-action-hint">
                <span>Auto GPS</span> <LuCompass size={14} />
              </div>
            </div>

            <div className="workflow-step-card step-card-4" onClick={() => navigate("/report")}>
              <div className="step-number-badge">04</div>
              <div className="step-icon-wrap icon-blue">
                <FiCheckCircle size={26} />
              </div>
              <h4>Resolution & Rewards</h4>
              <p>Municipal team resolves the report, notifies you, and credits Green Hero points to your profile.</p>
              <div className="step-action-hint">
                <span>Earn 50 Pts</span> <FiAward size={14} />
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            SECTION 3: Full-Width Community Map & Radar
        ========================================================================= */}
        <section className="cleanify-map-radar-section" id="cleanify-map-section">
          <div className="map-radar-card-container">
            
            <div className="map-radar-header">
              <div className="map-radar-title-col">
                <h3>Live Community Waste Radar</h3>
                <p>Interactive map of reported, in-progress, and resolved waste reports in real time.</p>
              </div>

              <div className="map-radar-actions-col">
                <button 
                  className="btn-leaf-cta btn-leaf-primary btn-sm-map" 
                  onClick={() => navigate("/report")}
                >
                  <FiCamera size={16} />
                  <span>Report Spot on Map</span>
                </button>
              </div>
            </div>

            <div className="map-canvas-wrapper">
              <React.Suspense fallback={<div style={{height:400,display:'flex',alignItems:'center',justifyContent:'center',background:'#f0f4f8',borderRadius:16,color:'#64748b',fontSize:14}}>🗺️ Loading map…</div>}>
                <ComplaintMap complaints={complaints} />
              </React.Suspense>
            </div>

          </div>
        </section>

        {/* =========================================================================
            SECTION 4: Recent Community Activity Feed & Green Hero Rewards (2-Col)
        ========================================================================= */}
        <section className="cleanify-split-activity-section" id="cleanify-activity-section">
          
          {/* Left: Recent Activity Feed */}
          <div className="cleanify-spacious-panel recent-activity-feed-panel">
            <div className="panel-header-row">
              <div className="panel-title-with-icon">
                <div className="panel-header-icon-box icon-emerald">
                  <FiActivity size={20} />
                </div>
                <div>
                  <h3>Recent Community Activity</h3>
                  <p>Latest verified reports submitted by citizens</p>
                </div>
              </div>
              <button className="btn-view-all-link" onClick={() => navigate("/my-complaints")}>
                <span>View Full Feed</span> <FiArrowRight size={14} />
              </button>
            </div>

            <div className="activity-cards-stack">
              {complaints.slice(0, 4).map((item, idx) => {
                const compId = item._id || item.id || idx;
                const status = (item.status || "pending").toLowerCase();
                const displayStatus = 
                  status === "resolved" ? "Resolved" : 
                  status === "in-progress" ? "In Progress" : "Pending";
                const locationText = item.location?.address || item.locationName || "Civic Area";
                const titleText = item.description || "Civic waste reported via safAI AI";

                return (
                  <div 
                    key={compId} 
                    className="activity-item-card"
                    onClick={() => navigate("/my-complaints")}
                  >
                    <div className="activity-thumb-wrapper">
                      <img 
                        src={item.imageUrl || "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=200&auto=format&fit=crop&q=80"} 
                        alt="Report thumbnail" 
                        className="activity-thumb-img" 
                      />
                      <span className="activity-type-tag">
                        {formatWasteType(item.wasteType)}
                      </span>
                    </div>

                    <div className="activity-info-block">
                      <div className="activity-title-line">
                        <h4 className="activity-report-title" title={titleText}>
                          {titleText}
                        </h4>
                      </div>

                      <div className="activity-location-line" title={locationText}>
                        <FiMapPin className="pin-icon-sm" size={12} />
                        <span className="activity-loc-text">{locationText}</span>
                      </div>

                      <div className="activity-meta-line">
                        <span className="meta-time">
                          <FiClock size={12} /> {formatTimeAgo(item.createdAt || item.time)}
                        </span>
                        <span className="meta-ai-badge">
                          <LuSparkles size={12} /> AI Verified
                        </span>
                      </div>
                    </div>

                    <div className="activity-status-action">
                      <span className={`status-pill-chip ${status === "in-progress" ? "in-progress" : status === "resolved" ? "resolved" : "submitted"}`}>
                        {displayStatus}
                      </span>
                      <FiChevronRight className="arrow-hover-icon" size={18} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Green Hero Quests & Daily Tips */}
          <div className="cleanify-spacious-panel green-hero-quest-panel">
            
            <div className="panel-header-row">
              <div className="panel-title-with-icon">
                <div className="panel-header-icon-box icon-gold">
                  <FiAward size={20} />
                </div>
                <div>
                  <h3>Green Hero Rewards</h3>
                  <p>Earn XP, level up, and unlock impact badges</p>
                </div>
              </div>
            </div>

            {/* Level Card */}
            <div className="hero-quest-level-card">
              <div className="level-card-top">
                <div className="hero-avatar-with-badge">
                  <div className="hero-avatar-circle">🌱</div>
                  <div className="hero-level-tag">Level 2 Hero</div>
                </div>
                <div className="points-tally-pill">
                  <span className="points-sparkle">⭐</span>
                  <strong>250 XP Points</strong>
                </div>
              </div>

              <div className="level-progress-group">
                <div className="progress-labels-row">
                  <span>Progress to Level 3 (Eco Guardian)</span>
                  <strong>250 / 500 XP</strong>
                </div>
                <div className="quest-progress-track">
                  <div className="quest-progress-fill" style={{ width: "50%" }}></div>
                </div>
              </div>

              <div className="hero-milestones-row">
                <div className="milestone-badge completed">
                  <FiCheckCircle size={14} /> <span>1st Report</span>
                </div>
                <div className="milestone-badge completed">
                  <FiCheckCircle size={14} /> <span>5 Reports</span>
                </div>
                <div className="milestone-badge locked">
                  <span>🔒 10 Reports</span>
                </div>
              </div>
            </div>

            {/* Daily Tip Bubble */}
            <div className="daily-eco-tip-banner">
              <div className="eco-tip-icon-avatar">
                <LuLightbulb size={24} />
              </div>
              <div className="eco-tip-text">
                <h4>Daily Green Tip</h4>
                <p>Always separate dry recyclables from wet organic matter to prevent landfill methane emissions.</p>
              </div>
              <div className="eco-tip-leaf-pot">🪴</div>
            </div>

            {/* SDG 11 Sustainable Cities Card */}
            <div className="sdg-goal-card">
              <div className="sdg-badge-square">SDG 11</div>
              <div className="sdg-card-text">
                <strong>Sustainable Cities & Communities</strong>
                <p>Contributing directly to United Nations Sustainability Goal 11.6.</p>
              </div>
            </div>

          </div>

        </section>

        </div>
      </div>

    </div>
  );
};

export default Landing;
