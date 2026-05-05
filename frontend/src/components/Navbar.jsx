import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { token, user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link className="brand" to="/">
          HireScope
        </Link>

        <nav className="nav-links">
          {token ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/sessions/new">New interview</Link>
              <Link to="/2fa-setup">2FA</Link>
              {user?.role === "admin" ? <Link to="/admin">Admin</Link> : null}
              <button type="button" className="btn" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
