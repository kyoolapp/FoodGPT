import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FoodGPT.css';
import INGREDIENTS from './ingredients.json'; 

function normalizeIngredients(input) {
  if (!input) return [];
  return String(input)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export default function FoodGPT({ userName, onNewRecipe }) {
  const navigate = useNavigate();

  const [mode, setMode] = useState('ingredients'); // 'ingredients' | 'dish'
  const [foodInput, setFoodInput] = useState('');
  const [timeOption, setTimeOption] = useState('');
  const [serving, setServing] = useState('');
  const [toggled, setToggled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- Typeahead state (ingredients mode only) ---
  const [openSug, setOpenSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);
  const sugRef = useRef(null);

  const currentToken = useMemo(() => {
    if (mode !== 'ingredients') return '';
    const parts = String(foodInput).split(',');
    return parts[parts.length - 1].trim().toLowerCase();
  }, [foodInput, mode]);

  useEffect(() => {
    if (mode !== 'ingredients') {
      setSuggestions([]);
      setOpenSug(false);
      setActiveIdx(0);
      return;
    }
    if (!currentToken) {
      setSuggestions([]);
      setOpenSug(false);
      setActiveIdx(0);
      return;
    }
    const found = INGREDIENTS
      .filter(x => x.toLowerCase().includes(currentToken))
      .slice(0, 8);
    setSuggestions(found);
    setOpenSug(found.length > 0);
    setActiveIdx(0);
  }, [currentToken, mode]);

  const acceptSuggestion = (value) => {
    if (mode !== 'ingredients') return;
    const pick = value ?? suggestions[activeIdx];
    if (!pick) return;

    const parts = String(foodInput).split(',');
    parts[parts.length - 1] = ` ${pick}`;
    const next = parts.join(',').replace(/^,\s*/, '');
    setFoodInput(next.endsWith(',') ? next : next + ', ');
    setOpenSug(false);
  };

  const handleKeyDown = (e) => {
    if (mode !== 'ingredients') return;
    if (!openSug && ['ArrowDown','ArrowUp','Enter','Tab'].includes(e.key)) {
      if (suggestions.length && currentToken) setOpenSug(true);
    }
    if (!openSug) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      e.preventDefault();
      acceptSuggestion();
    } else if (e.key === 'Escape') {
      setOpenSug(false);
    }
  };

  // click outside closes menu
  useEffect(() => {
    const onDocClick = (e) => {
      if (!inputRef.current || !sugRef.current) return;
      if (!inputRef.current.contains(e.target) && !sugRef.current.contains(e.target)) {
        setOpenSug(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let ingredients = [];
    let dishName = '';

    if (mode === 'ingredients') {
      ingredients = normalizeIngredients(foodInput);
      if (!ingredients.length) {
        setError('Please enter at least one ingredient (comma-separated).');
        return;
      }
    } else {
      dishName = String(foodInput).trim();
      if (!dishName) {
        setError('Please enter a dish name (e.g., “Pad Thai”, “Biryani”).');
        return;
      }
    }

    setLoading(true);
    try {
      const body = {
        oven_option: toggled ? 'with' : 'without',
        time_option: timeOption ? parseInt(timeOption, 10) : null,
        serving_option: serving ? parseInt(serving, 10) : null,
        user_id: userName,
      };

      if (mode === 'ingredients') {
        body.ingredients = ingredients;
        body.mode = 'ingredients';
      } else {
        body.ingredients = [];
        body.mode = 'dish';
        body.dish_name = dishName;
      }

      console.log("Request body:", body);

      const res = await axios.post('https://api.kyoolapp.com/generate-recipe/', body);

      const apiRecipe = res?.data?.response || {};
      const apiRecipeId = res?.data?.id || null;

      const selectedServing = serving ? parseInt(serving, 10) : apiRecipe.serving;
      const selectedTime = timeOption ? parseInt(timeOption, 10) : apiRecipe.time_option;

      const enrichedRecipe = {
        ...apiRecipe,
        ingredients: mode === 'ingredients' ? ingredients : (apiRecipe.ingredients ?? []),
        dish_name: mode === 'dish' ? dishName : (apiRecipe.dish_name ?? ''),
        mode,
        serving: selectedServing,
        time_option: selectedTime,
      };

      const recipeId = apiRecipeId || `local-${Date.now()}`;
      const historyItem = {
        id: recipeId,
        times: new Date().toLocaleString(),
        ...enrichedRecipe,
      };

      if (onNewRecipe) onNewRecipe(historyItem);
      sessionStorage.setItem('kyool:lastRecipe', JSON.stringify(historyItem));
      navigate(`/recipe/${recipeId}`, { state: { recipe: historyItem } });
    } catch (err) {
      console.error(err);
      setError('Please select time and servings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fg-wrap">
      <section className="fg-card">
        {/* Header */}
        <div className="fg-head">
          <div className="fg-title">
            <span className="fg-spark" aria-hidden>✨</span>
            <span>Generate a Recipe</span>
          </div>
        </div>

        {/* Tabs below title */}
        <div className="fg-tabs" role="tablist" aria-label="Recipe mode">
          <button
            role="tab"
            aria-selected={mode === 'ingredients'}
            className={`fg-tab ${mode === 'ingredients' ? 'active' : ''}`}
            onClick={() => setMode('ingredients')}
            type="button"
          >
            <span className="fg-tab-icon" aria-hidden>🥗</span>
            By Ingredients
          </button>
          <button
            role="tab"
            aria-selected={mode === 'dish'}
            className={`fg-tab ${mode === 'dish' ? 'active' : ''}`}
            onClick={() => setMode('dish')}
            type="button"
          >
            <span className="fg-tab-icon" aria-hidden>📖</span>
            By Dish Type
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="fg-form" style={{ position: 'relative' }}>
          <label className="fg-label">
            {mode === 'ingredients' ? 'Enter Ingredients , choose oven, time and servings, then hit cook it' : 'Enter a Dish'}
          </label>

          {/* Input */}
          <div className="fg-row-single">
            <input
              ref={inputRef}
              type="text"
              value={foodInput}
              onChange={(e) => setFoodInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'ingredients'
                  ? 'e.g. eggs, spinach, cheese, tomatoes'
                  : 'e.g. Pad Thai, Biryani, Alfredo pasta'
              }
              className="ingredients-input fg-input"
              aria-autocomplete={mode === 'ingredients' ? 'list' : undefined}
              aria-expanded={openSug}
              aria-controls="ingredient-suggestions"
              aria-activedescendant={openSug ? `sug-${activeIdx}` : undefined}
            />

            {mode === 'ingredients' && openSug && suggestions.length > 0 && (
              <ul
                id="ingredient-suggestions"
                ref={sugRef}
                role="listbox"
                className="typeahead-menu"
              >
                {suggestions.map((s, i) => (
                  <li
                    key={s}
                    id={`sug-${i}`}
                    role="option"
                    aria-selected={i === activeIdx}
                    className={`typeahead-item ${i === activeIdx ? 'active' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      acceptSuggestion(s);
                    }}
                    onMouseEnter={() => setActiveIdx(i)}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Controls row */}
          {mode === 'ingredients' && (
            <div className="fg-controls">
              {/* Oven */}
              <div className="fg-field fg-oven">
                <span className="fg-ico" aria-hidden>🔥</span>
                <span className="fg-field-label">Oven Usage</span>
                <button
                  type="button"
                  className={`toggle-btn ${toggled ? 'toggled' : ''}`}
                  onClick={() => setToggled(!toggled)}
                  role="switch"
                  aria-checked={toggled}
                  aria-label={`Oven ${toggled ? 'on' : 'off'}`}
                >
                  <span className="thumb" />
                </button>
                <span className="fg-oven-status">{toggled ? 'On' : 'Off'}</span>
              </div>

              {/* Time */}
              <div className="fg-field">
                <span className="fg-ico" aria-hidden>⏱️</span>
                <span className="fg-field-label">Cooking Time</span>
                <select
                  aria-label="Select time"
                  value={timeOption}
                  onChange={(e) => setTimeOption(e.target.value)}
                  className="fg-select"
                >
                  <option value="" disabled>Select time</option>
                  {['5','10','15','20','25','30','40','50','60'].map(val => (
                    <option key={val} value={val}>
                      {val === '60' ? '1 hour' : `${val} minutes`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Servings */}
              <div className="fg-field">
                <span className="fg-ico" aria-hidden>🧑‍🍳</span>
                <span className="fg-field-label">Servings</span>
                <select
                  aria-label="Select servings"
                  value={serving}
                  onChange={(e) => setServing(e.target.value)}
                  className="fg-select"
                >
                  <option value="" disabled>Select servings</option>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'serving' : 'servings'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="fg-cta-bar">
            <button type="submit" className="generate-btn fg-cta" disabled={loading}>
              <span className="fg-cta-icon" aria-hidden>🍳</span>
              {loading ? 'Loading…' : 'Cook It'}
            </button>
          </div>

          {error && <p className="fg-error">{error}</p>}
        </form>
      </section>
    </div>
  );
}
