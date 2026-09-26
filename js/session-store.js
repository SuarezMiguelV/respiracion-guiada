import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { db, firebaseConfigured } from "./firebase-config.js";

export async function saveCompletedSession({
  userId,
  startedAt,
  endedAt,
  config,
  retentions
}) {
  if (!firebaseConfigured || !db) {
    throw new Error("Firebase no está configurado.");
  }

  if (!userId) {
    throw new Error("No hay un usuario autenticado.");
  }

  const values = retentions.map(value => Number(value) || 0);

  const averageRetentionSeconds = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

  const bestRetentionSeconds = values.length
    ? Math.max(...values)
    : 0;

  const durationSeconds = Math.max(
    0,
    Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
  );

  const docRef = await addDoc(
    collection(db, "users", userId, "sessions"),
    {
      status: "completed",
      startedAt,
      endedAt,
      savedAt: serverTimestamp(),

      durationSeconds,

      breathsPerRound: config.breaths,
      plannedRounds: config.rounds,
      completedRounds: values.length,
      pace: config.pace,

      voiceEnabled: Boolean(config.voice),
      breathingSoundEnabled: Boolean(config.breathingSound),

      retentionsSeconds: values,
      averageRetentionSeconds,
      bestRetentionSeconds
    }
  );

  return {
    id: docRef.id,
    averageRetentionSeconds,
    bestRetentionSeconds,
    durationSeconds
  };
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
