import { useState } from "react";
import { apiClient } from "../api/client";
import { formatApiError } from "../utils/formatApiError";

export default function TwoFASetup() {
  const [secret, setSecret] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [code, setCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function generate() {
    setError("");
    setMessage("");
    try {
      const res = await apiClient.post("/auth/2fa/totp/setup");
      setSecret(res.data.secret);
      setQrDataUrl(res.data.qr_code);
    } catch (err) {
      setError(formatApiError(err, "Setup failed"));
    }
  }

  async function verify() {
    setError("");
    setMessage("");
    try {
      await apiClient.post("/auth/2fa/totp/verify", { otp: code });
      setMessage("TOTP 2FA enabled.");
    } catch (err) {
      setError(formatApiError(err, "Verification failed"));
    }
  }

  async function enableEmailOtp() {
    setError("");
    setMessage("");
    try {
      await apiClient.post("/auth/2fa/email/setup", { enabled: true });
      setMessage("Email OTP enabled. Login flow will ask for email OTP.");
    } catch (err) {
      setError(formatApiError(err, "Email OTP setup failed"));
    }
  }

  async function enableSmsOtp() {
    setError("");
    setMessage("");
    try {
      await apiClient.post("/auth/2fa/sms/setup", { phone_number: phoneNumber });
      setMessage("SMS OTP enabled.");
    } catch (err) {
      setError(formatApiError(err, "SMS OTP setup failed"));
    }
  }

  async function generateBackupCodes() {
    setError("");
    setMessage("");
    try {
      const res = await apiClient.post("/auth/2fa/backup-codes/generate");
      setBackupCodes(res.data.backup_codes || []);
      setMessage("Backup codes generated. Save them securely.");
    } catch (err) {
      setError(formatApiError(err, "Backup code generation failed"));
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
            Setup TOTP (QR)
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

        <hr style={{ margin: "20px 0", borderColor: "var(--border)" }} />
        <div className="label">Email OTP</div>
        <button type="button" className="btn" onClick={enableEmailOtp}>
          Enable Email OTP
        </button>

        <div className="label" style={{ marginTop: 16 }}>
          SMS OTP
        </div>
        <input
          className="input"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+905xxxxxxxxx"
        />
        <div style={{ marginTop: 8 }}>
          <button type="button" className="btn" onClick={enableSmsOtp}>
            Enable SMS OTP
          </button>
        </div>

        <div className="label" style={{ marginTop: 16 }}>
          Backup codes
        </div>
        <button type="button" className="btn" onClick={generateBackupCodes}>
          Generate backup codes
        </button>
        {backupCodes.length > 0 ? (
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{backupCodes.join("\n")}</pre>
        ) : null}

        {error ? <div className="error-message">{error}</div> : null}
        {message ? <div style={{ marginTop: 10, color: "var(--accent-2)" }}>{message}</div> : null}
      </div>
    </div>
  );
}
