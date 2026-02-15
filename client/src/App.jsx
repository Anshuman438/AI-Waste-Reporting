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
import Register from "./pages/Register";

function App() {
  const location = useLocation();

  // Hide Navbar on landing & login
  const hideNavbarRoutes = ["/", "/login"];
  const shouldHideNavbar = hideNavbarRoutes.includes(
    location.pathname
  );

  return (
    <>
      {!shouldHideNavbar && <Navbar />}

      <Routes>

        {/* Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        {/* User Routes */}
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

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Catch All */}
        <Route
          path="*"
          element={<Navigate to="/" />}
        />



      </Routes>
    </>
  );
}

export default App;
