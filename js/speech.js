let enabled = true;
let speechVolume = 1.0;
let selectedVoiceName = "auto";
const voiceListeners = new Set();

function allVoices() {
  if (!("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices() || [];
}

function spanishVoices() {
  return allVoices().filter(voice =>
    String(voice.lang || "").toLowerCase().startsWith("es")
  );
}

function isNaturalVoice(voice) {
  const text = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  return /natural|neural|online|premium|enhanced/.test(text);
}

function voiceScore(voice) {
  const lang = String(voice.lang || "").toLowerCase();
  const name = String(voice.name || "").toLowerCase();

  let score = 0;

  if (lang === "es-mx") score += 100;
  else if (lang === "es-us" || lang === "es-419") score += 85;
  else if (lang.startsWith("es")) score += 60;

  if (/microsoft|google|apple/.test(name)) score += 15;
  if (voice.default) score += 5;

  return score;
}

function autoRelaxingVoice() {
  const spanish = spanishVoices();
  if (!spanish.length) return null;

  const natural = spanish.filter(isNaturalVoice);
  const pool = natural.length ? natural : spanish;

  return [...pool].sort((a, b) => voiceScore(b) - voiceScore(a))[0] || null;
}

function resolveSelectedVoice() {
  const voices = spanishVoices();

  if (selectedVoiceName && selectedVoiceName !== "auto") {
    const exact = voices.find(voice => voice.name === selectedVoiceName);
    if (exact) return exact;
  }

  return autoRelaxingVoice();
}

function notifyVoiceListeners() {
  const options = getSpeechVoiceOptions();
  voiceListeners.forEach(listener => {
    try {
      listener(options);
    } catch (error) {
      console.error("Error en listener de voces:", error);
    }
  });
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.getVoices();

  const previous = window.speechSynthesis.onvoiceschanged;
  window.speechSynthesis.onvoiceschanged = event => {
    if (typeof previous === "function") {
      previous.call(window.speechSynthesis, event);
    }
    notifyVoiceListeners();
  };
}

export function setSpeechEnabled(value) {
  enabled = Boolean(value);

  if (!enabled && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function setSpeechVolume(value) {
  const numeric = Number(value);
  speechVolume = Number.isFinite(numeric)
    ? Math.min(1, Math.max(0, numeric))
    : 1.0;
}

export function getSpeechVolume() {
  return speechVolume;
}

export function setSpeechVoice(name = "auto") {
  selectedVoiceName = String(name || "auto");
}

export function getSpeechVoiceName() {
  return selectedVoiceName;
}

export function getSpeechVoiceOptions() {
  return spanishVoices()
    .map(voice => ({
      name: voice.name,
      lang: voice.lang,
      natural: isNaturalVoice(voice),
      default: Boolean(voice.default)
    }))
    .sort((a, b) => {
      if (a.natural !== b.natural) return a.natural ? -1 : 1;
      return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    });
}

export function getAutomaticVoiceLabel() {
  const voice = autoRelaxingVoice();
  return voice ? `${voice.name} · ${voice.lang}` : "Voz española disponible";
}

export function onSpeechVoicesChanged(listener) {
  if (typeof listener !== "function") return () => {};

  voiceListeners.add(listener);
  listener(getSpeechVoiceOptions());

  return () => voiceListeners.delete(listener);
}

export function speak(text, options = {}) {
  if (!enabled || !("speechSynthesis" in window)) return;

  const {
    interrupt = true,
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0
  } = options;

  if (interrupt) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const preferred = resolveSelectedVoice();

  if (preferred) {
    utterance.voice = preferred;
    utterance.lang = preferred.lang || "es-MX";
  } else {
    utterance.lang = "es-MX";
  }

  const calmRate = rate >= 0.8 ? rate * 0.92 : rate;

  utterance.rate = Math.max(0.1, Math.min(10, calmRate));
  utterance.pitch = Math.max(0, Math.min(2, pitch * 0.96));
  utterance.volume = Math.min(1, Math.max(0, volume * speechVolume));

  window.speechSynthesis.speak(utterance);
}
