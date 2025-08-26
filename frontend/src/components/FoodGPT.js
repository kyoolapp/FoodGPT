// src/components/FoodGPT.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

// Local suggestion list (swap for API later if you want)
const INGREDIENTS = [
  // Proteins
  'eggs','egg whites','chicken','salmon','tuna','shrimp','beef','pork','lamb',
  'tofu','paneer','tempeh','chickpeas','black beans','kidney beans','lentils',
  'turkey','sardines','mackerel','crab','lobster','clams','scallops',

  // Indian Daals / Pulses
  'toor dal','arhar dal','moong dal','moong whole','chana dal','black chana',
  'masoor dal','whole masoor','urad dal','whole urad','moth dal','kulthi dal',
  'rajma','lobia','kabuli chana','horse gram','green gram','yellow moong dal',
  'split urad dal','split masoor dal','sambar dal','pigeon peas',

  // Dairy & alternatives
  'milk','yogurt','greek yogurt','buttermilk','cream','whipping cream',
  'cheddar','mozzarella','feta','parmesan','gouda','brie','blue cheese',
  'butter','ghee','margarine','coconut milk','almond milk','soy milk','oat milk',

  // Grains & starches
  'rice','basmati rice','brown rice','quinoa','oats','rolled oats','steel-cut oats',
  'pasta','spaghetti','penne','macaroni','noodles','ramen','udon','soba',
  'bread','whole wheat bread','sourdough','baguette','tortilla','pita','naan',
  'potato','sweet potato','yam','plantain','barley','millet','couscous','bulgur',

  // Vegetables
  'spinach','kale','lettuce','romaine','arugula','cabbage','brussels sprouts',
  'tomato','cherry tomato','onion','red onion','green onion','shallot','garlic',
  'ginger','carrot','beet','cucumber','bell pepper','red pepper','green pepper','chili pepper',
  'mushroom','portobello','shiitake','broccoli','cauliflower','zucchini','squash','eggplant',
  'asparagus','okra','green beans','snow peas','snap peas','pumpkin','radish','turnip',
  'celery','leek','artichoke','fennel','avocado','corn','peas',

  // Fruits
  'apple','banana','orange','lemon','lime','mango','pineapple','grape','strawberry',
  'blueberry','raspberry','blackberry','peach','pear','plum','apricot','melon','watermelon',
  'pomegranate','kiwi','papaya','coconut','date','fig','cherry',

  // Herbs
  'basil','cilantro','parsley','mint','curry leaves','dill','rosemary','thyme','sage',
  'oregano','chives','bay leaf','lemongrass','tarragon',

  // Spices
  'cumin','turmeric','coriander','cardamom','cloves','nutmeg','cinnamon',
  'chili powder','garam masala','paprika','smoked paprika','cayenne pepper','mustard seeds',
  'black pepper','white pepper','salt','sea salt','saffron','fenugreek',

  // Condiments & sauces
  'ketchup','mustard','mayonnaise','soy sauce','fish sauce','oyster sauce','hoisin sauce',
  'sriracha','hot sauce','bbq sauce','vinegar','balsamic vinegar','apple cider vinegar',
  'olive oil','vegetable oil','canola oil','sesame oil','peanut butter','tahini','honey','maple syrup',

  // Baking & pantry
  'flour','whole wheat flour','almond flour','baking powder','baking soda',
  'sugar','brown sugar','powdered sugar','cocoa powder','vanilla extract','yeast',
  'cornstarch','arrowroot','gelatin','chocolate chips'
];


export default function FoodGPT({ userName }) {
  const navigate = useNavigate();

  const [foodInput, setFoodInput] = useState('');
  const [timeOption, setTimeOption] = useState('');
  const [serving, setServing] = useState('');
  const [toggled, setToggled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- Typeahead state ---
  const [openSug, setOpenSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);
  const sugRef = useRef(null);

  // token after the last comma
  const currentToken = useMemo(() => {
    const parts = foodInput.split(',');
    return parts[parts.length - 1].trim().toLowerCase();
  }, [foodInput]);

  // filter suggestions (replace with API if needed)
  useEffect(() => {
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
  }, [currentToken]);

  const acceptSuggestion = (value) => {
    const pick = value ?? suggestions[activeIdx];
    if (!pick) return;

    const parts = foodInput.split(',');
    parts[parts.length - 1] = ` ${pick}`; // neat space
    const next = parts.join(',').replace(/^,\s*/, '');
    setFoodInput(next.endsWith(',') ? next : next + ', ');
    setOpenSug(false);
  };

  const handleKeyDown = (e) => {
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
      if (
        !inputRef.current.contains(e.target) &&
        !sugRef.current.contains(e.target)
      ) {
        setOpenSug(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

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
    <div className="max-w-3xl mx-auto p-4" style={{ marginLeft: '20px' }}>
      <form onSubmit={handleSubmit} className="mb-4 kyool-form" style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={foodInput}
          onChange={(e) => setFoodInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter ingredients (e.g., eggs, spinach)"
          className="ingredients-input"
          aria-autocomplete="list"
          aria-expanded={openSug}
          aria-controls="ingredient-suggestions"
          aria-activedescendant={openSug ? `sug-${activeIdx}` : undefined}
        />
        <button
          style={{ marginLeft: '10px', borderRadius: '10px', cursor: 'pointer' }}
          type="submit"
          className="generate-btn"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Cook It'}
        </button>

        {/* Suggestions popover */}
        {openSug && suggestions.length > 0 && (
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
                  e.preventDefault(); // before blur
                  acceptSuggestion(s);
                }}
                onMouseEnter={() => setActiveIdx(i)}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </form>

      <div className="controls-row">
        {/* Oven toggle */}
<span>Oven Usage</span>

<button
  type="button"
  className={`toggle-btn ${toggled ? 'toggled' : ''}`}
  onClick={() => setToggled(!toggled)}
  role="switch"
  aria-checked={toggled}
  aria-label={`Oven ${toggled ? 'on' : 'off'}`}
  style={{ marginLeft: '20px', marginRight: '10px' }}
>
  <span className="thumb" />
</button>

<span>{toggled ? 'On' : 'Off'}</span>


        <select
          aria-label="Select time"
          style={{ marginLeft: '40px', cursor: 'pointer' }}
          value={timeOption}
          onChange={(e) => setTimeOption(e.target.value)}
          className="time-select"
        >
          <option value="" disabled>⏰ Cooking time</option>
          {['5','10','15','20','25','30','40','50','60'].map(val => (
            <option key={val} value={val}>
              {val} {val === '60' ? '1 hour' : 'minutes'}
            </option>
          ))}
        </select>

        <select
          aria-label="Select servings"
          style={{ marginLeft: '40px', cursor: 'pointer' }}
          value={serving}
          onChange={(e) => setServing(e.target.value)}
          className="serving-select"
        >
          <option value="" disabled>🥣 Servings</option>
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
