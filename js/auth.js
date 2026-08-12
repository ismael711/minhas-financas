/**
 * Módulo de Autenticação (Firebase Auth)
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

/**
 * Traduz códigos de erro do Firebase Auth para mensagens amigáveis em português
 * @param {string} errorCode 
 * @returns {string} Mensagem traduzida
 */
export function getFriendlyErrorMessage(errorCode) {
  switch (errorCode) {
    case "auth/invalid-email":
      return "O endereço de e-mail é inválido.";
    case "auth/user-disabled":
      return "Esta conta de usuário foi desativada.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "E-mail ou senha incorretos. Verifique suas credenciais.";
    case "auth/email-already-in-use":
      return "Este e-mail já está cadastrado no sistema.";
    case "auth/weak-password":
      return "A senha deve ter pelo menos 6 caracteres.";
    case "auth/missing-password":
      return "Por favor, digite uma senha.";
    case "auth/too-many-requests":
      return "Muitas tentativas malsucedidas. Tente novamente mais tarde.";
    case "auth/network-request-failed":
      return "Falha de conexão com a rede. Verifique sua internet.";
    case "auth/invalid-api-key":
      return "Chave de API do Firebase inválida. Verifique o arquivo js/firebase-config.js.";
    default:
      return "Ocorreu um erro ao processar a autenticação. Tente novamente.";
  }
}

/**
 * Realiza o login de um usuário existente
 * @param {string} email 
 * @param {string} password 
 */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: getFriendlyErrorMessage(error.code), code: error.code };
  }
}

/**
 * Cadastra um novo usuário
 * @param {string} email 
 * @param {string} password 
 */
export async function registerUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: getFriendlyErrorMessage(error.code), code: error.code };
  }
}

/**
 * Desconecta o usuário atualmente autenticado
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: getFriendlyErrorMessage(error.code) };
  }
}

/**
 * Adiciona um observador para mudanças no estado de autenticação
 * @param {Function} callback 
 */
export function initAuthListener(callback) {
  onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}
