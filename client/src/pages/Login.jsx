import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  FiMail, 
  FiLock, 
  FiArrowRight, 
  FiEye, 
  FiEyeOff, 
  FiAlertCircle, 
  FiShield,
  FiUser
} from "react-icons/fi";
import { LuLeaf, LuSparkles } from "react-icons/lu";
import GoogleAuthButton from "../components/GoogleAuthButton";
import "./Login.css";

import { API } from "../config/api";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get("redirect") || (location.state?.returnTo) || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (token && user) {
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate(redirectPath === "/dashboard" ? "/dashboard" : redirectPath);
      }
    }
  }, [navigate, redirectPath]);

  const handleAuthSuccess = (userData) => {
    window.dispatchEvent(new Event("storage"));
    if (userData.role === "admin") {
      navigate("/admin");
    } else {
      navigate(redirectPath);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanInput = email.trim().toLowerCase();
    const isAdminUser = cleanInput === "admin" || cleanInput === "admin@safai.org";
    const lookupEmail = isAdminUser ? "admin@safai.org" : email.trim();

    try {
      const res = await axios.post(
        `${API}/api/auth/login`,
        { email: lookupEmail, password }
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data));
      handleAuthSuccess(res.data);

    } catch (err) {
      if (isAdminUser && password === "123456") {
        // Instant Admin access fallback
        const adminUser = {
          _id: "admin-master",
          name: "Municipal Admin",
          email: "admin@safai.org",
          role: "admin",
          token: "admin-session-" + Date.now()
        };
        localStorage.setItem("token", adminUser.token);
        localStorage.setItem("user", JSON.stringify(adminUser));
        handleAuthSuccess(adminUser);
        return;
      }

      setError(
        err.response?.data?.message || "Invalid credentials. Please verify your username/email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-royal-page">
      <div className="auth-royal-card animate-fade-in">
        
        {/* Brand Header */}
        <div className="auth-brand" onClick={() => navigate("/")}>
          <div className="auth-logo-badge">
            <LuLeaf size={24} />
          </div>
          <div className="auth-brand-text">
            <span>safAI</span>
          </div>
        </div>

        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to submit waste reports and track civic resolutions.</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="auth-error-banner animate-fade-in">
            <FiAlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Google Authentication Button */}
        <div className="google-auth-wrapper">
          <GoogleAuthButton 
            text="Continue with Google"
            onSuccess={handleAuthSuccess}
            disabled={loading}
          />
        </div>

        <div className="demo-divider-line">
          <span>OR SIGN IN WITH EMAIL / USERNAME</span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="auth-form">
          
          <div className="form-field-group">
            <label>Username / Email ID</label>
            <div className="input-with-icon">
              <FiUser className="field-icon" />
              <input
                type="text"
                placeholder="e.g. admin or citizen@safai.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-field-group">
            <div className="label-row">
              <label>Password</label>
            </div>
            <div className="input-with-icon">
              <FiLock className="field-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={loading}
          >
            {loading ? (
              <div className="btn-spinner"></div>
            ) : (
              <>
                <span>Sign In to safAI</span>
                <FiArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-text">
          Don't have an account?{" "}
          <Link to="/register" className="auth-link">
            Create Free Citizen Account
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;

