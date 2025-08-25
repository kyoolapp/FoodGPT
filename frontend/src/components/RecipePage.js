// src/components/RecipePage.jsx
import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './RecipePage.css';


/* ---------- helpers: pull & repair sloppy JSON ---------- */
function stripFences(s = '') {
  return String(s).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}
function takeFirstJsonBlock(s = '') {
  const txt = stripFences(s);
  const start = txt.search(/[{\[]/);
  if (start === -1) return null;
  let depth = 0, end = -1;
  const open = txt[start];
  const close = open === '{' ? '}' : ']';
  for (let i = start; i < txt.length; i++) {
    const ch = txt[i];
    if (ch === '"' || ch === "'") {
      const q = ch; i++;
      for (; i < txt.length; i++) { if (txt[i] === '\\') { i++; continue; } if (txt[i] === q) break; }
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  return end > start ? txt.slice(start, end).trim() : null;
}
function repairJsonLoose(s = '') {
  return s
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*(?=[}\]])/g, '')
    .replace(/([{,]\s*)([A-Za-z_][\w-]*)(\s*):/g, '$1"$2"$3:')
    .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
}
function tryParseJsonLenient(input) {
  if (!input) return null;
  if (typeof input === 'object') return input;
  const block = takeFirstJsonBlock(String(input));
  if (!block) return null;
  try { return JSON.parse(block); } catch {}
  try { return JSON.parse(repairJsonLoose(block)); } catch {}
  return null;
}

/* ---------- parser: robust to many shapes ---------- */
function parseRecipe(textOrJson, { servingFallback = 1 } = {}) {
  if (!textOrJson) return null;
  const obj = tryParseJsonLenient(textOrJson);

  if (obj) {
    const root = Array.isArray(obj) ? obj[0] : obj;

    const title = root.title || root.recipe_name || root.name || 'Recipe';
    const description = root.description || root.short_description || '';

    // Ingredients
    let ingredientsArr = root.ingredients ?? root.ingredient_list ?? [];
    if (typeof ingredientsArr === 'string') {
      ingredientsArr = ingredientsArr
        .split(/\r?\n+|,/)
        .map(s => s.replace(/^\s*(?:-+|•|\*|\d+[\.)])\s*/, '').trim())
        .filter(Boolean);
    }
    if (ingredientsArr && !Array.isArray(ingredientsArr) && typeof ingredientsArr === 'object') {
      ingredientsArr = Object.values(ingredientsArr || {}).map(String);
    }
    const ingredients = (Array.isArray(ingredientsArr) ? ingredientsArr : [])
      .map(it => {
        if (typeof it === 'string') return it.trim();
        if (!it || typeof it !== 'object') return '';
        const q = it.quantity ?? it.qty ?? '';
        const u = it.unit ?? '';
        const n = it.name ?? it.item ?? it.ingredient ?? '';
        return [q, u, n].filter(Boolean).join(' ').trim();
      })
      .filter(Boolean);

    // Steps
    let stepsArr = root.instructions ?? root.directions ?? root.steps ?? root.method ?? [];
    if (typeof stepsArr === 'string') {
      stepsArr = stepsArr.split(/\r?\n+/)
        .map(s => s.replace(/^\s*(?:\d+[\.)]|-+|•|\*)\s*/, '').trim())
        .filter(Boolean);
    }
    if (stepsArr && !Array.isArray(stepsArr) && typeof stepsArr === 'object') {
      stepsArr = Object.entries(stepsArr)
        .sort(([a],[b]) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
        .map(([,v]) => String(v));
    }
    const steps = (Array.isArray(stepsArr) ? stepsArr : [])
      .map((st, i) => {
        if (typeof st === 'string') return { n: i + 1, text: st.trim(), est: null };
        const text = (st.text ?? st.step ?? '').toString().trim();
        const est  = st.time ?? st.duration ?? st.estimate ?? null;
        return { n: i + 1, text, est };
      })
      .filter(s => s.text);

    const meta = {
      totalTime: root.total_time || root.time_total || '',
      prepTime: root.prep_time || root.time_prep || '',
      cookTime: root.cook_time || root.time_cook || '',
      servings: (root.servings ?? root.serving ?? root.serving_option ?? servingFallback),
      difficulty: root.difficulty || 'Easy',
      cuisine: root.cuisine || 'American',
    };

    // Nutrition
    const nutrition = {};
    const nu = root.nutrition || root.nutrition_facts || root.nutritional_values || {};
    if (Array.isArray(nu)) {
      nu.forEach(x => {
        const k = (x.name || x.key || '').toString().trim();
        const v = (x.value || '').toString().trim();
        if (k && v) nutrition[k] = v;
      });
    } else if (nu && typeof nu === 'object') {
      Object.entries(nu).forEach(([k, v]) => {
        const nice = k.charAt(0).toUpperCase() + k.slice(1);
        nutrition[nice] = String(v);
      });
    }
    if (root.estimated_calories) nutrition['Calories'] = String(root.estimated_calories);

    return { title, description, ingredients, steps, nutrition, meta, tips: root.tips || root.pro_tips || [] };
  }

  // Basic text fallback
  const raw = String(textOrJson).replace(/\r/g, '').trim();
  const lines = raw.split('\n').map(s => s.trim());
  const firstLine = lines.find(l => l.length) || 'Recipe';
  return { title: firstLine, description: '', ingredients: [], steps: [], nutrition: {}, meta: { servings: servingFallback } };
}

/* ---------- page ---------- */
export default function RecipePage() {
  const { state } = useLocation();
  const raw = state?.raw || state?.response || '';
  const parsed = useMemo(() => parseRecipe(raw, { servingFallback: 1 }), [raw]);

  const { title, ingredients = [], steps = [], nutrition = {}, meta = {} } = parsed || {};
  const servingsNum = Number(meta?.servings ?? 0);

  // normalize nutrition keys + friendly order
  const alias = {
    protein: 'Protein',
    carbohydrates: 'Carbohydrates',
    carbs: 'Carbohydrates',
    fat: 'Fat',
    fibre: 'Fiber',
    fiber: 'Fiber',
    sugar: 'Sugar',
    calories: 'Calories',
  };
  const norm = {};
  Object.entries(nutrition).forEach(([k, v]) => {
    const key = alias[k.toLowerCase()] || (k.charAt(0).toUpperCase() + k.slice(1));
    norm[key] = String(v);
  });
  const wanted = ['Protein','Carbohydrates','Fat','Fiber','Sugar'];

  const formatNut = (key, val) => {
    const s = String(val ?? '').trim();
    if (!s) return '';
    const k = String(key || '').toLowerCase();
    if (k === 'calorie' || k === 'calories') return s;
    if (/\b(kcal|cal|kj|g|mg|mcg|ug|grams?|%)\b/i.test(s) || /[a-zA-Z]%?$/.test(s)) return s;
    const num = Number(s);
    return Number.isFinite(num) ? `${s} g` : s;
  };

  return (
    <div className="rp-root">
      {/* HERO */}
      <header className="rp-hero">
        <div className="rp-hero-inner">
          <Link to="/" className="rp-back">← Back to Home</Link>
          <h1 className="rp-title">{title || 'Recipe'}</h1>
          {servingsNum > 0 && <div className="rp-sub">{servingsNum} {servingsNum === 1 ? 'serving' : 'servings'}</div>}
        </div>
        <svg className="rp-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,64L80,69.3C160,75,320,85,480,96C640,107,800,117,960,106.7C1120,96,1280,64,1360,48L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </header>

      {/* MAIN */}
      <main className="rp-main">
        {/* LEFT: Ingredients + Nutrition BELOW */}
        <section className="rp-card">
          <h2 className="rp-h2">Ingredients</h2>
          <ul className="rp-ingredients">
            {ingredients.length ? ingredients.map((it, i) => <li key={i}>{it}</li>) : <li>—</li>}
          </ul>

          {/* NUTRITION CARD (moved here under Ingredients) */}
          {Object.keys(norm).length > 0 && (
            <div className="rp-nutrition">
              <div className="rp-nutrition-title">Nutrition Facts</div>
              {'Calories' in norm && (
                <div className="rp-cal-chip">Calorie {norm['Calories']}</div>
              )}
              <div className="rp-nut-divider" />
              <div className="rp-nut-rows">
                {wanted.filter(k => k in norm).map((k) => (
                  <div key={k} className="rp-nrow">
                    <span>{k}</span>
                    <span>{formatNut(k, norm[k])}</span>
                  </div>
                ))}
              </div>
              <div className="rp-nut-divider" />
              <div className="rp-nut-foot">
                {meta?.prepTime && meta?.cookTime
                  ? `Prep: ${meta.prepTime} • Cook: ${meta.cookTime}`
                  : meta?.totalTime
                  ? `Total: ${meta.totalTime}`
                  : ''}
              </div>
              <div className="rp-nut-foot">
                {servingsNum > 0 ? `Per serving • ${servingsNum} total ${servingsNum === 1 ? 'serving' : 'servings'}` : ''}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: Instructions only */}
        <section className="rp-card">
          <h2 className="rp-h2">Instructions</h2>
          <ol className="rp-steps">
            {steps.length ? steps.map((s) => (
              <li key={s.n} className="rp-step">
                <div className="rp-badge">{s.n}</div>
                <div className="rp-step-body">
                  <div className="rp-step-text">{s.text}</div>
                  {s.est && <div className="rp-step-time">~{s.est}</div>}
                </div>
              </li>
            )) : (
              <li className="rp-step">
                <div className="rp-badge">—</div>
                <div className="rp-step-body"><div className="rp-step-text">—</div></div>
              </li>
            )}
          </ol>
        </section>
      </main>
    </div>
  );
}
