import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  if (!user || !token || user.role !== "admin") {
    return <Navigate to={`/login?redirect=/admin`} state={{ returnTo: location.pathname }} replace />;
  }

  return children;
};

export default AdminRoute;