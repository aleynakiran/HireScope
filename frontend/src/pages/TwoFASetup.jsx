import { useState } from "react";
import { apiClient } from "../api/client";
import { formatApiError } from "../utils/formatApiError";

export default function TwoFASetup() {
  const [secret, setSecret] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function generate() {
    setError("");
    setMessage("");
    try {
      const res = await apiClient.post("/2fa/setup");
      setSecret(res.data.secret);
      setQrDataUrl(`data:image/png;base64,${res.data.qr_code}`);
    } catch (err) {
      setError(formatApiError(err, "Setup failed"));
    }
  }

  async function verify() {
    setError("");
    setMessage("");
    try {
      await apiClient.post("/2fa/verify", { code });
      setMessage("2FA enabled.");
    } catch (err) {
      setError(formatApiError(err, "Verification failed"));
    }
  }

  async function disable() {
    setError("");
    setMessage("");
    try {
      await apiClient.post("/2fa/disable");
      setSecret("");
      setQrDataUrl("");
      setCode("");
      setMessage("2FA disabled.");
    } catch (err) {
      setError(formatApiError(err, "Disable failed"));
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Two-factor authentication</h2>
        <p className="muted">
          Generate a secret, scan the QR code with Google Authenticator (or any TOTP app), then verify with a 6-digit code.
        </p>

        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" className="btn primary" onClick={generate}>
            Generate QR code
          </button>
          <button type="button" className="btn danger" onClick={disable}>
            Disable 2FA
          </button>
        </div>

        {qrDataUrl ? (
          <div style={{ marginTop: 14 }}>
            <img data-testid="qr-code-img" alt="TOTP QR code" src={qrDataUrl} />
            <div className="muted" style={{ marginTop: 10, wordBreak: "break-all" }}>
              Manual secret: <span>{secret}</span>
            </div>
          </div>
        ) : null}

        <label className="label" htmlFor="totp_code">
          6-digit code
        </label>
        <input
          id="totp_code"
          name="totp_code"
          className="input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          pattern="[0-9]{6}"
          placeholder="123456"
        />

        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn primary" onClick={verify}>
            Verify & activate
          </button>
        </div>

        {error ? <div className="error-message">{error}</div> : null}
        {message ? <div style={{ marginTop: 10, color: "var(--accent-2)" }}>{message}</div> : null}
      </div>
    </div>
  );
}
