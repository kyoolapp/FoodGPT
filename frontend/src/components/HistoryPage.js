// src/components/HistoryPage.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

/* ---------- site url helper ---------- */
const SITE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) || // Vite
  process.env.REACT_APP_SITE_URL ||                                         // CRA
  "https://www.kyoolapp.com";                                               // fallback

/* ---------- selection helpers (match App.js or move to utils) ---------- */
const selKey = (id) => `kyool:selections:${id}`;
function normalizeSelections(obj = {}) {
  const selected_time = obj.selected_time ?? obj.time_option ?? obj.cook_time ?? null;
  const selected_servings = obj.selected_servings ?? obj.serving ?? obj.servings ?? null;
  const normalized = {};
  if (selected_time != null) { normalized.selected_time = selected_time; normalized.time_option = selected_time; }
  if (selected_servings != null) { normalized.selected_servings = selected_servings; normalized.serving = selected_servings; }
  return normalized;
}
function readSelections(id) {
  try { const raw = sessionStorage.getItem(selKey(id)); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

/* ---------- robust timestamp parsing -> local date/time ---------- */
function toDateSafe(v) {
  if (!v && v !== 0) return null;

  if (typeof v === "number") {
    // epoch seconds vs ms
    return new Date(v < 1e12 ? v * 1000 : v);
  }

  if (typeof v === "string") {
    let s = v.trim();

    s = s.replace(" ", "T");
    // trim fractional seconds to ms precision
    s = s.replace(/(\.\d{3})\d+$/, "$1");
    // if no timezone marker, assume UTC
    if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) s += "Z";

    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function fmtDateLocal(v) {
  const d = toDateSafe(v);
  if (!d) return null;
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function fmtTimeLocal(v) {
  const d = toDateSafe(v);
  if (!d) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/* ---------------------- Component ---------------------- */
export default function HistoryPage({ history }) {
  const [q, setQ] = React.useState("");
  const [sortBy, setSortBy] = React.useState("newest"); // newest | name
  const navigate = useNavigate();

  const enriched = React.useMemo(
    () =>
      (history || []).map((it) => {
        const saved = readSelections(it.id);
        const normalized = normalizeSelections(it);
        return { ...it, ...saved, ...normalized };
      }),
    [history]
  );

  const filteredSorted = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    const byQuery = enriched.filter((r) => {
      if (!t) return true;
      const name = (r.recipe_name || "").toLowerCase();
      const ings = (r.ingredients || []).join(" ").toLowerCase();
      return name.includes(t) || ings.includes(t);
    });

    const toTs = (v) => {
      const d = toDateSafe(v);
      return d ? d.getTime() : 0;
    };

    return [...byQuery].sort((a, b) => {
      if (sortBy === "name") return (a.recipe_name || "").localeCompare(b.recipe_name || "");
      const ta = toTs(a.times);
      const tb = toTs(b.times);
      return tb - ta; // newest first
    });
  }, [enriched, q, sortBy]);

  // group by calendar day (local)
  const grouped = React.useMemo(() => {
    const map = new Map();
    for (const r of filteredSorted) {
      const label = fmtDateLocal(r.times) || "Undated";
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(r);
    }
    return Array.from(map.entries());
  }, [filteredSorted]);

  // -------- share with id-only url --------
  const onShare = async (item) => {
    const title = item.recipe_name || "Recipe";
    const url = `${SITE_URL}/recipe/${item.id}`;
    const text = `${title} – ${url}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        alert("Link copied to clipboard");
      } else {
        window.prompt("Copy this link:", text);
      }
    } catch {
      /* user canceled */
    }
  };

  const openRecipe = (item) =>
    navigate(`/recipe/${item.id}`, { state: { recipe: item } });

  const onCardKeyDown = (e, item) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openRecipe(item);
    }
  };

  return (
    <>
      {/* HERO */}
      <header className="app-hero history-hero">
        <nav className="nav">
          <div className="brand">
            <img src="/kyoolapp_logo.png" alt="logo" className="brand-logo" />
            <h2>KyoolApp</h2>
          </div>
          <div className="nav-actions">
            <Link to="/" className="btn-ghost">Home</Link>
            <button onClick={() => signOut(auth)} className="btn-ghost">Log out</button>
          </div>
        </nav>

        <div className="hero-content hero-center">
          <div className="history-emoji" aria-hidden>⏱️</div>
          <h1 className="hero-title">Recipe History</h1>
          <p className="hero-sub">Your culinary journey, organized by time and taste.</p>
        </div>

        <svg className="hero-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,64L80,69.3C160,75,320,85,480,96C640,107,800,117,960,106.7C1120,96,1280,64,1360,48L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </header>

      {/* CONTROLS */}
      <main className="history-wrap">
        <div className="history-controls card">
          <div className="hc-left">
            <button className="pill pill-active" type="button">List View</button>
          </div>
          <div className="hc-right">
            <input
              className="input"
              placeholder="Search recipes or ingredients"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
        </div>

        {/* GROUPS */}
        {grouped.length === 0 ? (
          <div className="empty">
            <div className="empty-emoji">🔎</div>
            <p>No recipes yet — try generating your first one.</p>
            <Link to="/" className="btn">Back to Home</Link>
          </div>
        ) : (
          grouped.map(([label, items]) => (
            <section key={label} className="group-card">
              <div className="group-head">
                <div className="gh-left">
                  <span className="gh-icon" aria-hidden>📅</span>
                  <span className="gh-title">{label}</span>
                  <span className="gh-count">{items.length} {items.length === 1 ? "recipe" : "recipes"}</span>
                </div>
              </div>

              <ul className="group-list">
                {items.map((item) => {
                  const chips = (item.ingredients || []).slice(0, 6);
                  const time = item.selected_time || item.time_option || item.cook_time;
                  const servings = item.selected_servings || item.serving || item.servings;
                  const kcal = item.calories || item.kcal || null;

                  return (
                    <li key={item.id} className="gi">
                      <div className="gi-inner">
                        <div
                          className="gi-main"
                          onClick={() => openRecipe(item)}
                          onKeyDown={(e) => onCardKeyDown(e, item)}
                          role="button"
                          tabIndex={0}
                        >
                          <h3 className="gi-title">{item.recipe_name || "Recipe"}</h3>

                        <div className="gi-chips">
                            {chips.map((c, i) => (
                              <span key={i} className="chip chip-soft">
                              {typeof c === "string"
        ? c
        : c && typeof c === "object"
          ? `${c.quantity ?? ""} ${c.item ?? ""}`.trim()
          : ""}
    </span>
  ))}
  {(item.ingredients || []).length > chips.length && (
    <span className="chip chip-soft chip-more">
      +{(item.ingredients || []).length - chips.length}
    </span>
  )}
</div>

                          <div className="gi-meta">
                            {time ? <span>⏱ {time}</span> : null}
                            {servings ? <span>👥 {servings} servings</span> : null}
                            {kcal ? <span>🔥 {kcal} kcal</span> : null}
                          </div>
                        </div>

                        <div className="gi-right">
                          <span className="gi-time">{fmtTimeLocal(item.times)}</span>
                          <button className="link-btn" onClick={() => openRecipe(item)}>
                            <span aria-hidden>🍽️</span> View Recipe
                          </button>
                          <button className="link-btn" onClick={() => onShare(item)}>
                            <span aria-hidden>🔗</span> Share
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </main>
    </>
  );
}