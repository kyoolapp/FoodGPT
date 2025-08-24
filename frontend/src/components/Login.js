import { useState } from "react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import "./Login.css";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    try {
      setSubmitting(true);
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user);
    } catch (err) {
      console.error(err);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      const result = await signInWithEmailAndPassword(auth, email, password);
      onLogin(result.user);
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-root">
      {/* Gradient hero */}
      <header className="login-hero">
        <div className="login-hero-inner">
          <div className="login-brand">
            <span className="login-logo-dot" />
            <span>KyoolApp</span>
          </div>

          <div className="login-hero-content">
            <p className="login-tagline">Cook cool with Kyool</p>
            <h1 className="login-hero-title">Welcome back</h1>
            <p className="login-hero-sub">
              Sign in to start turning ingredients into recipes.
            </p>
          </div>
        </div>

        {/* smooth arc wave (no diagonal edge) */}
        <svg
          className="login-hero-wave"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,20 1440,60 L1440,120 L0,120 Z"></path>
        </svg>
      </header>

      {/* Centered card */}
      <main className="login-container">
        <section className="login-card">
          <h2 className="login-card-title">Sign in</h2>
          <p className="login-card-sub">Use Google or your email and password.</p>

          {error && <div className="login-error">{error}</div>}

          <button
            type="button"
            className="btn-google"
            onClick={handleGoogleLogin}
            disabled={submitting}
          >
            <span className="g-icon" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.5 544.3">
                <path fill="#4285F4" d="M533.5 278.4c0-18.6-1.6-37-5-54.8H272.1v103.8h147c-6.3 34-25 62.7-53.4 82v68.1h86.5c50.7-46.7 81.3-115.6 81.3-199.1z"/>
                <path fill="#34A853" d="M272.1 544.3c72.6 0 133.6-24 178.1-65.1l-86.5-68.1c-24 16.1-54.8 25.5-91.6 25.5-70.4 0-130.1-47.4-151.5-111.1H31.6v69.9c44.2 87.6 134.9 148.9 240.5 148.9z"/>
                <path fill="#FBBC05" d="M120.6 325.5c-10.1-30.2-10.1-63 0-93.2v-69.9H31.6C11.2 197.5 0 236 0 278.4s11.2 80.9 31.6 116l89-68.9z"/>
                <path fill="#EA4335" d="M272.1 108.6c39.5-.6 77.7 14.1 106.8 41.7l79.5-79.5C405.6 24.1 343.8 0 272.1 0 166.4 0 75.8 61.3 31.6 148.9l89 69.9c21.4-63.8 81.1-110.2 151.5-110.2z"/>
              </svg>
            </span>
            <span>Sign in with Google</span>
          </button>

          <div className="login-sep"><span>or</span></div>

          <form onSubmit={handleEmailLogin} className="login-form" noValidate>
            <label className="login-label">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="login-label">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </label>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </section>
      </main>

      <footer className="login-footer">
        <span>© {new Date().getFullYear()} KyoolApp</span>
        <span className="sep">•</span>
        <span>Cook smarter, waste less.</span>
      </footer>
    </div>
  );
}

export default Login;
