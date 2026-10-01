import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiArrowRight, 
  FiEye, 
  FiEyeOff, 
  FiAlertCircle, 
  FiCheckCircle 
} from "react-icons/fi";
import { LuLeaf } from "react-icons/lu";
import GoogleAuthButton from "../components/GoogleAuthButton";
import "./Register.css";

const API = import.meta.env.VITE_API_URL;

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get("redirect") || (location.state?.returnTo) || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleAuthSuccess = (userData) => {
    window.dispatchEvent(new Event("storage"));
    if (userData.role === "admin") {
      navigate("/admin");
    } else {
      navigate(redirectPath);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        `${API}/api/auth/register`,
        { name, email, password }
      );

      if (res.data && res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data));
        setSuccess(true);
        setTimeout(() => {
          handleAuthSuccess(res.data);
        }, 1200);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 1200);
      }

    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please check your information."
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
          <h2>Create Citizen Account</h2>
          <p>Join the smart civic network for clean neighborhoods.</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="auth-error-banner animate-fade-in">
            <FiAlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert Box */}
        {success && (
          <div className="auth-success-banner animate-fade-in">
            <FiCheckCircle size={18} />
            <span>Account created successfully! Connecting session...</span>
          </div>
        )}

        {/* Google Auth Button */}
        <div className="google-auth-wrapper">
          <GoogleAuthButton 
            text="Sign up with Google"
            onSuccess={handleAuthSuccess}
            disabled={loading || success}
          />
        </div>

        <div className="demo-divider-line">
          <span>OR SIGN UP WITH EMAIL</span>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="auth-form">
          
          <div className="form-field-group">
            <label>Full Name</label>
            <div className="input-with-icon">
              <FiUser className="field-icon" />
              <input
                type="text"
                placeholder="e.g. Aryan Gupta"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-field-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <FiMail className="field-icon" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-field-group">
            <label>Password</label>
            <div className="input-with-icon">
              <FiLock className="field-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
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
            disabled={loading || success}
          >
            {loading ? (
              <div className="btn-spinner"></div>
            ) : (
              <>
                <span>Create Free Account</span>
                <FiArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign In Here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;

