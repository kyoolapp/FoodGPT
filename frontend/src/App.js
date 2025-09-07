import './App.css';
import axios from 'axios';
import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import FoodGPT from './components/FoodGPT';
import RecipePage from './components/RecipePage';
import Login from './components/Login';
import Signup from './components/Signup';
import HistoryPage from './components/HistoryPage';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const MAX_HOME_RECIPES = 3;

/* ---------- Helpers to persist and normalize user selections ---------- */
const selKey = (id) => `kyool:selections:${id}`;

const storage = {
  get(k) {
    try {
      const fromLocal = localStorage.getItem(k);
      if (fromLocal != null) return fromLocal;
      return sessionStorage.getItem(k);
    } catch {
      try { return sessionStorage.getItem(k); } catch { return null; }
    }
  },
  set(k, v) {
    try { localStorage.setItem(k, v); }
    catch {
      try { sessionStorage.setItem(k, v); } catch {}
    }
  }
};

function normalizeSelections(obj = {}) {
  const selected_time =
    obj.selected_time ?? obj.time_option ?? obj.cook_time ?? null;

  const selected_servings =
    obj.selected_servings ?? obj.serving ?? obj.servings ?? null;

  const selected_calories =
    obj.selected_calories ?? obj.estimated_calories ?? obj.calories ?? null;

  const normalized = {};
  if (selected_time != null) {
    normalized.selected_time = selected_time;
    normalized.time_option = selected_time;
  }
  if (selected_servings != null) {
    normalized.selected_servings = selected_servings;
    normalized.serving = selected_servings;
    normalized.servings = selected_servings;
  }
  if (selected_calories != null) {
    normalized.selected_calories = selected_calories;
    normalized.estimated_calories = selected_calories;
    normalized.calories = selected_calories;
  }
  return normalized;
}

function readSelections(id) {
  if (!id) return {};
  try {
    const raw = storage.get(selKey(id));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeSelections(id, obj) {
  if (!id) return;
  const normalized = normalizeSelections(obj);
  try {
    const prev = readSelections(id);
    const next = { ...prev, ...normalized };
    storage.set(selKey(id), JSON.stringify(next));
  } catch {}
}

/* ---------- Home Screen ---------- */
function HomeScreen({ displayName, history, onAddHistory }) {
  return (
    <>
      <header className="app-hero">
        <nav className="nav">
          <div className="brand">
            <img src="/kyoolapp_logo.png" alt="logo" className="brand-logo" />
            <h2>KyoolApp</h2>
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

        <svg className="hero-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,64L80,69.3C160,75,320,85,480,96C640,107,800,117,960,106.7C1120,96,1280,64,1360,48L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </header>

      <main className="container">
        <section className="card recipe-card">
          <div className="card-head"></div>
          <div className="card-body">
            <FoodGPT userName={displayName} onNewRecipe={onAddHistory} />
          </div>
        </section>

        <aside className="card history-card">
          {/* Header now has "View all" on the right */}
          <div className="card-head history-card-head">
            <div>
              <h2>Recent Recipes</h2>
              <p className="muted">Your last few creations, at a glance.</p>
            </div>
            <Link to="/history" className="btn btn-sm" aria-label="View all recipes">
              View all
            </Link>
          </div>

          {history.length === 0 ? (
            <div className="empty">
              <div className="empty-emoji">🍳</div>
              <p>No recipes yet — generate your first one!</p>
            </div>
          ) : (
            <>
              <ul className="history-list">
                {history.slice(0, MAX_HOME_RECIPES).map((item) => {
                  const saved = readSelections(item.id);
                  const normalized = normalizeSelections(item);
                  const enriched = { ...item, ...saved, ...normalized };

                  return (
                    <li key={item.id} className="history-li">
                      <Link
                        to={`/recipe/${item.id}`}
                        state={{ recipe: enriched }}
                        className="history-item"
                        aria-label={`Open recipe: ${item.recipe_name || 'Recipe'}`}
                      >
                        <div className="hist-time">{item.times || 'Just now'}</div>
                        <div className="hist-title">{item.recipe_name || 'Recipe'}</div>
                        <div className="hist-row">
                          {(item.ingredients || []).slice(0, 6).map((ing, i) => (
                            <span key={i} className="chip">{ing}</span>
                          ))}
                        </div>
                        <div className="hist-go" aria-hidden="true">→</div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {/* removed bottom "View all" button */}
            </>
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

/* ---------- App ---------- */
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
          const serverHistory = res.data.history || [];

          const hydrated = serverHistory.map((it) => {
            const saved = readSelections(it.id);
            const normalized = normalizeSelections(it);
            return { ...it, ...saved, ...normalized };
          });

          setHistory(hydrated);
        } catch (err) {
          console.error('Error fetching history:', err);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddHistory = useCallback((item) => {
    if (item?.id) writeSelections(item.id, item);
    const enriched = { ...item, ...normalizeSelections(item), ...readSelections(item.id) };
    setHistory((prev) => {
      if (prev.some((x) => x.id === enriched.id)) return prev;
      return [enriched, ...prev];
    });
  }, []);

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Login onLogin={setUser} />;
  if (firstLogin) return <Signup onSignup={(u) => { setUser(u); setFirstLogin(false); }} />;

  const displayName = user.displayName || user.email;

  return (
    <Routes>
      <Route
        path="/"
        element={<HomeScreen displayName={displayName} history={history} onAddHistory={handleAddHistory} />}
      />
      <Route path="/history" element={<HistoryPage history={history} />} />
      <Route path="/recipe/:id" element={<RecipePage />} />
    </Routes>
  );
}
