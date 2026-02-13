import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ReportWaste from "./pages/ReportWaste";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/report"
        element={
          <ProtectedRoute>
            <ReportWaste />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;