import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDfVL1tc94UQ8tkMMynaGETgcSFPWRzFGU",
    authDomain: "shinoscholl.firebaseapp.com",
    projectId: "shinoscholl",
    storageBucket: "shinoscholl.firebasestorage.app",
    messagingSenderId: "1039007248538",
    appId: "1:1039007248538:web:764992f9bb8f0f43b3af23",
    measurementId: "G-81H2RM2C1G"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);


// const firebaseConfig = {
//   apiKey: "AIzaSyDfVL1tc94UQ8tkMMynaGETgcSFPWRzFGU",
//   authDomain: "shinoscholl.firebaseapp.com",
//   projectId: "shinoscholl",
//   storageBucket: "shinoscholl.firebasestorage.app",
//   messagingSenderId: "1039007248538",
//   appId: "1:1039007248538:web:764992f9bb8f0f43b3af23",
//   measurementId: "G-81H2RM2C1G"
// };

// const firebaseConfig = {
//     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//     appId: import.meta.env.VITE_FIREBASE_APP_ID
// };


