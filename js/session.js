import { formatClock } from "./utils.js";
import { speak } from "./speech.js";
import { playBreathingSound, stopBreathingSound } from "./audio.js";

const PACE = {
  verySlow: { inhale: 3200, exhale: 3200 },
  slow: { inhale: 2600, exhale: 2600 },
  normal: { inhale: 2000, exhale: 2000 },
  fast: { inhale: 1500, exhale: 1500 }
};

const VOICE_TRANSITION_LEAD = 1500;
const PREPARE_PAUSE = 800;
const RECOVERY_RELEASE_PAUSE = 1700;

export class SessionEngine {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.runToken = 0;
    this.phase = "idle";
    this.retentionInterval = null;
    this.retentionStartedAt = null;
    this.resolveRetention = null;
    this.retentions = [];
  }

  async start(config) {
    this.stop(false);

    const token = ++this.runToken;
    this.retentions = [];
    this.phase = "preparing";
    this.config = config;

    const pace = PACE[config.pace] || PACE.normal;

    this.callbacks.onSessionStarted?.(config);

    await this.sleepAccurate(VOICE_TRANSITION_LEAD, token);
    if (!this.isActive(token)) return;

    speak("Prepárate", { interrupt: true });
    await this.sleepAccurate(PREPARE_PAUSE, token);
    if (!this.isActive(token)) return;

    this.callbacks.onStartCountdown?.(3);
    await this.sleepAccurate(1000, token);
    if (!this.isActive(token)) return;

    this.callbacks.onStartCountdown?.(2);
    await this.sleepAccurate(1000, token);
    if (!this.isActive(token)) return;

    this.callbacks.onStartCountdown?.(1);
    await this.sleepAccurate(1000, token);
    if (!this.isActive(token)) return;

    this.callbacks.onStartCountdown?.("COMIENZA");
    speak("Comienza", { interrupt: true });
    await this.sleepAccurate(VOICE_TRANSITION_LEAD, token);
    if (!this.isActive(token)) return;

    this.callbacks.onStartCountdown?.(null);

    for (let round = 1; round <= config.rounds; round++) {
      this.callbacks.onRoundChanged?.(round, config.rounds);

      const completedBreathing = await this.runBreathingRound(
        round,
        config.breaths,
        pace,
        token
      );

      if (!completedBreathing || !this.isActive(token)) return;

      const retentionSeconds = await this.runRetention(token);
      if (retentionSeconds === null || !this.isActive(token)) return;

      this.retentions.push(retentionSeconds);
      this.callbacks.onRetentionRecorded?.(
        round,
        retentionSeconds,
        [...this.retentions]
      );

      const completedRecovery = await this.runRecovery(token);
      if (!completedRecovery || !this.isActive(token)) return;

      if (round < config.rounds) {
        const nextRound = round + 1;
        const pauseSeconds = Math.max(0, Number(config.interRoundPauseSeconds) || 0);

        this.callbacks.onPreparingNextRound?.(nextRound);

        if (pauseSeconds > 0) {
          const completedPause = await this.runInterRoundPause(nextRound, pauseSeconds, token);
          if (!completedPause || !this.isActive(token)) return;
        } else {
          // Misma transición de V2.18 cuando la pausa está desactivada.
          await this.sleepAccurate(VOICE_TRANSITION_LEAD, token);
          if (!this.isActive(token)) return;
        }
      }
    }

    this.phase = "complete";
    this.callbacks.onComplete?.({
      config,
      retentions: [...this.retentions]
    });
  }

  async runBreathingRound(round, totalBreaths, pace, token) {
    this.phase = "breathing";
    this.callbacks.onPhaseChanged?.("breathing");

    for (let breath = 1; breath <= totalBreaths; breath++) {
      if (!this.isActive(token)) return false;

      const isLastBreath = breath === totalBreaths;

      this.callbacks.onBreath?.({
        round,
        breath,
        totalBreaths,
        step: "inhale",
        duration: pace.inhale,
        isLastBreath
      });

      playBreathingSound("inhale", pace.inhale);

      const voiceCountInterval = [5, 10].includes(Number(this.config?.voiceCountInterval))
        ? Number(this.config.voiceCountInterval)
        : 0;

      if (isLastBreath) {
        // La pantalla ya muestra INHALA; la voz solo anuncia que es la última.
        speak("Última", { interrupt: true, rate: 0.92 });
      } else if (voiceCountInterval > 0 && breath % voiceCountInterval === 0) {
        // El usuario elige si quiere una referencia numérica cada 5 o 10 respiraciones.
        speak(`${breath}, inhala`, { interrupt: true, rate: 1.0 });
      } else {
        // "Inhala" se mantiene aunque el conteo numérico esté desactivado.
        speak("Inhala", { interrupt: true, rate: 1.0 });
      }

      await this.sleepAccurate(pace.inhale, token);
      if (!this.isActive(token)) return false;

      this.callbacks.onBreath?.({
        round,
        breath,
        totalBreaths,
        step: "exhale",
        duration: pace.exhale,
        isLastBreath
      });

      playBreathingSound("exhale", pace.exhale);
      speak("Exhala", { interrupt: true, rate: 1.0 });
      await this.sleepAccurate(pace.exhale, token);
    }

    return this.isActive(token);
  }

  runRetention(token) {
    if (!this.isActive(token)) return Promise.resolve(null);

    this.phase = "retention";
    this.callbacks.onPhaseChanged?.("retention");

    // El cronómetro comienza exactamente al iniciar la indicación "Retención".
    this.retentionStartedAt = performance.now();
    this.callbacks.onRetentionTick?.("00:00", 0);

    clearInterval(this.retentionInterval);
    this.retentionInterval = setInterval(() => {
      if (!this.isActive(token) || this.phase !== "retention") return;

      const seconds = (performance.now() - this.retentionStartedAt) / 1000;
      this.callbacks.onRetentionTick?.(formatClock(seconds), seconds);
    }, 250);

    speak("Retención. Sin forzar", { interrupt: true });

    return new Promise(resolve => {
      this.resolveRetention = resolve;
    });
  }

  finishRetention() {
    if (this.phase !== "retention" || !this.resolveRetention) return;

    const seconds = (performance.now() - this.retentionStartedAt) / 1000;

    clearInterval(this.retentionInterval);
    this.retentionInterval = null;
    this.phase = "transition";

    const resolve = this.resolveRetention;
    this.resolveRetention = null;
    resolve(seconds);
  }

  async runRecovery(token) {
    if (!this.isActive(token)) return false;

    this.phase = "recovery";
    this.callbacks.onPhaseChanged?.("recovery");
    speak("Inhala profundamente y mantén", { interrupt: true });

    await this.sleepAccurate(VOICE_TRANSITION_LEAD, token);
    if (!this.isActive(token)) return false;

    for (let remaining = 15; remaining >= 1; remaining--) {
      if (!this.isActive(token)) return false;
      this.callbacks.onRecoveryTick?.(remaining);
      await this.sleepAccurate(1000, token);
    }

    if (!this.isActive(token)) return false;

    this.callbacks.onRecoveryRelease?.();
    speak("Suelta", {
      interrupt: true,
      rate: 0.40,
      pitch: 0.92
    });

    await this.sleepAccurate(RECOVERY_RELEASE_PAUSE, token);
    if (!this.isActive(token)) return false;

    this.callbacks.onRecoveryFinished?.();
    return true;
  }

  async runInterRoundPause(nextRound, seconds, token) {
    if (!this.isActive(token)) return false;

    this.phase = "betweenRounds";
    this.callbacks.onPhaseChanged?.("betweenRounds");
    this.callbacks.onInterRoundPauseStarted?.(nextRound, seconds);

    for (let remaining = seconds; remaining >= 1; remaining--) {
      if (!this.isActive(token)) return false;
      this.callbacks.onInterRoundPauseTick?.(remaining, nextRound);
      await this.sleepAccurate(1000, token);
    }

    if (!this.isActive(token)) return false;

    this.callbacks.onInterRoundPauseFinished?.(nextRound);
    return true;
  }

  stop(notify = true) {
    this.runToken += 1;
    this.phase = "stopped";

    clearInterval(this.retentionInterval);
    this.retentionInterval = null;

    if (this.resolveRetention) {
      const resolve = this.resolveRetention;
      this.resolveRetention = null;
      resolve(null);
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    stopBreathingSound();

    if (notify) this.callbacks.onStopped?.();
  }

  isActive(token) {
    return token === this.runToken;
  }

  sleepAccurate(ms, token) {
    return new Promise(resolve => {
      const started = performance.now();

      const check = () => {
        if (!this.isActive(token)) {
          resolve(false);
          return;
        }

        const elapsed = performance.now() - started;
        const remaining = ms - elapsed;

        if (remaining <= 0) {
          resolve(true);
          return;
        }

        setTimeout(check, Math.min(remaining, 50));
      };

      check();
    });
  }

  sleep(ms, token) {
    return this.sleepAccurate(ms, token);
  }
}
