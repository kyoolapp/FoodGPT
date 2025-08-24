// src/components/FoodGPT.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FoodGPT.css';

/** Split input on commas only, trim, drop empties */
function normalizeIngredients(input) {
  if (!input) return [];
  return String(input)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export default function FoodGPT({ userName }) {
  const navigate = useNavigate();

  const [foodInput, setFoodInput] = useState('');
  const [timeOption, setTimeOption] = useState('10');
  const [serving, setServing] = useState('1');
  const [toggled, setToggled] = useState(false);   // oven toggle
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const ingredients = normalizeIngredients(foodInput);
    if (!ingredients.length) {
      setError('Please enter at least one ingredient (comma-separated).');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('https://api.kyoolapp.com/generate-recipe/', {
        ingredients,
        oven_option: toggled ? 'with' : 'without',
        time_option: timeOption ? parseInt(timeOption, 10) : null,
        serving_option: serving ? parseInt(serving, 10) : null,
        user_id: userName,
      });

      const rawPayload = res?.data?.response ?? res?.data ?? '';

      // Always store a string for reliability
      const rawString = typeof rawPayload === 'string'
        ? rawPayload
        : JSON.stringify(rawPayload);

      // Make it available if user refreshes the /recipe page
      sessionStorage.setItem('kyool:lastRecipe', rawString);

      // Navigate to the pretty recipe page; pass the raw content via state too
      navigate('/recipe', { state: { raw: rawString } });
    } catch (err) {
      console.error(err);
      setError('Something went wrong! Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4" style={{ marginLeft: '20px' }}>
      <form onSubmit={handleSubmit} className="mb-4 kyool-form">
        <input
          type="text"
          value={foodInput}
          onChange={(e) => setFoodInput(e.target.value)}
          placeholder="Enter ingredients (e.g., eggs, spinach)"
          className="ingredients-input"
        />
        <button
          style={{ marginLeft: '10px', borderRadius: '10px', cursor: 'pointer' }}
          type="submit"
          className="generate-btn"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Generate'}
        </button>
      </form>

      <div className="controls-row">
        <span>Oven</span>
        <button
          type="button"
          className={`toggle-btn ${toggled ? 'toggled' : ''}`}
          onClick={() => setToggled(!toggled)}
          style={{ marginLeft: '20px', marginRight: '10px' }}
          aria-pressed={toggled}
        >
          <div className="thumb"></div>
        </button>
        <span>{toggled ? 'On' : 'Off'}</span>

        <select
          style={{ marginLeft: '40px', cursor: 'pointer' }}
          value={timeOption}
          onChange={(e) => setTimeOption(e.target.value)}
          className="time-select"
        >
          <option value="5">5 minutes</option>
          <option value="10">10 minutes</option>
          <option value="15">15 minutes</option>
          <option value="20">20 minutes</option>
          <option value="25">25 minutes</option>
          <option value="30">30 minutes</option>
          <option value="40">40 minutes</option>
          <option value="50">50 minutes</option>
          <option value="60">1 hour</option>
        </select>

        <select
          style={{ marginLeft: '40px', cursor: 'pointer' }}
          value={serving}
          onChange={(e) => setServing(e.target.value)}
          className="serving-select"
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'serving' : 'servings'}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-500" style={{ marginTop: 12 }}>{error}</p>}
    </div>
  );
}
