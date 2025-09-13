// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCTKVFE5c3SPar9Jd3szwml1dqyFa35aVQ",
  authDomain: "math-9dc24.firebaseapp.com",
  databaseURL: "https://math-9dc24-default-rtdb.firebaseio.com",
  projectId: "math-9dc24",
  storageBucket: "math-9dc24.firebasestorage.app",
  messagingSenderId: "952351794711",
  appId: "1:952351794711:web:09bb279117fa7b04315e52",
  measurementId: "G-NB7D3C2T9W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
export default app;