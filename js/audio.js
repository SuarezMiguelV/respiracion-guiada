let breathingSoundEnabled = false;
let breathingSoundVolume = 0.35;

let audioContext = null;
let noiseBuffer = null;
let activeSound = null;

function AudioContextClass() {
  return window.AudioContext || window.webkitAudioContext || null;
}

function ensureAudioContext() {
  if (audioContext) return audioContext;

  const Ctx = AudioContextClass();
  if (!Ctx) return null;

  audioContext = new Ctx();
  return audioContext;
}

function ensureNoiseBuffer(ctx) {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) {
    return noiseBuffer;
  }

  const durationSeconds = 4;
  const length = Math.floor(ctx.sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Ruido de aire suavizado. La memoria larga elimina gran parte
  // del siseo digital del ruido blanco.
  let slow = 0;
  let medium = 0;

  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    slow = slow * 0.985 + white * 0.015;
    medium = medium * 0.94 + white * 0.06;
    data[i] = Math.max(-1, Math.min(1, (slow * 0.62 + medium * 0.38) * 1.45));
  }

  noiseBuffer = buffer;
  return noiseBuffer;
}

function stopActiveSound() {
  if (!activeSound) return;

  try {
    const now = audioContext?.currentTime || 0;
    activeSound.gain.gain.cancelScheduledValues(now);
    activeSound.gain.gain.setTargetAtTime(0, now, 0.025);
    activeSound.source.stop(now + 0.08);
  } catch {
    // Puede ocurrir si la fuente ya terminó.
  }

  activeSound = null;
}

export async function primeBreathingAudio() {
  const ctx = ensureAudioContext();
  if (!ctx) return false;

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }

  ensureNoiseBuffer(ctx);
  return ctx.state === "running";
}

export function setBreathingSoundEnabled(value) {
  breathingSoundEnabled = Boolean(value);

  if (!breathingSoundEnabled) {
    stopActiveSound();
  }
}

export function getBreathingSoundEnabled() {
  return breathingSoundEnabled;
}

export function setBreathingSoundVolume(value) {
  const numeric = Number(value);
  const normalized = Number.isFinite(numeric) ? numeric : 0.35;
  breathingSoundVolume = Math.min(1, Math.max(0, normalized));
}

export function getBreathingSoundVolume() {
  return breathingSoundVolume;
}

export function stopBreathingSound() {
  stopActiveSound();
}

export function playBreathingSound(step, durationMs = 2000) {
  if (!breathingSoundEnabled) return;

  const ctx = ensureAudioContext();
  if (!ctx || ctx.state !== "running") return;

  stopActiveSound();

  const duration = Math.max(0.45, Number(durationMs || 2000) / 1000);
  const now = ctx.currentTime;
  const end = now + duration;

  const source = ctx.createBufferSource();
  source.buffer = ensureNoiseBuffer(ctx);
  source.loop = true;

  // Cadena de filtros pensada para parecer flujo de aire,
  // no ruido electrónico.
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.Q.setValueAtTime(0.35, now);

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.Q.setValueAtTime(0.38, now);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.Q.setValueAtTime(0.30, now);

  const gain = ctx.createGain();
  // V2.12: mayor margen de volumen.
  // Conserva el porcentaje elegido por el usuario, pero incrementa
  // el nivel acústico real respecto a V2.11.
  // V2.13: ganancia claramente mayor.
  // 100% debe tener presencia suficiente incluso con altavoces discretos.
  // El porcentaje visual y la preferencia guardada no cambian.
  const peak = Math.max(0.0001, breathingSoundVolume * 0.50);

  gain.gain.setValueAtTime(0.0001, now);

  if (step === "inhale") {
    highpass.frequency.setValueAtTime(125, now);

    bandpass.frequency.setValueAtTime(430, now);
    bandpass.frequency.exponentialRampToValueAtTime(760, end);

    lowpass.frequency.setValueAtTime(980, now);
    lowpass.frequency.exponentialRampToValueAtTime(1450, end);

    // Entrada muy gradual, pequeño crecimiento y salida suave.
    gain.gain.exponentialRampToValueAtTime(
      peak * 0.58,
      now + Math.min(0.42, duration * 0.28)
    );
    gain.gain.linearRampToValueAtTime(
      peak,
      now + Math.max(0.5, duration * 0.68)
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
  } else {
    highpass.frequency.setValueAtTime(82, now);

    bandpass.frequency.setValueAtTime(610, now);
    bandpass.frequency.exponentialRampToValueAtTime(330, end);

    lowpass.frequency.setValueAtTime(1120, now);
    lowpass.frequency.exponentialRampToValueAtTime(650, end);

    // Exhalación más cálida: aparece despacio y pierde energía al final.
    gain.gain.exponentialRampToValueAtTime(
      peak * 0.88,
      now + Math.min(0.28, duration * 0.20)
    );
    gain.gain.linearRampToValueAtTime(
      peak * 0.54,
      now + Math.max(0.5, duration * 0.70)
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
  }

  source.connect(highpass);
  highpass.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(ctx.destination);

  source.start(now);
  source.stop(end + 0.06);

  const soundRef = { source, gain };
  activeSound = soundRef;

  source.addEventListener("ended", () => {
    if (activeSound === soundRef) {
      activeSound = null;
    }
  });
}
