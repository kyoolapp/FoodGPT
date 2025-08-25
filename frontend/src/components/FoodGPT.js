// src/components/FoodGPT.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FoodGPT.css';

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
  const [toggled, setToggled] = useState(false);
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
        serving_option: serving ? parseInt(serving, 10) : 1,
        user_id: userName,
      });

      const recipeData = res?.data?.response;
      sessionStorage.setItem('kyool:lastRecipe', JSON.stringify(recipeData));
      navigate('/recipe', { state: { recipe: recipeData } });

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
{/* Oven label */}
<span>Oven</span>

{/* UNIQUE: Rotating oven knob (replaces old toggle button) */}
<div
  role="switch"
  aria-checked={toggled}
  tabIndex={0}
  className={`oven-knob ${toggled ? 'on' : 'off'}`}
  onClick={() => setToggled(!toggled)}
  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setToggled(!toggled)}
  style={{ marginLeft: '20px', marginRight: '10px' }}
>
  <div className="knob-face">
    <div className="knob-pointer" />
    <div className="knob-center">
      <div className="flame" />
    </div>
  </div>
  {/* decorative arc ticks */}
  <div className="knob-arc">
    <span className="tick t0" />
    <span className="tick t1" />
    <span className="tick t2" />
    <span className="tick t3" />
    <span className="tick t4" />
  </div>
</div>

{/* On/Off text */}
<span>{toggled ? 'On' : 'Off'}</span>


        <select
          style={{ marginLeft: '40px', cursor: 'pointer' }}
          value={timeOption}
          onChange={(e) => setTimeOption(e.target.value)}
          className="time-select"
        >
          {['5','10','15','20','25','30','40','50','60'].map(val => (
            <option key={val} value={val}>{val} {val==='60'?'1 hour':'minutes'}</option>
          ))}
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
