// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBD3OfmzS-8g-r33sDxHrRnzAAv9W0PEw0",
  authDomain: "taskmanager-f5cca.firebaseapp.com",
  projectId: "taskmanager-f5cca",
  storageBucket: "taskmanager-f5cca.firebasestorage.app",
  messagingSenderId: "823893705145",
  appId: "1:823893705145:web:563d2b4d366634b091f668",
  measurementId: "G-4K4YB08LXW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);