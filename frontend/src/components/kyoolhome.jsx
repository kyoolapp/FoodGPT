//import React from 'react';
import React, {useState} from 'react';
import './kyoolhome.css'; // You can use inline styles if preferred

export default function KyoolHome() {
    const [ingredients, setIngredients] = useState('');
  const [time, setTime] = useState('<15 min');
  const [skill, setSkill] = useState('Beginner');
  const [diet, setDiet] = useState('Any');

  const handleSubmit = async () => {
    const data = {
      ingredients,
      time,
      skill,
      diet,
    };

    try {
      const response = await fetch('http://localhost:5000/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('Recipes:', result);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };
  return (
    <div className="kyool-container">
      <header className="header">
        <span className="logo">kyool.io</span>
        <button className="login-btn">Log in</button>
      </header>

      <main className="main-content">
        <h1 className="title">Cook Cool with Kyool</h1>
        <p className="subtitle">
          Turn the groceries you have into quick, easy recipes with AI.
        </p>

        <div className="input-section">
          <input className="input" type="text" placeholder="Enter ingredients here..." />
          <button className="get-recipes-btn">Get Recipes</button>
        </div>

        <div className="input-modes">
          <div className="mode">
            <span role="img" aria-label="keyboard">⌨️</span>
            <p>Manual entry</p>
          </div>
          <div className="mode">
            <span role="img" aria-label="mic">🎤</span>
            <p>Voice</p>
          </div>
          <div className="mode">
            <span role="img" aria-label="barcode">� barcode</span>
            <p>Scan</p>
          </div>
          <div className="mode">
            <span role="img" aria-label="camera">📷</span>
            <p>Photo</p>
          </div>
        </div>

        <div className="filters">
          <button className="filter-btn">Time: &lt; 15 min</button>
          <button className="filter-btn">Skill: Beginner</button>
          <button className="filter-btn">Diet: Any</button>
        </div>

        <section className="how-it-works">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <span role="img" aria-label="ingredients">🥕🍎</span>
              <p>Provide ingredients</p>
            </div>
            <div className="step">
              <span role="img" aria-label="filters">🎚️</span>
              <p>Customize filters</p>
            </div>
            <div className="step">
              <span role="img" aria-label="recipe">📄</span>
              <p>Get recipes instantly</p>
            </div>
          </div>
          <button className="get-started-btn">Get Started</button>
        </section>
      </main>
    </div>
  );
}
