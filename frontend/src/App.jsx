import { Link, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewSession from "./pages/NewSession";
import Interview from "./pages/Interview";
import Results from "./pages/Results";
import Library from "./pages/Library";
import SecuritySettings from "./pages/SecuritySettings";
import OAuthCallback from "./pages/OAuthCallback";
import TwoFASetup from "./pages/TwoFASetup";
import TwoFAVerify from "./pages/TwoFAVerify";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOversight from "./pages/admin/AdminOversight";

function Home() {
  return (
    <div className="container">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>HireScope</h1>
        <p className="muted">
          Personalized technical interviews with AI scoring and progress tracking.
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <Link className="btn primary" to="/login">
            Get started
          </Link>
          <Link className="btn" to="/register">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

function HomeRoute() {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (token) return <Navigate to="/dashboard" replace />;
  return <Home />;
}

function PublicOnlyRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/2fa-verify" element={<TwoFAVerify />} />

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/sessions/new" element={<NewSession />} />
          <Route path="/interview/:sessionId" element={<Interview />} />
          <Route path="/results/:sessionId" element={<Results />} />
          <Route path="/2fa-setup" element={<TwoFASetup />} />
          <Route path="/settings/security" element={<SecuritySettings />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/oversight" element={<AdminOversight />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
