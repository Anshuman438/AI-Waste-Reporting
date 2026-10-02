import React, { useState, useEffect } from "react";
import axios from "axios";
import bcrypt from "bcryptjs";
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
import { getTiDBClient, ensureTiDBTables } from "../services/tidbService";

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

    // 1. Try Backend API
    try {
      const res = await axios.post(
        `${API}/api/auth/login`,
        { email: lookupEmail, password }
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data));
      handleAuthSuccess(res.data);
      return;

    } catch (err) {
      console.log("API Login note:", err.response?.data?.message || err.message);

      // 2. Direct TiDB Cloud Verification
      const conn = getTiDBClient();
      if (conn) {
        try {
          await ensureTiDBTables(conn);
          const rows = await conn.execute(
            `SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1`,
            [lookupEmail.toLowerCase()]
          );

          if (rows && rows.length > 0) {
            const dbUser = rows[0];
            if (dbUser.password) {
              const isMatch = await bcrypt.compare(password, dbUser.password);
              if (isMatch) {
                const authenticatedUser = {
                  _id: String(dbUser.id),
                  id: String(dbUser.id),
                  name: dbUser.name,
                  email: dbUser.email,
                  role: dbUser.role || (isAdminUser ? "admin" : "user"),
                  token: "tidb-session-" + Date.now(),
                };
                localStorage.setItem("token", authenticatedUser.token);
                localStorage.setItem("user", JSON.stringify(authenticatedUser));
                handleAuthSuccess(authenticatedUser);
                return;
              } else {
                setError("Incorrect password. Please verify your credentials.");
                setLoading(false);
                return;
              }
            }
          }
        } catch (tidbErr) {
          console.warn("Direct TiDB Login Note:", tidbErr.message);
        }
      }

      // 3. Check locally cached admin password hash
      if (isAdminUser) {
        const cachedHash = localStorage.getItem("safai_admin_password_hash");
        if (cachedHash) {
          const match = await bcrypt.compare(password, cachedHash);
          if (match) {
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
          } else {
            setError("Incorrect admin password.");
            setLoading(false);
            return;
          }
        } else if (password === "123456") {
          // Default initial fallback only if no password has ever been set
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
                autoFocus
              />
            </div>
          </div>

          <div className="form-field-group">
            <label>Password</label>
            <div className="input-with-icon">
              <FiLock className="field-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
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
              <span className="auth-loading-text">
                <span className="auth-spinner"></span>
                <span>Authenticating...</span>
              </span>
            ) : (
              <>
                <span>Sign In to safAI</span>
                <FiArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="auth-footer-text">
          <span>Don't have an account? </span>
          <Link to={`/register${location.search}`} className="auth-link">Create an Account</Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
