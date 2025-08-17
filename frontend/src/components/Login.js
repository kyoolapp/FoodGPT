// src/Login.js
//This page handles the login logic, does not open up in the website
import { useState } from "react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import './Login.css';
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Google login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user);
    } catch (err) {
      console.error(err);
    }
  };

  // Email/password login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      onLogin(result.user);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="login-container">
      <h1 className="app-heading">KyoolApp</h1>
      <h1 className="login-text">Login</h1>
      <p className="login-subtext">Please use google sign-in for now</p>
      
      <form onSubmit={handleEmailLogin} className="flex flex-col gap-2 mb-4">
        <div>
          <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-email"
        />
        </div>

        <div>
          <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-password"
        />
        </div>
        
        <div>
          <button type="submit" className="login-btn">
          Login
        </button>
        </div>
        
      </form>

      <button
        onClick={handleGoogleLogin}
        className="signin-google-btn"
      >
        Sign in with Google
      </button>
    </div>
  );
}

export default Login;
