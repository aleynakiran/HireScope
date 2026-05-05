import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../utils/formatApiError";

export default function TwoFAVerify() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const tempToken = sessionStorage.getItem("twofa_temp_token");
    if (!tempToken) {
      setError("Missing temporary token. Please login again.");
      return;
    }
    try {
      const res = await apiClient.post("/auth/login/verify-2fa", {
        temp_token: tempToken,
        totp_code: totpCode,
      });
      sessionStorage.removeItem("twofa_temp_token");
      await loginWithToken(res.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err, "Verification failed"));
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Verify 2FA</h2>
        <form onSubmit={onSubmit}>
          <label className="label" htmlFor="totp_code">
            Authenticator code
          </label>
          <input
            id="totp_code"
            name="totp_code"
            className="input"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            inputMode="numeric"
            required
          />
          <div style={{ marginTop: 14 }}>
            <button className="btn primary" type="submit">
              Continue
            </button>
          </div>
        </form>
        {error ? <div className="error-message">{error}</div> : null}
      </div>
    </div>
  );
}
