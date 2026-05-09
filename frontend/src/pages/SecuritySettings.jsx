import { useEffect, useState } from "react";
import { apiClient } from "../api/client";

export default function SecuritySettings() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get("/auth/me");
        if (!cancelled) setMe(res.data);
      } catch {
        if (!cancelled) setError("Could not load security settings.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const twofaActive = Boolean(
    me?.totp_enabled || me?.email_otp_enabled || me?.sms_otp_enabled || me?.is_2fa_enabled
  );

  return (
    <div className="container">
      <h2 style={{ marginTop: 0, marginBottom: 4 }}>Security & Account Settings</h2>
      <div className="muted" style={{ marginBottom: 12 }}>
        Manage identity protection, connected providers and session safety.
      </div>

      {error ? <div className="error-message">{error}</div> : null}

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>Account health</strong>
          <span className={`pill ${twofaActive ? "score-high" : "score-mid"}`}>
            {twofaActive ? "2FA active" : "2FA recommended"}
          </span>
        </div>
        <p className="muted" style={{ margin: "10px 0 0" }}>
          Email: {me?.email || "—"}
        </p>
        <div className="metric-grid" style={{ marginTop: 12 }}>
          <div className="metric-card">
            <div className="muted">2FA methods enabled</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {[me?.totp_enabled, me?.email_otp_enabled, me?.sms_otp_enabled].filter(Boolean).length}
            </div>
          </div>
          <div className="metric-card">
            <div className="muted">Primary provider</div>
            <div style={{ fontSize: 22, fontWeight: 800, textTransform: "capitalize" }}>
              {me?.oauth_provider || "Password"}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <strong>Connected accounts</strong>
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span>Google</span>
            <span className="muted">{me?.oauth_provider === "google" ? "Connected" : "Not connected"}</span>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span>GitHub</span>
            <span className="muted">{me?.oauth_provider === "github" ? "Connected" : "Not connected"}</span>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span>Discord</span>
            <span className="muted">{me?.oauth_provider === "discord" ? "Connected" : "Not connected"}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <strong>Active sessions</strong>
        <p className="muted" style={{ marginTop: 8 }}>
          Session-level tracking is available in admin audit logs. Use logout when sharing devices.
        </p>
      </div>
    </div>
  );
}
