import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { auth, db, firebaseConfigured } from "./firebase-config.js";

export const DEFAULT_PREFERENCES = Object.freeze({
  breaths: 30,
  rounds: 4,
  pace: "normal",
  sessionPreset: "normal",
  interRoundPauseSeconds: 0,
  voice: true,
  voiceVolume: 1.0,
  voiceName: "auto",
  breathingSound: false,
  breathingSoundVolume: 0.35
});

const VALID_BREATHS = new Set([30, 40, 50, 60]);
const VALID_ROUNDS = new Set([4, 5, 6, 7, 8, 9, 10]);
const VALID_PACES = new Set(["verySlow", "slow", "normal", "fast"]);
const VALID_PRESETS = new Set(["soft", "normal", "intense", "custom"]);
const VALID_INTER_ROUND_PAUSES = new Set([0, 5, 10, 15, 30]);

export function normalizePreferences(preferences = {}) {
  const breaths = Number(preferences.breaths);
  const rounds = Number(preferences.rounds);
  const pace = String(preferences.pace || "");
  const sessionPreset = String(preferences.sessionPreset || "");
  const interRoundPauseSeconds = Number(preferences.interRoundPauseSeconds);

  return {
    breaths: VALID_BREATHS.has(breaths) ? breaths : DEFAULT_PREFERENCES.breaths,
    rounds: VALID_ROUNDS.has(rounds) ? rounds : DEFAULT_PREFERENCES.rounds,
    pace: VALID_PACES.has(pace) ? pace : DEFAULT_PREFERENCES.pace,
    sessionPreset: VALID_PRESETS.has(sessionPreset)
      ? sessionPreset
      : DEFAULT_PREFERENCES.sessionPreset,
    interRoundPauseSeconds: VALID_INTER_ROUND_PAUSES.has(interRoundPauseSeconds)
      ? interRoundPauseSeconds
      : DEFAULT_PREFERENCES.interRoundPauseSeconds,
    voice: typeof preferences.voice === "boolean"
      ? preferences.voice
      : DEFAULT_PREFERENCES.voice,
    voiceVolume: Number.isFinite(Number(preferences.voiceVolume))
      ? Math.min(1, Math.max(0, Number(preferences.voiceVolume)))
      : DEFAULT_PREFERENCES.voiceVolume,
    voiceName: typeof preferences.voiceName === "string" && preferences.voiceName.trim()
      ? preferences.voiceName.trim()
      : DEFAULT_PREFERENCES.voiceName,
    breathingSound: typeof preferences.breathingSound === "boolean"
      ? preferences.breathingSound
      : DEFAULT_PREFERENCES.breathingSound,
    breathingSoundVolume: Number.isFinite(Number(preferences.breathingSoundVolume))
      ? Math.min(1, Math.max(0, Number(preferences.breathingSoundVolume)))
      : DEFAULT_PREFERENCES.breathingSoundVolume
  };
}


export { firebaseConfigured };

function assertFirebase() {
  if (!firebaseConfigured || !auth || !db) {
    throw new Error("Firebase todavía no está configurado.");
  }
}

export async function ensureUserProfile(user) {
  assertFirebase();

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName || "",
      email: user.email || "",
      role: "user",
      preferences: { ...DEFAULT_PREFERENCES },
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
    return {
      uid: user.uid,
      displayName: user.displayName || "",
      email: user.email || "",
      role: "user",
      preferences: { ...DEFAULT_PREFERENCES }
    };
  }

  const profile = snap.data();
  const preferences = normalizePreferences(profile.preferences);

  // Actualiza datos seguros sin tocar el rol y migra preferencias
  // de usuarios creados antes de V2.8.
  await setDoc(ref, {
    displayName: user.displayName || profile.displayName || "",
    email: user.email || profile.email || "",
    preferences,
    lastLoginAt: serverTimestamp()
  }, { merge: true });

  return { uid: user.uid, ...profile, preferences };
}

export async function registerUser({ name, email, password }) {
  assertFirebase();

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });

  const ref = doc(db, "users", credential.user.uid);
  await setDoc(ref, {
    displayName: name,
    email,
    role: "user",
    preferences: { ...DEFAULT_PREFERENCES },
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp()
  });

  return credential.user;
}

export async function loginUser({ email, password }) {
  assertFirebase();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(credential.user);
  return credential.user;
}

export async function logoutUser() {
  assertFirebase();
  await signOut(auth);
}

export function watchAuth(callback) {
  if (!firebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export async function getUserProfile(uid) {
  assertFirebase();
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

export async function listUserProfiles() {
  assertFirebase();
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs
    .map(item => ({ uid: item.id, ...item.data() }))
    .sort((a, b) => String(a.displayName || a.email || "").localeCompare(
      String(b.displayName || b.email || ""),
      "es",
      { sensitivity: "base" }
    ));
}


export async function saveUserPreferences(uid, preferences) {
  assertFirebase();

  if (!uid) {
    throw new Error("No hay un usuario autenticado.");
  }

  const normalized = normalizePreferences(preferences);

  await setDoc(doc(db, "users", uid), {
    preferences: normalized,
    preferencesUpdatedAt: serverTimestamp()
  }, { merge: true });

  return normalized;
}

export function friendlyAuthError(error) {
  const code = error?.code || "";

  const messages = {
    "auth/email-already-in-use": "Ese correo ya está registrado.",
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/too-many-requests": "Demasiados intentos. Espera un momento y vuelve a intentar.",
    "permission-denied": "No tienes permiso para realizar esta acción."
  };

  return messages[code] || error?.message || "Ocurrió un error inesperado.";
}
