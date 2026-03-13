import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import LoginPage from "../pages/LoginPage";
import AppPage from "../pages/AppPage";
import AdminPage from "../pages/AdminPage";
import RegisterPage from "../pages/RegisterPage";
import { ProtectedRoute } from "../auth/ProtectedRoute";

function RootRedirect() {
  const { accessToken, user } = useAuth();

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "SUPER_ADMIN") {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/app" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
