import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Brand from "../components/Brand";

export default function Login() {
  const [email, setEmail] = useState("admin@household.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/app/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <span className="blob b1" />
      <span className="blob b2" />
      <div className="auth-card">
        <Link to="/"><Brand className="auth-brand" /></Link>
        <h2>Welcome back</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>Sign in to your household.</p>
        <div className="demo-hint">🔑 Demo: <strong>admin@household.local</strong> / <strong>password123</strong></div>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="btn btn-gradient btn-block btn-lg">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="switch-link">
          No account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}
