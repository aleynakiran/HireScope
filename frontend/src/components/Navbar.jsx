import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  const themeToggle = (
    <button
      type="button"
      className={`theme-toggle ${theme === "light" ? "light" : "dark"}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="theme-toggle-knob" />
      <span className="theme-toggle-icon theme-toggle-icon-sun" aria-hidden="true">
        ☀
      </span>
      <span className="theme-toggle-icon theme-toggle-icon-moon" aria-hidden="true">
        ☾
      </span>
    </button>
  );

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link className="brand" to={token ? "/dashboard" : "/"}>
          HireScope
        </Link>

        <nav className="nav-links">
          {token ? (
            <>
              <Link className="nav-link" to="/dashboard">
                Dashboard
              </Link>
              <Link className="nav-link" to="/library">
                Library
              </Link>
              <Link className="nav-link" to="/sessions/new">
                New interview
              </Link>
              <Link className="nav-link" to="/settings/security">
                Settings
              </Link>
              <Link className="nav-link" to="/2fa-setup">
                2FA
              </Link>
              {user?.role === "admin" ? (
                <Link className="nav-link" to="/admin">
                  Admin
                </Link>
              ) : null}
              {themeToggle}
              <button type="button" className="btn" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/login">
                Login
              </Link>
              <Link className="nav-link" to="/register">
                Register
              </Link>
              {themeToggle}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
