import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";
import ReportWaste from "./pages/ReportWaste";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
import UserDashboard from "./pages/UserDashboard";
import MyComplaints from "./pages/MyComplaints";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";


function App() {
  const location = useLocation();

  // Hide Navbar on login page
  const hideNavbarRoutes = ["/login"];
  const shouldHideNavbar = hideNavbarRoutes.includes(
    location.pathname
  );

  return (
    <>
      {!shouldHideNavbar && <Navbar />}

      <Routes>
        {/* Default Redirect */}
        <Route
          path="/"
          element={<Navigate to="/login" />}
        />

        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <ReportWaste />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-complaints"
          element={
            <ProtectedRoute>
              <MyComplaints />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Catch All Unknown Routes */}
        <Route
          path="*"
          element={<Navigate to="/login" />}
        />

        <Route path="/" element={<Landing />} />

      </Routes>
    </>
  );
}

export default App;
