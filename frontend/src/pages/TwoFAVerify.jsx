import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../utils/formatApiError";

export default function TwoFAVerify() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [method, setMethod] = useState("totp");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

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
        method,
        code,
      });
      sessionStorage.removeItem("twofa_temp_token");
      await loginWithToken(res.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err, "Verification failed"));
    }
  }

  async function sendOtp() {
    setError("");
    setInfo("");
    const tempToken = sessionStorage.getItem("twofa_temp_token");
    if (!tempToken) {
      setError("Missing temporary token. Please login again.");
      return;
    }
    try {
      if (method === "email" || method === "sms") {
        const res = await apiClient.post("/auth/login/send-2fa", {
          temp_token: tempToken,
          method,
        });
        setInfo(res.data.message || `${method.toUpperCase()} OTP sent.`);
      }
    } catch (err) {
      setError(formatApiError(err, "Could not send OTP"));
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Verify 2FA</h2>
        <form onSubmit={onSubmit}>
          <label className="label" htmlFor="method">
            Verification method
          </label>
          <select
            id="method"
            className="select"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="totp">Authenticator (TOTP)</option>
            <option value="email">Email OTP</option>
            <option value="sms">SMS OTP</option>
            <option value="backup">Backup code</option>
          </select>

          <label className="label" htmlFor="totp_code">
            Code
          </label>
          <input
            id="totp_code"
            name="totp_code"
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            required
          />
          <div style={{ marginTop: 14 }}>
            {(method === "email" || method === "sms") && (
              <button className="btn" type="button" onClick={sendOtp} style={{ marginRight: 8 }}>
                Send OTP
              </button>
            )}
            <button className="btn primary" type="submit">
              Continue
            </button>
          </div>
        </form>
        {info ? <div style={{ marginTop: 10, color: "var(--accent-2)" }}>{info}</div> : null}
        {error ? <div className="error-message">{error}</div> : null}
      </div>
    </div>
  );
}
