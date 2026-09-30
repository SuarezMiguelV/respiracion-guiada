let ctx = null;
let masterGain = null;
let activeNodes = [];
let activeTimers = [];
let ambientMode = "off";
let ambientVolume = 0.18;

const VALID_MODES = ["off", "deep", "binaural432", "tibetan", "piano"];

function ensureContext() {
  if (ctx) return ctx;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  ctx = new AudioContextClass();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(ctx.destination);

  return ctx;
}

function trackNode(node) {
  activeNodes.push(node);
  return node;
}

function trackTimer(timerId) {
  activeTimers.push(timerId);
  return timerId;
}

function clearTimers() {
  activeTimers.forEach(timerId => {
    clearInterval(timerId);
    clearTimeout(timerId);
  });
  activeTimers = [];
}

function clearNodes() {
  clearTimers();

  activeNodes.forEach(node => {
    try { node.stop?.(); } catch {}
    try { node.disconnect?.(); } catch {}
  });

  activeNodes = [];
}

function noiseBuffer(context, seconds = 4) {
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

function noiseLayer(context, type, frequency, q, gainValue) {
  const source = trackNode(context.createBufferSource());
  source.buffer = noiseBuffer(context);
  source.loop = true;

  const filter = trackNode(context.createBiquadFilter());
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;

  const gain = trackNode(context.createGain());
  gain.gain.value = gainValue;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start();

  return { source, filter, gain };
}

function modulateGain(context, targetGain, frequency, depth) {
  const lfo = trackNode(context.createOscillator());
  const lfoGain = trackNode(context.createGain());

  lfo.type = "sine";
  lfo.frequency.value = frequency;
  lfoGain.gain.value = depth;

  lfo.connect(lfoGain);
  lfoGain.connect(targetGain.gain);
  lfo.start();
}

function ocean(context) {
  noiseLayer(context, "lowpass", 900, 0.4, 0.30);
  const wave = noiseLayer(context, "bandpass", 380, 0.7, 0.22);
  modulateGain(context, wave.gain, 0.09, 0.14);
}

function riverDrop(context, when = context.currentTime) {
  const osc = context.createOscillator();
  const gain = context.createGain();

  let panner = null;
  if (typeof context.createStereoPanner === "function") {
    panner = context.createStereoPanner();
    panner.pan.value = (Math.random() * 1.2) - 0.6;
  }

  osc.type = "sine";
  osc.frequency.setValueAtTime(760 + Math.random() * 180, when);
  osc.frequency.exponentialRampToValueAtTime(360 + Math.random() * 80, when + 0.16);

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.020 + Math.random() * 0.012, when + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);

  osc.connect(gain);

  if (panner) {
    gain.connect(panner);
    panner.connect(masterGain);
  } else {
    gain.connect(masterGain);
  }

  osc.start(when);
  osc.stop(when + 0.24);
}

function river(context) {
  // Agua continua: varias bandas de ruido, más brillante y móvil que el antiguo viento.
  const body = noiseLayer(context, "lowpass", 1500, 0.25, 0.22);
  const current = noiseLayer(context, "bandpass", 2300, 0.65, 0.13);
  const sparkle = noiseLayer(context, "highpass", 3600, 0.2, 0.035);

  modulateGain(context, body.gain, 0.18, 0.055);
  modulateGain(context, current.gain, 0.31, 0.040);
  modulateGain(context, sparkle.gain, 0.47, 0.012);

  // Gotas discretas para dar sensación de corriente de agua.
  riverDrop(context, context.currentTime + 0.7);

  trackTimer(setInterval(() => {
    if (!ctx || ambientMode !== "river") return;
    riverDrop(ctx, ctx.currentTime + 0.02);
  }, 3400));

  trackTimer(setTimeout(() => {
    if (!ctx || ambientMode !== "river") return;
    riverDrop(ctx, ctx.currentTime + 0.02);

    trackTimer(setInterval(() => {
      if (!ctx || ambientMode !== "river") return;
      riverDrop(ctx, ctx.currentTime + 0.02);
    }, 5100));
  }, 1800));
}

function deep(context) {
  noiseLayer(context, "lowpass", 420, 0.3, 0.30);
}

function connectStereo(context, source, gain, panValue) {
  if (typeof context.createStereoPanner !== "function") {
    source.connect(gain);
    gain.connect(masterGain);
    return null;
  }

  const panner = trackNode(context.createStereoPanner());
  panner.pan.value = panValue;
  source.connect(gain);
  gain.connect(panner);
  panner.connect(masterGain);
  return panner;
}

function binaural432(context) {
  // Base audible de 432 Hz. El canal derecho usa 438 Hz:
  // una diferencia binaural de 6 Hz, perceptible principalmente con audífonos estéreo.
  const left = trackNode(context.createOscillator());
  const right = trackNode(context.createOscillator());
  const leftGain = trackNode(context.createGain());
  const rightGain = trackNode(context.createGain());

  left.type = "sine";
  right.type = "sine";
  left.frequency.value = 432;
  right.frequency.value = 438;

  leftGain.gain.value = 0.055;
  rightGain.gain.value = 0.055;

  connectStereo(context, left, leftGain, -1);
  connectStereo(context, right, rightGain, 1);

  // Fondo armónico muy ligero para que el tono resulte menos clínico.
  const base = trackNode(context.createOscillator());
  const baseGain = trackNode(context.createGain());
  base.type = "sine";
  base.frequency.value = 216;
  baseGain.gain.value = 0.014;
  base.connect(baseGain);
  baseGain.connect(masterGain);

  left.start();
  right.start();
  base.start();
}

function strikeBowl(context, frequency, when = context.currentTime) {
  const harmonics = [
    { ratio: 1, gain: 0.055, decay: 8.5 },
    { ratio: 2.01, gain: 0.021, decay: 6.5 },
    { ratio: 2.72, gain: 0.012, decay: 5.2 }
  ];

  harmonics.forEach(({ ratio, gain: level, decay }) => {
    const osc = context.createOscillator();
    const gain = context.createGain();

    let panner = null;
    if (typeof context.createStereoPanner === "function") {
      panner = context.createStereoPanner();
      panner.pan.value = (Math.random() * 0.7) - 0.35;
    }

    osc.type = ratio === 1 ? "sine" : "triangle";
    osc.frequency.setValueAtTime(frequency * ratio, when);

    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(level, when + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + decay);

    osc.connect(gain);

    if (panner) {
      gain.connect(panner);
      panner.connect(masterGain);
    } else {
      gain.connect(masterGain);
    }

    osc.start(when);
    osc.stop(when + decay + 0.1);
  });
}

function tibetan(context) {
  const notes = [174.61, 196.00, 261.63, 293.66];

  const playNext = () => {
    if (!ctx || ambientMode !== "tibetan") return;
    const frequency = notes[Math.floor(Math.random() * notes.length)];
    strikeBowl(ctx, frequency, ctx.currentTime + 0.02);
  };

  playNext();

  trackTimer(setInterval(playNext, 11800));

  trackTimer(setTimeout(() => {
    if (!ctx || ambientMode !== "tibetan") return;
    strikeBowl(ctx, 392.00, ctx.currentTime + 0.02);
  }, 6200));
}


function pianoNote(context, frequency, when, duration = 6.5, level = 0.025) {
  const fundamental = context.createOscillator();
  const upper = context.createOscillator();
  const shimmer = context.createOscillator();

  const gain = context.createGain();
  const upperGain = context.createGain();
  const shimmerGain = context.createGain();

  let panner = null;
  if (typeof context.createStereoPanner === "function") {
    panner = context.createStereoPanner();
    panner.pan.value = (Math.random() * 0.36) - 0.18;
  }

  fundamental.type = "sine";
  upper.type = "triangle";
  shimmer.type = "sine";

  fundamental.frequency.setValueAtTime(frequency, when);
  upper.frequency.setValueAtTime(frequency * 2.002, when);
  shimmer.frequency.setValueAtTime(frequency * 3.001, when);

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(level, when + 0.045);
  gain.gain.exponentialRampToValueAtTime(level * 0.44, when + 0.9);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

  upperGain.gain.setValueAtTime(0.0001, when);
  upperGain.gain.exponentialRampToValueAtTime(level * 0.20, when + 0.06);
  upperGain.gain.exponentialRampToValueAtTime(0.0001, when + duration * 0.72);

  shimmerGain.gain.setValueAtTime(0.0001, when);
  shimmerGain.gain.exponentialRampToValueAtTime(level * 0.07, when + 0.08);
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, when + duration * 0.48);

  fundamental.connect(gain);
  upper.connect(upperGain);
  shimmer.connect(shimmerGain);
  upperGain.connect(gain);
  shimmerGain.connect(gain);

  if (panner) {
    gain.connect(panner);
    panner.connect(masterGain);
  } else {
    gain.connect(masterGain);
  }

  fundamental.start(when);
  upper.start(when);
  shimmer.start(when);

  fundamental.stop(when + duration + 0.1);
  upper.stop(when + duration + 0.1);
  shimmer.stop(when + duration + 0.1);
}

function piano(context) {
  // Composición original minimalista y contemplativa.
  // Intervalos abiertos, silencios amplios y resonancias largas.
  const progression = [
    [220.00, 329.63],
    [196.00, 293.66],
    [174.61, 261.63],
    [146.83, 220.00],
    [164.81, 246.94],
    [130.81, 196.00]
  ];

  let index = 0;

  const playPhrase = () => {
    if (!ctx || ambientMode !== "piano") return;

    const [low, high] = progression[index % progression.length];
    const now = ctx.currentTime + 0.03;

    pianoNote(ctx, low, now, 7.4, 0.021);
    pianoNote(ctx, high, now + 1.15, 6.3, 0.016);

    if (index % 3 === 1) {
      pianoNote(ctx, high * 1.5, now + 3.8, 4.7, 0.008);
    }

    index += 1;
  };

  playPhrase();
  trackTimer(setInterval(playPhrase, 9200));
}

export async function primeAmbientAudio() {
  const context = ensureContext();
  if (!context) return false;

  if (context.state === "suspended") {
    await context.resume();
  }

  return true;
}

export function setAmbientVolume(value) {
  ambientVolume = Math.min(1, Math.max(0, Number(value) || 0));

  if (masterGain && ctx && ambientMode !== "off") {
    masterGain.gain.setTargetAtTime(ambientVolume, ctx.currentTime, 0.08);
  }
}

export async function startAmbient({ mode = "off", volume = 0.18 } = {}) {
  const context = ensureContext();
  if (!context) return false;

  if (context.state === "suspended") {
    await context.resume();
  }

  ambientMode = VALID_MODES.includes(mode) ? mode : "off";
  ambientVolume = Math.min(1, Math.max(0, Number(volume) || 0));

  clearNodes();

  if (ambientMode === "off") {
    masterGain.gain.setTargetAtTime(0, context.currentTime, 0.06);
    return true;
  }

  masterGain.gain.setTargetAtTime(ambientVolume, context.currentTime, 0.08);
  if (ambientMode === "deep") deep(context);
  if (ambientMode === "binaural432") binaural432(context);
  if (ambientMode === "tibetan") tibetan(context);
  if (ambientMode === "piano") piano(context);

  return true;
}

export function stopAmbient() {
  ambientMode = "off";
  clearNodes();

  if (masterGain && ctx) {
    masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.06);
  }
}
