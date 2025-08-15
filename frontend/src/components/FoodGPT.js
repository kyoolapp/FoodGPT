import React, { useState } from 'react';
import axios from 'axios';

export default function FoodGPT() {
  const [foodInput, setFoodInput] = useState('');
  const [ovenOption, setOvenOption] = useState('with');
  const [timeOption, setTimeOption] = useState('');
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('https://api.kyoolapp.com/generate-recipe/', {
        ingredients: foodInput.split(',').map(i => i.trim()),
        oven_option: ovenOption,
        time_option: timeOption ? parseInt(timeOption) : null,
      });
      setRecipe(res.data.response);
    } catch (err) {
      setError('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">🍳 FoodGPT Recipe Generator</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        {/* Food Input */}
        <input
          type="text"
          value={foodInput}
          onChange={(e) => setFoodInput(e.target.value)}
          placeholder="Enter food (e.g., eggs and spinach)"
          className="w-full p-2 border rounded"
        />
         {/* Generate Button */}
        <button style={{ marginLeft: '10px', borderRadius: '50px', cursor: 'pointer' }}
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 mt-2 rounded hover:bg-blue-600"
        >
          {loading ? 'Loading...' : 'Generate'}
        </button>
      </form>
{/* Oven Option Dropdown */}
        <select style={{ marginTop: '10px', cursor: 'pointer' }}
          value={ovenOption}
          onChange={(e) => setOvenOption(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="with">With Oven</option>
          <option value="without">Without Oven</option>
        </select>
{/* Time Option Input */}
        <input style={{ marginLeft: '10px' }}
          type="number"
          value={timeOption}
          onChange={(e) => setTimeOption(e.target.value)}
          placeholder="Enter time in minutes (e.g., 10, 20, 30)"
          className="w-full p-2 border rounded"
        />

      {error && <p className="text-red-500">{error}</p>}
      {recipe && (
        <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
          {recipe}
        </div>
      )}
    </div>
  );
}
