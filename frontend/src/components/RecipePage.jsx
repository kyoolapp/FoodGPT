// src/components/RecipePage.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./RecipePage.css";

export default function RecipePage() {
  const { state } = useLocation();
  const recipe = state?.recipe || null;  // unified prop from history or FoodGPT

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
        <section className="rp-card">
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
              <div className="rp-nutrition-title">Nutrition Facts

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
                    <span>{val} g</span>
                  </div>
                ))}
              </div>
              
              
            </div>
          )}
        </section>

        <section className="rp-card">
          <h2 className="rp-h2">Instructions</h2>
          <ol className="rp-steps">
            {instructions.length ? (
              instructions.map((step, i) => (
                <li key={i} className="rp-step">
                  <div className="rp-badge">{i + 1}</div>
                  <div className="rp-step-body">
                    <div className="rp-step-text">{step}</div>
                  </div>
                </li>
              ))
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
    </div>
  );
}
