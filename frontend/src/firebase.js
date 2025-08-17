// src/firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDFetWj5GK0_V4adz5CgQ8kI9NA7uJ7tmk",
  authDomain: "foodgpt-468206.firebaseapp.com",
  projectId: "foodgpt-468206",
  storageBucket: "foodgpt-468206.firebasestorage.app",
  messagingSenderId: "570409171798",
  appId: "1:570409171798:web:e412ec33e804adad39b4f7",
  measurementId: "G-DK4X74B8Y7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Auth instance
const auth = getAuth(app);

// Google provider
const googleProvider = new GoogleAuthProvider();
export { auth, googleProvider, signInWithPopup, signOut };


