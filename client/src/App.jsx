import { Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import ReportWaste from "./pages/ReportWaste";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/report" element={ <ProtectedRoute> <ReportWaste /> </ProtectedRoute>} />
      <Route path="/admin" element={ <AdminRoute> <AdminDashboard /> </AdminRoute>}/>
    </Routes>
  );
}

export default App;