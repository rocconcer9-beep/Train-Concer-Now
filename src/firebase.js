import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBN3fRyHF9t6bsyMKYNEGG4MOoZMCTl1LU",
  authDomain: "train-concer-now.firebaseapp.com",
  databaseURL: "https://train-concer-now-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "train-concer-now",
  storageBucket: "train-concer-now.firebasestorage.app",
  messagingSenderId: "1020122335078",
  appId: "1:1020122335078:web:c940e09f5e4ffdf86a2aa7"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
