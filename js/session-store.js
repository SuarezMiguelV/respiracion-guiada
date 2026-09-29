import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { db, firebaseConfigured } from "./firebase-config.js";

const OFFLINE_QUEUE_KEY = "respiracionGuiada.pendingSessions.v1";

function getStorage() {
  try {
    const key = "__rg_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return localStorage;
  } catch {
    return null;
  }
}

function makeSessionId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readQueue() {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(OFFLINE_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items) {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export function getPendingSessionCount(userId = null) {
  const items = readQueue();
  return userId ? items.filter(item => item.userId === userId).length : items.length;
}

export function queueCompletedSession(payload) {
  const sessionId = payload.sessionId || makeSessionId();
  const item = {
    ...payload,
    sessionId,
    startedAt: new Date(payload.startedAt).toISOString(),
    endedAt: new Date(payload.endedAt).toISOString(),
    queuedAt: new Date().toISOString()
  };

  const queue = readQueue().filter(existing => existing.sessionId !== sessionId);
  if (!writeQueue([...queue, item])) {
    throw new Error("No fue posible guardar la sesión pendiente.");
  }
  return item;
}

async function writeSession({
  sessionId = makeSessionId(),
  userId,
  startedAt,
  endedAt,
  config,
  retentions
}) {
  if (!firebaseConfigured || !db) throw new Error("Firebase no está configurado.");
  if (!userId) throw new Error("No hay un usuario autenticado.");

  const values = retentions.map(value => Number(value) || 0);
  const started = startedAt instanceof Date ? startedAt : new Date(startedAt);
  const ended = endedAt instanceof Date ? endedAt : new Date(endedAt);

  const averageRetentionSeconds = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

  const bestRetentionSeconds = values.length ? Math.max(...values) : 0;
  const durationSeconds = Math.max(0, Math.round((ended - started) / 1000));

  const ref = doc(db, "users", userId, "sessions", sessionId);

  await setDoc(ref, {
    status: "completed",
    clientSessionId: sessionId,
    startedAt: Timestamp.fromDate(started),
    endedAt: Timestamp.fromDate(ended),
    savedAt: serverTimestamp(),
    durationSeconds,
    breathsPerRound: config.breaths,
    plannedRounds: config.rounds,
    completedRounds: values.length,
    pace: config.pace,
    sessionPreset: config.sessionPreset || "custom",
    interRoundPauseSeconds: Math.max(0, Number(config.interRoundPauseSeconds) || 0),
    voiceCountInterval: [0, 5, 10].includes(Number(config.voiceCountInterval))
      ? Number(config.voiceCountInterval)
      : 10,
    voiceEnabled: Boolean(config.voice),
    breathingSoundEnabled: Boolean(config.breathingSound),
    retentionsSeconds: values,
    averageRetentionSeconds,
    bestRetentionSeconds
  }, { merge: true });

  return { id: sessionId, averageRetentionSeconds, bestRetentionSeconds, durationSeconds };
}

export async function saveCompletedSession(payload) {
  return writeSession({ sessionId: payload.sessionId || makeSessionId(), ...payload });
}

export async function syncPendingSessions(userId, onProgress = null) {
  const all = readQueue();
  const mine = all.filter(item => item.userId === userId);
  const others = all.filter(item => item.userId !== userId);

  let synced = 0;
  const failed = [];

  for (const item of mine) {
    try {
      await writeSession({
        ...item,
        startedAt: new Date(item.startedAt),
        endedAt: new Date(item.endedAt)
      });
      synced += 1;
      onProgress?.({ synced, total: mine.length });
    } catch (error) {
      console.warn("Sesión pendiente aún no sincronizada:", error);
      failed.push(item);
    }
  }

  writeQueue([...others, ...failed]);
  return { synced, remaining: failed.length };
}

export async function listCompletedSessions(userId, maxResults = 100) {
  if (!firebaseConfigured || !db) throw new Error("Firebase no está configurado.");
  if (!userId) throw new Error("No hay un usuario autenticado.");

  const sessionsRef = collection(db, "users", userId, "sessions");
  const q = query(
    sessionsRef,
    orderBy("startedAt", "desc"),
    limit(Math.min(Math.max(Number(maxResults) || 100, 1), 250))
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}


export async function deleteSessions(userId, sessionIds = []) {
  if (!firebaseConfigured || !db) throw new Error("Firebase no está configurado.");
  if (!userId) throw new Error("No hay un usuario autenticado.");

  const uniqueIds = [...new Set(sessionIds.filter(Boolean))];

  for (const sessionId of uniqueIds) {
    await deleteDoc(doc(db, "users", userId, "sessions", sessionId));
  }

  return uniqueIds.length;
}
