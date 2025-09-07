// src/components/RecipePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import "./RecipePage.css";
import axios from "axios";

export default function RecipePage() {
  const { state } = useLocation();                // may contain state.recipe (user selections)
  const { id } = useParams();

  // Paint fast with what we have, then hydrate with API
  const [recipe, setRecipe] = useState(state?.recipe || null);
  const [loading, setLoading] = useState(!state?.recipe);

  // Always fetch full recipe by id; let STATE values win over API
  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    axios
      .get(`https://api.kyoolapp.com/recipe/${id}`)
      .then((res) => {
        if (!alive) return;
        // IMPORTANT: state/prev (user selections) override API
        setRecipe((prev) => ({ ...(res.data || {}), ...(prev || {}) })); 
      })
      .catch((err) => console.error("Error fetching recipe:", err))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  // ---------- Persisted check-list ----------
  const recipeTitle = recipe?.recipe_name || "Recipe";
  const recipeKey = useMemo(() => `kyool:doneSteps:${recipeTitle}`, [recipeTitle]);

  const [doneSteps, setDoneSteps] = useState([]);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(recipeKey);
      setDoneSteps(raw ? JSON.parse(raw) : []);
    } catch {
      setDoneSteps([]);
    }
  }, [recipeKey]);

  useEffect(() => {
    try { sessionStorage.setItem(recipeKey, JSON.stringify(doneSteps)); } catch {}
  }, [doneSteps, recipeKey]);

  const [burst, setBurst] = useState(false);
  const prevCompletion = useRef(0);

  const instructions = recipe?.instructions || [];
  const totalSteps = instructions.length;
  const completion = totalSteps ? Math.round((doneSteps.length / totalSteps) * 100) : 0;
  const isLocked = totalSteps > 0 && completion === 100 && doneSteps.includes(totalSteps);

  useEffect(() => {
    if (prevCompletion.current < 100 && completion === 100) {
      setBurst(true);
      const t = setTimeout(() => setBurst(false), 1500);
      return () => clearTimeout(t);
    }
    prevCompletion.current = completion;
  }, [completion]);

  const toggleStep = (n) => {
    if (isLocked) return;
    setDoneSteps((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));
  };

  // ---------- Rating ----------
  const ratingKey = useMemo(() => `${recipeKey}:rating`, [recipeKey]);
  const [rating, setRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  useEffect(() => {
    const raw = sessionStorage.getItem(ratingKey);
    setRating(raw ? Number(raw) : 0);
  }, [ratingKey]);
  const setStar = (n) => {
    setRating(n);
    try { sessionStorage.setItem(ratingKey, String(n)); } catch {}
  };

  // ---------- Share (same behavior as History page) ----------
  const [copied, setCopied] = useState(false);
  const pageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/recipe/${id}`
      : "";

  const handleShare = async () => {
    const title = recipe?.recipe_name || "Recipe";
    try {
      if (navigator.share) {
        await navigator.share({ title, url: pageUrl });
      } else {
        await navigator.clipboard?.writeText(pageUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }
    } catch {
      // user canceled
    }
  };

  // ---------- Normalize + prefer user selections for hero chips ----------
  const recipe_name = recipe?.recipe_name || "Recipe";
  const ingredients = recipe?.ingredients || [];
  const nutritional_values = recipe?.nutritional_values || {};

  // Prefer selections from state.recipe; do NOT use `times` (timestamp)
  const displayTime =
    state?.recipe?.time_option ??
    state?.recipe?.selected_time ??
    recipe?.time_option ??
    recipe?.cook_time ??
    null;

  const displayServings =
    state?.recipe?.serving ??
    state?.recipe?.selected_servings ??
    recipe?.serving ??
    recipe?.servings ??
    null;

  const displayCalories =
    state?.recipe?.estimated_calories ??
    state?.recipe?.selected_calories ??
    recipe?.estimated_calories ??
    recipe?.calories ??
    null;

  const displayDifficulty = state?.recipe?.difficulty ?? recipe?.difficulty ?? null;

  // ---------- Persist selected time/servings/calories so they survive relaunch ----------
  useEffect(() => {
    if (!id) return;
    try {
      const key = `kyool:selections:${id}`;
      const prev = JSON.parse(localStorage.getItem(key) || "{}");
      const payload = {};

      if (displayTime != null) {
        payload.selected_time = displayTime;
        payload.time_option = displayTime;
      }
      if (displayServings != null) {
        payload.selected_servings = displayServings;
        payload.serving = displayServings;
        payload.servings = displayServings;
      }
      if (displayCalories != null) {
        payload.selected_calories = displayCalories;
        payload.estimated_calories = displayCalories;
        payload.calories = displayCalories;
      }

      const next = { ...prev, ...payload };
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [id, displayTime, displayServings, displayCalories]);

  return (
    <div className="rp-root">
      <header className="rp-hero">
        <div className="rp-hero-inner">
          <Link to="/" className="rp-back">← Back to home</Link>
          <h1 className="rp-title">{recipe_name}</h1>

          {/* HERO STATS — show selected values, not API recalcs */}
          <div className="rp-hero-stats">
            {displayTime != null && (
              <div className="rp-stat">
                <div>{typeof displayTime === "number" ? `${displayTime} minutes` : displayTime}</div>
                <em>Cook Time</em>
              </div>
            )}
            {displayServings != null && (
              <div className="rp-stat">
                <div>{displayServings}</div>
                <em>{Number(displayServings) === 1 ? "Serving" : "Servings"}</em>
              </div>
            )}
            {displayCalories != null && (
              <div className="rp-stat">
                <div>{displayCalories}</div>
                <em>Calories</em>
              </div>
            )}
            {displayDifficulty != null && (
              <div className="rp-stat">
                <div>{displayDifficulty}</div>
                <em>Difficulty</em>
              </div>
            )}
          </div>
        </div>

        {/* CSS must set .rp-wave path { fill: var(--rp-bg) } */}
        <svg className="rp-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,64L80,69.3C160,75,320,85,480,96C640,107,800,117,960,106.7C1120,96,1280,64,1360,48L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </header>

      <main className="rp-main">
        {/* Ingredients (bulleted) */}
        <section className="rp-card rp-card--ing">
          <h2 className="rp-h2">Ingredients</h2>
          <ul className="rp-ingredients">
            {ingredients.length ? (
              ingredients.map((it, i) => <li key={i}>{it}</li>)
            ) : (
              <li>—</li>
            )}
          </ul>
        </section>

        {/* Nutrition (yellow card) */}
        <section className="rp-card rp-card--nut">
          <h2 className="rp-h2">Nutrition Facts</h2>
          <div className="rp-nut-sub">Per serving{displayServings ? ` • ${displayServings} total` : ""}</div>

          {displayCalories != null && (
            <>
              <div className="rp-cal-chip">Calories {displayCalories}</div>
              <div className="rp-nut-divider" />
            </>
          )}

          <div className="rp-nut-rows">
            {Object.entries(nutritional_values).map(([key, val]) => (
              <div key={key} className="rp-nrow">
                <span>{key.toLowerCase()}</span>
                <span>
                  {val}
                  {key.toLowerCase().includes("sodium") ? "mg" : " g"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Instructions + Actions (sticky) */}
        <div className="rp-instructions-wrap">
          <section className="rp-card rp-card--instructions">
            <div className="rp-card-head">
              <h2 className="rp-h2">Cooking Instructions</h2>
              <div className="rp-slim-progress" aria-label="Progress">
                <div className="rp-slim-progress-bar" style={{ width: `${completion}%` }} />
                <span className="rp-slim-progress-txt">{completion}%</span>
              </div>
            </div>

            <ol className="rp-steps">
              {instructions.length ? (
                instructions.map((step, i) => {
                  const n = i + 1;
                  const done = doneSteps.includes(n);
                  const last = n === totalSteps;
                  const finalCompleted = last && done && completion === 100;
                  const disabled = isLocked || finalCompleted;

                  return (
                    <li
                      key={i}
                      className={`rp-step ${done ? "rp-step-done" : ""} ${finalCompleted ? "rp-step-final" : ""} ${isLocked ? "rp-step-locked" : ""}`}
                      onClick={() => { if (!disabled) toggleStep(n); }}
                      role="button"
                      aria-pressed={done}
                      aria-disabled={disabled}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (!disabled && (e.key === "Enter" || e.key === " ")) toggleStep(n);
                      }}
                    >
                      <div className={`rp-badge ${done ? "done" : ""}`}>{done ? "✔" : n}</div>

                      <div className="rp-step-body">
                        <div className="rp-step-text">{step}</div>
                      </div>

                      <button
                        type="button"
                        className={`rp-step-toggle ${done ? "is-done" : ""}`}
                        onClick={(e) => { e.stopPropagation(); if (!disabled) toggleStep(n); }}
                        disabled={disabled}
                        aria-pressed={done}
                      >
                        {isLocked || finalCompleted ? "Completed" : done ? "Undo" : "Done"}
                      </button>
                    </li>
                  );
                })
              ) : (
                <li className="rp-step">
                  <div className="rp-badge">—</div>
                  <div className="rp-step-body"><div className="rp-step-text">—</div></div>
                </li>
              )}
            </ol>
          </section>

          {/* Sticky Actions column */}
          <aside className="rp-actions-col">
            <div className="rp-card rp-actions-sidebar" aria-label="Actions">
              <h3 className="rp-actions-title">Rate & Share</h3>

              {/* Stars */}
              <div className="rp-stars" aria-label="Rate this recipe" role="radiogroup">
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = (hoverStar || rating) >= n;
                  return (
                    <button
                      key={n}
                      className={`rp-star ${active ? "is-active" : ""}`}
                      onMouseEnter={() => setHoverStar(n)}
                      onMouseLeave={() => setHoverStar(0)}
                      onClick={() => setStar(n)}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      role="radio"
                      aria-checked={rating === n}
                      type="button"
                    >
                      ★
                    </button>
                  );
                })}
              </div>

              {/* Share */}
              <button className="rp-share-btn" type="button" onClick={handleShare}>
                <span aria-hidden>🔗</span> Share
              </button>
              {copied && <div className="rp-share-hint">Link copied!</div>}
            </div>
          </aside>
        </div>
      </main>

      {/* Confetti — multiple icons */}
      {burst && (
        <div className="rp-burst" aria-hidden="true">
          {Array.from({ length: 50 }).map((_, i) => {
            const icons = ["🎉", "🎊", "✨", "💫", "🌟", "🥳", "🍾", "🎶"];
            const icon = icons[Math.floor(Math.random() * icons.length)];
            return (
              <span
                key={i}
                className="burst-icon"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.4}s`,
                  fontSize: `${Math.random() * 12 + 16}px`,
                }}
              >
                {icon}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
