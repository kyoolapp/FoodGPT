// src/components/WaterReminder.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./WaterReminder.css";

/**
 * Props (all optional):
 * - userId: string (for per-user localStorage key)
 * - startInMinutes: number (first reminder delay; default 30)
 * - intervalMinutes: number (regular interval; default 30)
 * - snoozeMinutes: number (snooze; default 15)
 * - mlPerClick: number (amount per drink; default 250)
 * - dailyTarget: number (ml per day; default 2000)
 */
export default function WaterReminder({
  userId,
  startInMinutes = 30,
  intervalMinutes = 30,
  snoozeMinutes = 15,
  mlPerClick = 250,
  dailyTarget = 2000,
}) {
  // ---------- helpers ----------
  const todayKey = () => new Date().toISOString().slice(0, 10);
  const storageKey = (uid) => `kyool:water:${uid || "anon"}`;

  const key = useMemo(() => storageKey(userId), [userId]);
  const day = todayKey();

  const [cardOpen, setCardOpen] = useState(false);
  const [intake, setIntake] = useState(0);
  const [target, setTarget] = useState(dailyTarget);
  const [nextAt, setNextAt] = useState(Date.now() + startInMinutes * 60_000);

  // celebration state
  const [celebrating, setCelebrating] = useState(false);
  const prevPct = useRef(0);

  // ---------- load from storage ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const obj = JSON.parse(raw);
        const d = obj[day] || {};

        setIntake(Number.isFinite(d.intakeMl) ? d.intakeMl : 0);
        setTarget(Number.isFinite(d.targetMl) ? d.targetMl : dailyTarget);

        // If nextAt doesn't exist or is in the past, schedule from now
        const restoredNext =
          typeof d.nextAt === "number" && d.nextAt > Date.now()
            ? d.nextAt
            : Date.now() + startInMinutes * 60_000;
        setNextAt(restoredNext);
      } else {
        const seed = {
          [day]: {
            intakeMl: 0,
            targetMl: dailyTarget,
            nextAt: Date.now() + startInMinutes * 60_000,
          },
        };
        localStorage.setItem(key, JSON.stringify(seed));
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, day]);

  // ---------- persist ----------
  const save = (patch = {}) => {
    try {
      const raw = localStorage.getItem(key);
      const obj = raw ? JSON.parse(raw) : {};
      obj[day] = {
        intakeMl: intake,
        targetMl: target,
        nextAt,
        ...(obj[day] || {}),
        ...patch,
      };
      localStorage.setItem(key, JSON.stringify(obj));
    } catch {
      /* ignore */
    }
  };

  // ---------- page visibility: don't pop while hidden ----------
  const isVisibleRef = useRef(document.visibilityState === "visible");
  useEffect(() => {
    const onVis = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // ---------- reminder loop ----------
  useEffect(() => {
    const id = setInterval(() => {
      if (!isVisibleRef.current) return;
      if (Date.now() >= nextAt) setCardOpen(true);
    }, 30_000); // poll every 30s
    return () => clearInterval(id);
  }, [nextAt]);

  // ---------- new-day reset (in case the tab stays open) ----------
  useEffect(() => {
    const id = setInterval(() => {
      const nowKey = todayKey();
      if (nowKey !== day) {
        // roll to new day
        setIntake(0);
        setTarget(dailyTarget);
        const nAt = Date.now() + startInMinutes * 60_000;
        setNextAt(nAt);
        setCardOpen(false);

        // seed storage for new day
        try {
          const raw = localStorage.getItem(key);
          const obj = raw ? JSON.parse(raw) : {};
          obj[nowKey] = {
            intakeMl: 0,
            targetMl: dailyTarget,
            nextAt: nAt,
          };
          localStorage.setItem(key, JSON.stringify(obj));
        } catch {}
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [day, key, dailyTarget, startInMinutes]);

  // ---------- derived ----------
  const pct = Math.min(100, Math.round((intake / Math.max(target, 1)) * 100));
  const complete = pct === 100;

  // ---------- celebration at 100% ----------
  useEffect(() => {
    if (prevPct.current < 100 && pct === 100) {
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), 1600);
      return () => clearTimeout(t);
    }
    prevPct.current = pct;
  }, [pct]);

  // ---------- actions ----------
  const scheduleFromNow = (mins) => {
    const t = Date.now() + mins * 60_000;
    setNextAt(t);
    save({ nextAt: t });
  };

  const logDrink = () => {
    const nextIntake = Math.min(target, intake + mlPerClick);
    setIntake(nextIntake);
    // After drinking, schedule the next reminder for the regular interval
    scheduleFromNow(intervalMinutes);
    setCardOpen(false);
    save({ intakeMl: nextIntake });
  };

  const acknowledge = () => {
    // “Thanks” = push to the regular interval (not snooze)
    scheduleFromNow(intervalMinutes);
    setCardOpen(false);
  };

  const snooze = () => {
    scheduleFromNow(snoozeMinutes);
    setCardOpen(false);
  };

  // ---------- UI ----------
  return (
    <>
      {/* Floating bottle (top-right) */}
      <button
        type="button"
        className={`wr-bottle ${complete ? "wr-complete" : ""}`}
        aria-label={`Water: ${pct}% of daily goal`}
        onClick={() => setCardOpen(true)}
      >
        {/* celebration burst when complete */}
        {celebrating && (
          <div className="wr-burst" aria-hidden>
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="wr-spark"
                style={{
                  "--ang": `${(360 / 24) * i}deg`,
                  "--dist": `${28 + Math.random() * 16}px`,
                  "--delay": `${Math.random() * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}

        <svg viewBox="0 0 64 128" className="wr-bottle-svg" aria-hidden>
          <defs>
            <clipPath id="wr-clip">
              <rect x="14" y="18" width="36" height="96" rx="12" ry="12" />
            </clipPath>
            <linearGradient id="wr-shimmer" x1="0" x2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(255,255,255,.55)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          {/* cap */}
          <rect x="22" y="6" width="20" height="8" rx="3" fill="currentColor" opacity="0.85" />
          {/* outline */}
          <rect
            x="14"
            y="14"
            width="36"
            height="104"
            rx="14"
            ry="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
          />

          <g clipPath="url(#wr-clip)">
            {/* water fill */}
            <rect
              className="wr-water"
              x="14"
              y={114 - (96 * pct) / 100}
              width="36"
              height={(96 * pct) / 100}
              rx="10"
            />
            {/* wave top */}
            <path
              className="wr-wave"
              d={`M14 ${114 - (96 * pct) / 100} 
                  Q32 ${110 - (96 * pct) / 100 - 2} 50 ${114 - (96 * pct) / 100}
                  V120 H14 Z`}
            />
            {/* shimmer when complete */}
            {complete && (
              <rect className="wr-shimmer" x="14" y="18" width="36" height="96" fill="url(#wr-shimmer)" />
            )}
          </g>
        </svg>
        <span className="wr-perc">{pct}%</span>
      </button>

      {/* Popup card */}
      {cardOpen && (
        <div className="wr-overlay" role="dialog" aria-modal="true" aria-label="Water reminder">
          <div className="wr-card">
            <button className="wr-x" onClick={() => setCardOpen(false)} aria-label="Close">
              ×
            </button>

            <div className="wr-icon">
              <div className="wr-icon-circle">
                <span>💧</span>
              </div>
            </div>

            <h3 className="wr-title">
              Time for a sip <span role="img" aria-label="droplet">💧</span>
            </h3>
            <p className="wr-sub">Tiny sips, big wins.</p>

            <button className="wr-cta wr-primary" onClick={logDrink}>
              <span className="wr-cta-ico">💦</span> I Drank ({mlPerClick} ml)
            </button>

            <button className="wr-cta wr-ghost" onClick={acknowledge}>
              👍 Thanks
            </button>

            <button className="wr-snooze" onClick={snooze}>
              ⏰ Snooze for {snoozeMinutes} minutes
            </button>

            <div className="wr-progress">
              <div className="wr-progress-bar" style={{ width: `${pct}%` }} />
            </div>
            <div className="wr-progress-text">
              {intake} / {target} ml today
            </div>
          </div>
        </div>
      )}
    </>
  );
}
