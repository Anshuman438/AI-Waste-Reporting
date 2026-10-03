import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const isAdmin = Boolean(
    user && token && (
      (user.role && String(user.role).toLowerCase() === "admin") ||
      (user.email && String(user.email).toLowerCase() === "admin@safai.org")
    )
  );

  if (!isAdmin) {
    return <Navigate to={`/login?redirect=/admin`} state={{ returnTo: location.pathname }} replace />;
  }

  return children;
};

export default AdminRoute;