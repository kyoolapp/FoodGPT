import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import React from 'react';
import FoodGPT from './components/FoodGPT';
import KyoolHome from './components/kyoolhome';
import Login from './components/Login';
import Signup from './components/Signup';
import { useEffect, useState } from 'react';
import {auth} from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

function App() {
  const [user, setUser] = useState(null);
  const [firstLogin, setFirstLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if(currentUser){
        

        try {
    const res = await axios.get(`https://api.kyoolapp.com/history/${currentUser.displayName || currentUser.email}`);
    setHistory(res.data.history);
    console.log("Current User:", res.data.history);
  } catch (err) {
    console.error("Error fetching history:", err);
  }
  
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);


  if (loading) return <div>Loading...</div>;

  
  if (!user) {
    return <Login onLogin={setUser} />;
  }
  if (firstLogin) {
    return<Signup onSignup={(u) => {setUser(u); setFirstLogin(false);}} />;
  }

  return (
    <div>
      
      <h1 className="app-heading">KyoolApp</h1>
      <p className="app-slogan">Cook cool with Kyool</p>
      <div className="welcome-header" style={{ marginLeft: '10px', marginTop: '20px' }}>
      <h1 className="greet-user">Welcome, {user.displayName || user.email}</h1>
      <FoodGPT userName={user.displayName||user.email}/>


    {history.length > 0 && (
    <div className="recent-history" style={{ margin: '20px' }}>
    <h2>Recent Recipes</h2>
    <ul>
      {history.map(item => (
        <li key={item.id} style={{ marginBottom: '10px' }}>
          <strong>Ingredients:</strong> {item.ingredients.join(", ")}<br/>
          <strong>Recipe:</strong> {item.response}
        </li>
      ))}
    </ul>
    </div>
    )}
    
    </div>
    <div >
    <button 
        onClick={() => signOut(auth)}
        className="logout-btn"
      >
        Log out
      </button>

    </div>
    </div>
    
    
  );
}

export default App;


{/*function App() {
  return (
    <div className="App">
        <FoodGPT />
       
    </div>
  );
}

export default App;
*/}