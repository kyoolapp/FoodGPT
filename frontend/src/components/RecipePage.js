// src/components/RecipePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./RecipePage.css";

export default function RecipePage() {
  const { state } = useLocation();
  const recipe = state?.recipe || null;  // unified prop from history or FoodGPT

  // ===== NEW: step completion state (per recipe) =====
  const recipeKey = useMemo(() => {
    const title = recipe?.recipe_name || "Recipe";
    return `kyool:doneSteps:${title}`;
  }, [recipe]);

  const [doneSteps, setDoneSteps] = useState(() => {
    try {
      const raw = sessionStorage.getItem(recipeKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(recipeKey, JSON.stringify(doneSteps));
    } catch {}
  }, [doneSteps, recipeKey]);

  const toggleStep = (n) => {
    setDoneSteps((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  // celebration burst when reaching 100%
  const [burst, setBurst] = useState(false);
  const prevCompletion = useRef(0);

  // ===== NEW: compute completion =====
  const totalSteps = recipe?.instructions?.length || 0;
  const completion = totalSteps ? Math.round((doneSteps.length / totalSteps) * 100) : 0;

  useEffect(() => {
    if (prevCompletion.current < 100 && completion === 100) {
      setBurst(true);
      const t = setTimeout(() => setBurst(false), 1200);
      return () => clearTimeout(t);
    }
    prevCompletion.current = completion;
  }, [completion]);

  if (!recipe) {
    return (
      <div className="rp-root">
        <header className="rp-hero">
          <div className="rp-hero-inner">
            <Link to="/" className="rp-back">← Back to Home</Link>
            <h1 className="rp-title">No recipe found</h1>
          </div>
        </header>
      </div>
    );
  }

  const {
    recipe_name,
    ingredients = [],
    instructions = [],
    estimated_calories,
    nutritional_values = {},
    serving,
    time_option,
  } = recipe;

  return (
    <div className="rp-root">
      <header className="rp-hero">
        <div className="rp-hero-inner">
          <Link to="/" className="rp-back">← Back to Home</Link>
          <h1 className="rp-title">{recipe_name || "Recipe"}</h1>
          {serving > 0 && (
            <div className="rp-sub">
              {serving} {serving === 1 ? "serving" : "servings"}
              {time_option ?  ` •  ~${time_option} min` : ""}
            </div>
          )}
        </div>

        {/* ===== NEW: progress bar in hero when steps exist ===== */}
        {totalSteps > 0 && (
          <div
            className="rp-progress"
            role="progressbar"
            aria-valuenow={completion}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="rp-progress-track">
              <div className="rp-progress-bar" style={{ width: `${completion}%` }} />
            </div>
            <span className="rp-progress-label">{completion}% complete</span>
          
          </div>

        )}

        <svg
          className="rp-wave"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,64L80,69.3C160,75,320,85,480,96C640,107,800,117,960,106.7C1120,96,1280,64,1360,48L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </header>

      <main className="rp-main">
        <section className="rp-card rp-card--ing">
          <h2 className="rp-h2">Ingredients</h2>
          <ul className="rp-ingredients">
            {ingredients.length ? (
              ingredients.map((it, i) => <li key={i}>{it}</li>)
            ) : (
              <li>—</li>
            )}
          </ul>

          {Object.keys(nutritional_values).length > 0 && (
            <div className="rp-nutrition">
              <div className="rp-nutrition-title">
                Nutrition Facts
                <div className="rp-nut-foot">
                  {serving > 0
                    ? `Per serving • ${serving} total ${serving === 1 ? "serving" : "servings"}`
                    : ""}
                </div>
              </div>

              {estimated_calories && (
                <div className="rp-cal-chip">
                  Calories {estimated_calories}
                </div>
              )}
              <div className="rp-nut-divider" />
              <div className="rp-nut-rows">
                {Object.entries(nutritional_values).map(([key, val]) => (
                  <div key={key} className="rp-nrow">
                    <span>{key}</span>
                    <span>{`${val} g`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rp-card">
          <h2 className="rp-h2">Instructions</h2>
          <p>✔️Mark every step as done</p>
          <ol className="rp-steps">
            {instructions.length ? (
              instructions.map((step, i) => {
                const n = i + 1;
                const done = doneSteps.includes(n);
                return (
                  <li
                    key={i}
                    className={`rp-step ${done ? "rp-step-done" : ""}`}
                    onClick={() => toggleStep(n)}
                    role="button"
                    aria-pressed={done}
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleStep(n)}
                  >
                    <div className={`rp-badge ${done ? "done" : ""}`}>
                      {done ? "✔" : n}
                    </div>

                    <div className="rp-step-body">
                      <div className="rp-step-text">{step}</div>
                    </div>

                    {/* === NEW: explicit toggle button per step === */}
                    <button
                      type="button"
                      className={`rp-step-toggle ${done ? "is-done" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation(); // don't trigger li's onClick
                        toggleStep(n);
                      }}
                      aria-pressed={done}
                      aria-label={done ? `Mark step ${n} as not done` : `Mark step ${n} as done`}
                    >
                      {done ? "Undo" : "Done"}
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="rp-step">
                <div className="rp-badge">—</div>
                <div className="rp-step-body">
                  <div className="rp-step-text">—</div>
                </div>
              </li>
            )}
          </ol>
        </section>
      </main>

      {/* ===== NEW: tiny confetti burst ===== */}
      {burst && (
        <div className="rp-burst" aria-hidden="true">
          {Array.from({ length: 16 }).map((_, i) => <span key={i}>🎉</span>)}
        </div>
      )}
    </div>
  );
}
