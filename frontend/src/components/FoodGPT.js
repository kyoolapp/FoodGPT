import React, { useState } from 'react';
import axios from 'axios';

export default function FoodGPT() {
  const [foodInput, setFoodInput] = useState('');
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('https://api.kyoolapp.com:8000/generate-recipe/', {
        ingredients: foodInput.split(',').map(i => i.trim()),
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
        <input
          type="text"
          value={foodInput}
          onChange={(e) => setFoodInput(e.target.value)}
          placeholder="Enter food (e.g., eggs and spinach)"
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 mt-2 rounded hover:bg-blue-600"
        >
          {loading ? 'Loading...' : 'Generate'}
        </button>
      </form>

      {error && <p className="text-red-500">{error}</p>}
      {recipe && (
        <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
          {recipe}
        </div>
      )}
    </div>
  );
}
