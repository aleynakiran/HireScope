import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const twofa = params.get("twofa");
    const tempToken = params.get("temp_token");

    if (twofa === "1" && tempToken) {
      sessionStorage.setItem("twofa_temp_token", tempToken);
      navigate("/2fa-verify", { replace: true });
      return;
    }

    if (token) {
      (async () => {
        await loginWithToken(token);
        navigate("/dashboard", { replace: true });
      })();
      return;
    }

    navigate("/login", { replace: true });
  }, [loginWithToken, navigate]);

  return (
    <div className="container">
      <p className="muted">Completing sign-in…</p>
    </div>
  );
}
