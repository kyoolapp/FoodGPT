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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if(currentUser){
        try{
          //Check if user exists in the database
          const res = await axios.post("https:api.kyoolapp.com/check-user",{
            uid: currentUser.uid
          });
          if(res.data.isNewUser){
            setFirstLogin(true); //show signup page
          }else{
            setFirstLogin(false); //show main app
          }
        }catch(err){
          console.error("Error checking user:", err);
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
      <FoodGPT />

      
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