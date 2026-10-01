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
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Register from "./pages/Register";

function App() {
  const location = useLocation();

  // Hide Navbar and Footer on auth login, register, and dedicated admin portal
  const hideLayoutRoutes = ["/login", "/register", "/admin"];
  const shouldHideLayout = hideLayoutRoutes.includes(location.pathname);

  return (
    <>
      {!shouldHideLayout && <Navbar />}

      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Login & Register */}
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
          element={<ReportWaste />}
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

      {!shouldHideLayout && <Footer />}
    </>
  );
}

export default App;
