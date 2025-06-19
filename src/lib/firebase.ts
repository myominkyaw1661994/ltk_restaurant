import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
    apiKey: "AIzaSyBxHjG0ybXN8JwECceFAjAJ3cq72Qy1DeI",
    authDomain: "ltkrest-b23cf.firebaseapp.com",
    projectId: "ltkrest-b23cf",
    storageBucket: "ltkrest-b23cf.firebasestorage.app",
    messagingSenderId: "1014475709755",
    appId: "1:1014475709755:web:3d791a81bc9f8dbbb22b1e",
    measurementId: "G-Y1XP3LD6QZ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 
export const auth = getAuth(app); 