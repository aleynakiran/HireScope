import { Link, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewSession from "./pages/NewSession";
import Interview from "./pages/Interview";
import Results from "./pages/Results";
import OAuthCallback from "./pages/OAuthCallback";
import TwoFASetup from "./pages/TwoFASetup";
import TwoFAVerify from "./pages/TwoFAVerify";
import AdminDashboard from "./pages/AdminDashboard";

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

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/2fa-verify" element={<TwoFAVerify />} />

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sessions/new" element={<NewSession />} />
          <Route path="/interview/:sessionId" element={<Interview />} />
          <Route path="/results/:sessionId" element={<Results />} />
          <Route path="/2fa-setup" element={<TwoFASetup />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
