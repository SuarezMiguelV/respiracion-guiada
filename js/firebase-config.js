import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/*
  1. Firebase Console > Project settings > Your apps > Web app.
  2. Copia aquí tu firebaseConfig.
  3. NO copies service-account keys ni contraseñas a este archivo.

  La apiKey de una app web Firebase forma parte de la configuración pública
  del cliente; la seguridad real se controla con Authentication y Firestore Rules.
*/
export const firebaseConfig = {
  apiKey: "AIzaSyDp8fjbNBant3EXlDnCQq8etCR8xU4_JyY",
  authDomain: "respiracion-guiada.firebaseapp.com",
  projectId: "respiracion-guiada",
  storageBucket: "respiracion-guiada.firebasestorage.app",
  messagingSenderId: "19155526934",
  appId: "1:19155526934:web:2be9a525f089f30eb69c37"
};

export const firebaseConfigured =
  !Object.values(firebaseConfig).some(value => String(value).includes("REEMPLAZAR"));

export const firebaseApp = firebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = firebaseConfigured ? getAuth(firebaseApp) : null;
export const db = firebaseConfigured ? getFirestore(firebaseApp) : null;
