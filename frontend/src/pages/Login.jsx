import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiBaseURL, apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../utils/formatApiError";

export default function Login() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await apiClient.post("/auth/login", { email, password });
      if (res.data.two_factor_required || res.data.totp_required) {
        sessionStorage.setItem("twofa_temp_token", res.data.temp_token);
        navigate("/2fa-verify");
        return;
      }
      await loginWithToken(res.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err, "Login failed"));
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <form onSubmit={onSubmit}>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <div style={{ marginTop: 14 }}>
            <button className="btn primary" type="submit">
              Sign in
            </button>
          </div>
        </form>

        {error ? <div className="error-message">{error}</div> : null}

        <div className="oauth-row">
          <a className="oauth-btn" data-testid="google-login-btn" href={`${apiBaseURL}/oauth/google`}>
            Continue with Google
          </a>
          <a className="oauth-btn" data-testid="github-login-btn" href={`${apiBaseURL}/oauth/github`}>
            Continue with GitHub
          </a>
          <a className="oauth-btn" data-testid="linkedin-login-btn" href={`${apiBaseURL}/oauth/linkedin`}>
            Continue with LinkedIn
          </a>
          <a className="oauth-btn" data-testid="microsoft-login-btn" href={`${apiBaseURL}/oauth/microsoft`}>
            Continue with Microsoft
          </a>
        </div>

        <p className="muted" style={{ marginTop: 14 }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
