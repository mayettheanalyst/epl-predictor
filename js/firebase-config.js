import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔥 REPLACE THIS WITH YOUR FIREBASE CONFIG FROM CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyAaqYXuYEg_pIPMHfbz7i1jcVCgeGJ_4zs",
  authDomain: "epl-predictor-ae53f.firebaseapp.com",
  projectId: "epl-predictor-ae53f",
  storageBucket: "epl-predictor-ae53f.firebasestorage.app",
  messagingSenderId: "956744043344",
  appId: "1:956744043344:web:79a7bdedc55d14eec43a55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, app };