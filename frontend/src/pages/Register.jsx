import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiBaseURL, apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../utils/formatApiError";

export default function Register() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await apiClient.post("/auth/register", {
        email,
        password,
        full_name: fullName,
      });
      const res = await apiClient.post("/auth/login", { email, password });
      if (res.data.totp_required) {
        sessionStorage.setItem("twofa_temp_token", res.data.temp_token);
        navigate("/2fa-verify");
        return;
      }
      await loginWithToken(res.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err, "Registration failed"));
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Register</h2>
        <form onSubmit={onSubmit}>
          <label className="label" htmlFor="full_name">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            className="input"
            type="email"
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
            autoComplete="new-password"
            required
            minLength={8}
          />

          <div style={{ marginTop: 14 }}>
            <button className="btn primary" type="submit">
              Create account
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
        </div>

        <p className="muted" style={{ marginTop: 14 }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
