// src/components/Signup.js
import React, { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import axios from "axios"; // to save user details to your backend

export default function Signup({ onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [diet, setDiet] = useState(""); // e.g., vegetarian, vegan, keto
  const [allergies, setAllergies] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Create user with email/password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save extra details to backend
      await axios.post("https://api.kyoolapp.com/save-user-details", {
        uid: user.uid,
        name,
        email: user.email,
        diet,
        allergies,
      });

      onSignup(user); // update App.js state
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Save extra details if first-time login
      await axios.post("https://api.kyoolapp.com/save-user-details", {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        diet,
        allergies,
      });

      onSignup(user);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>

      <form onSubmit={handleEmailSignup} className="space-y-2">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Dietary Preferences (e.g., Vegan, Keto)"
          value={diet}
          onChange={(e) => setDiet(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Allergies (comma separated)"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up with Email"}
        </button>
      </form>

      <div className="my-4 text-center">OR</div>

      <button
        onClick={handleGoogleSignup}
        className="bg-red-500 text-white px-4 py-2 rounded w-full"
        disabled={loading}
      >
        {loading ? "Signing up..." : "Sign Up with Google"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
