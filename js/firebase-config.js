/**
 * Configuração do Firebase para a aplicação "minhas-financas"
 * 
 * INSTRUÇÕES:
 * 1. Acesse o Console do Firebase (https://console.firebase.google.com/)
 * 2. Crie ou selecione seu projeto.
 * 3. Adicione um App Web (ícone </>) e copie o objeto `firebaseConfig`.
 * 4. Substitua os valores dos placeholders abaixo pelas suas credenciais reais.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Objeto de configuração com placeholders
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJECT_ID.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT_ID.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicializa a aplicação Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias de Autenticação e Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
