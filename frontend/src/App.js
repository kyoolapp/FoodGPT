// App.js
import './App.css';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import FoodGPT from './components/FoodGPT';
import RecipePage from './components/RecipePage';
import Login from './components/Login';
import Signup from './components/Signup';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';


/** Extract a human-friendly recipe title from your saved JSON/string */
function extractRecipeTitle(resp) {
  if (!resp) return 'Recipe';

  let s = String(resp).trim();

  // Strip json fences if present
  if (s.startsWith('')) {
    s = s.replace(/^(?:json)?\s*/i, '').replace(/\s*$/i, '').trim();
  }

  // If the whole payload is a quoted JSON string, unquote once
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    try {
      const unquoted = JSON.parse(s);
      if (typeof unquoted === 'string') s = unquoted.trim();
    } catch {}
  }

  // Try to parse full JSON
  try {
    const obj = JSON.parse(s);
    const root = Array.isArray(obj) ? obj[0] : obj;
    return root.recipe_name || root.title || root.name || 'Recipe';
  } catch {}

  // Fallback: look for "recipe_name": "..."
  const m =
    s.match(/"recipe_name"\s*:\s*"([^"]+)"/i) ||
    s.match(/'recipe_name'\s*:\s*'([^']+)'/i);
  if (m) return m[1].trim();

  // Last resort: first non-empty line without braces/quotes
  const first = (s.split('\n').find(Boolean) || '')
    .replace(/^[{\s"']+|[}\s"']+$/g, '')
    .trim();
  return first || 'Recipe';
}

/* ---------------- Home screen (your previous UI) ---------------- */
function HomeScreen({ displayName, history }) {
  return (
    <>
      {/* Top gradient header / nav */}
      <header className="app-hero">
        <nav className="nav">
          <div className="brand">
            <img src="/kyoolapp.png" alt="logo" className="brand-logo" />

            <span>KyoolApp</span>
          </div>
          <div className="nav-actions">
            <button onClick={() => signOut(auth)} className="btn btn-ghost">Log out</button>
          </div>
        </nav>

        <div className="hero-content">
          <p className="tagline">Cook cool with Kyool</p>
          <h1 className="hero-title">Welcome, {displayName}</h1>
          <p className="hero-sub">Turn whatever’s in your kitchen into fast, healthy recipes.</p>
        </div>

        {/* decorative wave */}
        <svg className="hero-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,64L80,69.3C160,75,320,85,480,96C640,107,800,117,960,106.7C1120,96,1280,64,1360,48L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </header>

      {/* Main content */}
      <main className="container">
        <section className="card recipe-card">
          <div className="card-head">
            <h2>Generate a Recipe</h2>
            <p className="muted">Type ingredients (e.g., tofu, onion, spinach) and hit Generate.</p>
          </div>
          <div className="card-body">
            <FoodGPT userName={displayName} />
          </div>
        </section>

        <aside className="card history-card">
          <div className="card-head">
            <h2>Recent Recipes</h2>
            <p className="muted">Your last few creations, at a glance.</p>
          </div>

          {history.length === 0 ? (
            <div className="empty">
              <div className="empty-emoji">🍳</div>
              <p>No recipes yet — generate your first one!</p>
            </div>
          ) : (
            <ul className="history-list">
              {history.map((item) => {
                const raw = item.response;
                const title = extractRecipeTitle(raw);
                return (
                  <li key={item.id} className="history-item">
                    <div className="hist-row">
                      {(item.ingredients || []).slice(0, 6).map((ing, i) => (
                        <span key={i} className="chip">{ing}</span>
                      ))}
                    </div>

                    {/* Clickable recipe name → /recipe */}
                    <Link
                      to="/recipe"
                      state={{ raw }}
                      className="hist-title"
                      onClick={() => {
                        const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
                        sessionStorage.setItem('kyool:lastRecipe', str);
                      }}
                    >
                      Recipe Name: {title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} KyoolApp</span>
        <span className="sep">•</span>
        <span>Cook smarter, waste less.</span>
      </footer>
    </>
  );
}

/* ---------------- App (auth + routing) ---------------- */
export default function App() {
  const [user, setUser] = useState(null);
  const [firstLogin, setFirstLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const res = await axios.get(
            `https://api.kyoolapp.com/history/${currentUser.displayName || currentUser.email}`
          );
          setHistory(res.data.history || []);
        } catch (err) {
          console.error('Error fetching history:', err);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Login onLogin={setUser} />;
  if (firstLogin) return <Signup onSignup={(u) => { setUser(u); setFirstLogin(false); }} />;

  const displayName = user.displayName || user.email;

  return (
    <Routes>
      <Route
        path="/"
        element={<HomeScreen displayName={displayName} history={history} />}
      />
      <Route path="/recipe" element={<RecipePage />} />
    </Routes>
  );
}
