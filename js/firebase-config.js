/**
 * Configuração do Firebase para a aplicação "minhas-financas"
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

// Credenciais do aplicativo web no Firebase
const firebaseConfig = {
  apiKey: "AIzaSyARVSJMfuG9TZY-WYz2RWfA8OeeYbgkGz8",
  authDomain: "minhas-financas-app-59854.firebaseapp.com",
  projectId: "minhas-financas-app-59854",
  storageBucket: "minhas-financas-app-59854.firebasestorage.app",
  messagingSenderId: "1066277852085",
  appId: "1:1066277852085:web:28030dac71fa0585d4bffc",
  measurementId: "G-EN97Z1S06K"
};

// Inicializa e exporta as instâncias do Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

