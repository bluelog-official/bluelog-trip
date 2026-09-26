import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { API_BASE_URL } from "../../lib/guideCards";

const LOGIN_ERROR = "잘못된 관리자 정보입니다";

export default function AdminLogin({ onClose, onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.access_token) {
        setError(LOGIN_ERROR);
        return;
      }
      onSuccess(data.access_token);
    } catch {
      setError(LOGIN_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-root">
      <button type="button" className="login-backdrop" aria-label="Close admin login" onClick={onClose} />
      <section className="login-card" role="dialog" aria-modal="true" aria-labelledby="admin-login-title">
        <header className="login-header">
          <div>
            <p className="login-kicker">BlueLog</p>
            <h2 id="admin-login-title">Admin Login</h2>
          </div>
          <button type="button" className="login-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="admin-username">
            ID
          </label>
          <input
            id="admin-username"
            className="login-input"
            name="username"
            type="text"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={submitting}
            spellCheck={false}
          />
          <label className="login-label" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            className="login-input"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
          />
          {error ? (
            <p className="login-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="login-submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Log in"}
          </button>
        </form>
      </section>
    </div>
  );
}
