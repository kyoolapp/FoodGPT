// App.js
import './App.css';
import axios from 'axios';
import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import FoodGPT from './components/FoodGPT';
import RecipePage from './components/RecipePage';
import Login from './components/Login';
import Signup from './components/Signup';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
const MAX_HOME_RECIPES = 3;

function HomeScreen({ displayName, history, onAddHistory }) {
  return (
    <>
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

        <svg className="hero-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,64L80,69.3C160,75,320,85,480,96C640,107,800,117,960,106.7C1120,96,1280,64,1360,48L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </header>

      <main className="container">
        <section className="card recipe-card">
          <div className="card-head">
            <h2>Generate a Recipe</h2>
            <p className="muted">Enter ingredients (e.g tofu,onion,spinach) choose oven, time and servings, then hit cook it.</p>
          </div>
          <div className="card-body">
            {/* pass the callback down */}
            <FoodGPT userName={displayName} onNewRecipe={onAddHistory} />
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
    <>
      <ul className="history-list">
        {history.slice(0, MAX_HOME_RECIPES).map((item) => (
          <li key={item.id} className="history-item">
            <div className="hist-row">
              {(item.ingredients || []).slice(0,6).map((ing, i) => (
                <span key={i} className="chip">{ing}</span>
              ))}
            </div>
            <Link
              to="/recipe"
              state={{ recipe: item }}
              className="hist-title"
            >
              {item.recipe_name || 'Recipe'}
            </Link>
            <div className="hist-time">{item.times}</div>
          </li>
        ))}
      </ul>

      {history.length > MAX_HOME_RECIPES && (
        <div className="history-actions" style={{ marginTop: 12, textAlign: 'right' }}>
          <Link to="/history" className="btn btn-ghost">View all →</Link>
        </div>
      )}
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

  // Accept a freshly generated recipe and prepend it to the list
  const handleAddHistory = useCallback((item) => {
    setHistory((prev) => {
      // avoid dupes by id if server later returns the same id
      if (prev.some(x => x.id === item.id)) return prev;
      return [item, ...prev];
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
      <Route path="/recipe" element={<RecipePage />} />
    </Routes>
  );
}
