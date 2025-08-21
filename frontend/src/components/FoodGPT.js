import React, { useState } from 'react';
import axios from 'axios';
import './FoodGPT.css';

export default function FoodGPT({userName}) {
  const [foodInput, setFoodInput] = useState('');
  const [ovenOption, setOvenOption] = useState('with');
  const [timeOption, setTimeOption] = useState('10');
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toggled, setToggled] = useState(false);
  const [serving, setServing] = useState('1');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:8000/generate-recipe/', {
        ingredients: foodInput.split(',').map(i => i.trim()), 
        oven_option: toggled ? 'with' : 'without',
        time_option: timeOption ? parseInt(timeOption) : null,
        serving_option: serving ? parseInt(serving) : null,
        user_id: userName, // Pass the user ID
      });
      setRecipe(res.data.response);
    } catch (err) {
      setError('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4" style={{marginLeft: '20px'}}>
      
      <form onSubmit={handleSubmit} className="mb-4">
        {/* Food Input */}
        <input
          type="text"
          value={foodInput}
          onChange={(e) => setFoodInput(e.target.value)}
          placeholder="Enter food (e.g., eggs and spinach)"
          className="ingredients-input"
        />

         {/* Generate Button */}
        <button style={{ marginLeft: '10px', borderRadius: '10px', cursor: 'pointer' }}
          type="submit"
          className="generate-btn"
        >
          {loading ? 'Loading...' : 'Generate'}
        </button>
        
      </form>
        {/* Oven Option Dropdown 
        <select style={{ marginTop: '10px', cursor: 'pointer' }}
          value={ovenOption}
          onChange={(e) => setOvenOption(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="with">With Oven</option>
          <option value="without">Without Oven</option>
        </select>*/}

      {/* Oven Option Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '10px 10px' }}>
        <span>Oven</span>
        <button
          type="button"
          className={`toggle-btn ${toggled ? "toggled" : ""}`}
          onClick={() => setToggled(!toggled)}
          style={{ marginLeft: '20px', marginRight: '10px' }}
          >
          <div className="thumb"></div>
        </button>
        <span>{toggled ? "On" : "Off"}</span>


          {/* Time Option Input */}
        <select style={{ marginLeft: '40px',cursor: 'pointer' }}
          value={timeOption}
          onChange={(e) => setTimeOption(e.target.value)}
          //placeholder="Enter time in minutes (e.g., 10, 20, 30)"
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


         {/* Serving Input */}
        <select style={{ marginLeft: '40px',cursor: 'pointer' }}
          value={serving}
          onChange={(e) => setServing(e.target.value)}
          //placeholder="Enter time in minutes (e.g., 10, 20, 30)"
          className="serving-select"
        >
          <option value="1">1 serving</option>
          <option value="2">2 servings</option>
          <option value="3">3 servings</option>
          <option value="4">4 servings</option>
          <option value="5">5 servings</option>
          <option value="6">6 servings</option>
          <option value="7">7 servings</option>
          <option value="8">8 servings</option>
          <option value="9">9 servings</option>
          <option value="10">10 servings</option>
        </select>
      </div>

        
      
        

        

      {error && <p className="text-red-500">{error}</p>}
      {recipe && (
        <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
          {recipe}
        </div>
      )}

    </div>
  );
}

