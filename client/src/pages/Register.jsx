import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
        { name, email, password }
      );

      navigate("/login");
    } catch (error) {
      alert("Registration failed");
    }
  };

  return (
  <div className="register-wrapper">
    <div className="register-card">

      <h1 className="register-title">
         SaFai <span>withAI</span>
      </h1>

      <h2>Create Account</h2>

      <p className="register-subtext">
        Start reporting waste with AI-powered tracking
      </p>

      <form onSubmit={handleRegister}>

        <div className="input-group">
          <input
            type="text"
            placeholder="Full Name"
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <input
            type="email"
            placeholder="Email Address"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="full-btn" type="submit">
          Register
        </button>

      </form>

      <p className="login-link">
        Already have an account?{" "}
        <span onClick={() => navigate("/login")}>
          Login
        </span>
      </p>

    </div>
  </div>
);
};
export default Register;
