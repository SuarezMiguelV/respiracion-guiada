import { SessionEngine } from "./session.js";
import {
  setSpeechEnabled,
  setSpeechVolume,
  setSpeechVoice,
  getSpeechVoiceOptions,
  getAutomaticVoiceLabel,
  onSpeechVoicesChanged,
  speak
} from "./speech.js";
import { average, formatClock } from "./utils.js";
import {
  setBreathingSoundEnabled,
  setBreathingSoundVolume,
  primeBreathingAudio
} from "./audio.js";
import {
  saveCompletedSession,
  listCompletedSessions,
  queueCompletedSession,
  syncPendingSessions,
  getPendingSessionCount
} from "./session-store.js";
import {
  firebaseConfigured,
  registerUser,
  loginUser,
  logoutUser,
  watchAuth,
  ensureUserProfile,
  listUserProfiles,
  saveUserPreferences,
  normalizePreferences,
  friendlyAuthError
} from "./auth.js";

const $ = selector => document.querySelector(selector);

const authView = $("#authView");
const adminView = $("#adminView");
const historyView = $("#historyView");
const setupView = $("#setupView");
const sessionView = $("#sessionView");
const summaryView = $("#summaryView");
const allViews = [authView, adminView, historyView, setupView, sessionView, summaryView];

const userBar = $("#userBar");
const userName = $("#userName");
const userEmail = $("#userEmail");
const roleBadge = $("#roleBadge");
const historyBtn = $("#historyBtn");
const adminBtn = $("#adminBtn");
const logoutBtn = $("#logoutBtn");

const firebaseNotice = $("#firebaseNotice");
const showLoginBtn = $("#showLoginBtn");
const showRegisterBtn = $("#showRegisterBtn");
const loginForm = $("#loginForm");
const registerForm = $("#registerForm");
const authMessage = $("#authMessage");
const loginBtn = $("#loginBtn");
const registerBtn = $("#registerBtn");

const loginEmail = $("#loginEmail");
const loginPassword = $("#loginPassword");
const registerName = $("#registerName");
const registerEmail = $("#registerEmail");
const registerPassword = $("#registerPassword");
const registerPasswordConfirm = $("#registerPasswordConfirm");

const closeAdminBtn = $("#closeAdminBtn");
const adminUsers = $("#adminUsers");

const closeHistoryBtn = $("#closeHistoryBtn");
const refreshHistoryBtn = $("#refreshHistoryBtn");
const homeHistoryBtn = $("#homeHistoryBtn");
const historyStatus = $("#historyStatus");
const historyList = $("#historyList");
const historyTotalSessions = $("#historyTotalSessions");
const historyBestRetention = $("#historyBestRetention");
const historyAverageRetention = $("#historyAverageRetention");
const historyPracticeTime = $("#historyPracticeTime");
const historyLast7Days = $("#historyLast7Days");
const historyTotalRounds = $("#historyTotalRounds");
const retentionTrendCanvas = $("#retentionTrendChart");
const roundAverageCanvas = $("#roundAverageChart");
const trendChartEmpty = $("#trendChartEmpty");
const roundChartEmpty = $("#roundChartEmpty");
const sessionDetailCard = $("#sessionDetailCard");
const closeDetailBtn = $("#closeDetailBtn");
const detailTitle = $("#detailTitle");
const detailStartedAt = $("#detailStartedAt");
const detailDuration = $("#detailDuration");
const detailBreaths = $("#detailBreaths");
const detailRounds = $("#detailRounds");
const detailPace = $("#detailPace");
const detailAverage = $("#detailAverage");
const detailBest = $("#detailBest");
const detailStatus = $("#detailStatus");
const detailRetentions = $("#detailRetentions");

const safetyCheck = $("#safetyCheck");
const breathCount = $("#breathCount");
const roundCount = $("#roundCount");
const pace = $("#pace");
const voiceGuide = $("#voiceGuide");
const voiceVolume = $("#voiceVolume");
const voiceVolumeValue = $("#voiceVolumeValue");
const voiceChoice = $("#voiceChoice");
const automaticVoiceName = $("#automaticVoiceName");
const testVoiceBtn = $("#testVoiceBtn");
const breathingSound = $("#breathingSound");
const breathingSoundVolume = $("#breathingSoundVolume");
const breathingSoundVolumeValue = $("#breathingSoundVolumeValue");
const setupAudioSettingsBtn = $("#setupAudioSettingsBtn");
const setupAudioSettingsPanel = $("#setupAudioSettingsPanel");
const preferencesStatus = $("#preferencesStatus");
const startBtn = $("#startBtn");
const stopBtn = $("#stopBtn");
const sessionSoundToggle = $("#sessionSoundToggle");
const sessionSoundLabel = $("#sessionSoundLabel");
const sessionBreathingSoundToggle = $("#sessionBreathingSoundToggle");
const sessionBreathingSoundLabel = $("#sessionBreathingSoundLabel");
const sessionVoiceVolume = $("#sessionVoiceVolume");
const sessionVoiceVolumeValue = $("#sessionVoiceVolumeValue");
const sessionBreathingVolume = $("#sessionBreathingVolume");
const sessionBreathingVolumeValue = $("#sessionBreathingVolumeValue");
const sessionAudioSettingsBtn = $("#sessionAudioSettingsBtn");
const sessionAudioSettingsPanel = $("#sessionAudioSettingsPanel");

const roundLabel = $("#roundLabel");
const breathingPanel = $("#breathingPanel");
const retentionPanel = $("#retentionPanel");
const recoveryPanel = $("#recoveryPanel");

const startCountdown = $("#startCountdown");
const breathCue = $("#breathCue");
const breathingOrb = $("#breathingOrb");
const breathingInstruction = $("#breathingInstruction");
const breathLabel = $("#breathLabel");
const phaseHint = $("#phaseHint");

const retentionTimer = $("#retentionTimer");
const finishRetentionBtn = $("#finishRetentionBtn");

const recoveryTimer = $("#recoveryTimer");
const recoveryInstruction = $("#recoveryInstruction");

const summaryRounds = $("#summaryRounds");
const summaryBreaths = $("#summaryBreaths");
const summaryAverage = $("#summaryAverage");
const summaryBest = $("#summaryBest");
const retentionList = $("#retentionList");
const newSessionBtn = $("#newSessionBtn");
const saveStatus = $("#saveStatus");
const connectionStatus = $("#connectionStatus");
const pendingSyncCount = $("#pendingSyncCount");

let activeConfig = null;
let currentUser = null;
let currentProfile = null;
let sessionStartedAt = null;
let retentionTrendChart = null;
let roundAverageChart = null;
let preferenceSaveTimer = null;
let applyingPreferences = false;

const testMode = new URLSearchParams(window.location.search).get("test") === "1";
if (testMode) {
  breathCount.insertAdjacentHTML("afterbegin", '<option value="3">3 respiraciones (PRUEBA)</option>');
  roundCount.insertAdjacentHTML("afterbegin", '<option value="2">2 vueltas (PRUEBA)</option>');
  breathCount.value = "3";
  roundCount.value = "2";
  pace.value = "fast";
}

function showView(view) {
  allViews.forEach(item => item.classList.remove("active"));
  view.classList.add("active");

  // Durante la sesión evitamos distracciones.
  userBar.classList.toggle(
    "hidden",
    !currentUser || view === authView || view === sessionView
  );
}

function showPhase(phase) {
  breathingPanel.classList.toggle("hidden", phase !== "breathing");
  retentionPanel.classList.toggle("hidden", phase !== "retention");
  recoveryPanel.classList.toggle("hidden", phase !== "recovery");
}

function toggleAudioPanel(button, panel) {
  const open = panel.classList.contains("hidden");
  panel.classList.toggle("hidden", !open);
  button.setAttribute("aria-expanded", String(open));
  button.textContent = open ? "Cerrar volumen" : "Volumen";
}

function getConfig() {
  return {
    breaths: Number(breathCount.value),
    rounds: Number(roundCount.value),
    pace: pace.value,
    voice: voiceGuide.checked,
    voiceVolume: Number(voiceVolume.value) / 100,
    voiceName: voiceChoice.value || "auto",
    breathingSound: breathingSound.checked,
    breathingSoundVolume: Number(breathingSoundVolume.value) / 100
  };
}

function setPreferencesStatus(message, state = "") {
  preferencesStatus.textContent = message;
  const row = preferencesStatus.closest(".preferences-save-row");

  if (row) {
    row.classList.remove("saving", "saved", "error");
    if (state) row.classList.add(state);
  }
}

function selectHasValue(select, value) {
  return [...select.options].some(option => option.value === String(value));
}

function applyUserPreferences(preferences) {
  const normalized = normalizePreferences(preferences);

  applyingPreferences = true;

  // ?test=1 conserva 3 respiraciones / 2 vueltas / ritmo rápido
  // para no alterar el modo de desarrollo ni guardar esos valores.
  if (!testMode) {
    if (selectHasValue(breathCount, normalized.breaths)) {
      breathCount.value = String(normalized.breaths);
    }

    if (selectHasValue(roundCount, normalized.rounds)) {
      roundCount.value = String(normalized.rounds);
    }

    if (selectHasValue(pace, normalized.pace)) {
      pace.value = normalized.pace;
    }
  }

  applyVoiceState(normalized.voice);
  applyVoiceVolumeState(normalized.voiceVolume);
  applyVoiceChoiceState(normalized.voiceName);
  applyBreathingSoundVolumeState(normalized.breathingSoundVolume);
  applyBreathingSoundState(normalized.breathingSound);

  applyingPreferences = false;
  setPreferencesStatus("Preferencias cargadas desde tu cuenta.", "saved");
}

async function persistCurrentPreferences() {
  if (!currentUser || applyingPreferences || testMode) return;

  setPreferencesStatus("Guardando preferencias…", "saving");

  try {
    const saved = await saveUserPreferences(currentUser.uid, getConfig());

    if (currentProfile) {
      currentProfile = {
        ...currentProfile,
        preferences: saved
      };
    }

    setPreferencesStatus("Preferencias guardadas.", "saved");
  } catch (error) {
    console.error("Error al guardar preferencias:", error);
    setPreferencesStatus("No se pudieron guardar las preferencias.", "error");
  }
}

function queuePreferenceSave() {
  if (!currentUser || applyingPreferences || testMode) return;

  window.clearTimeout(preferenceSaveTimer);
  setPreferencesStatus("Guardando preferencias…", "saving");

  preferenceSaveTimer = window.setTimeout(() => {
    persistCurrentPreferences();
  }, 350);
}


function setAuthMessage(message = "", success = false) {
  authMessage.textContent = message;
  authMessage.classList.toggle("success", success);
}

function setAuthMode(mode) {
  const loginMode = mode === "login";
  loginForm.classList.toggle("hidden", !loginMode);
  registerForm.classList.toggle("hidden", loginMode);
  showLoginBtn.classList.toggle("active", loginMode);
  showRegisterBtn.classList.toggle("active", !loginMode);
  setAuthMessage("");
}

function setAuthBusy(busy) {
  loginBtn.disabled = busy || !firebaseConfigured;
  registerBtn.disabled = busy || !firebaseConfigured;
}

function renderUserBar(user, profile) {
  const displayName = profile?.displayName || user.displayName || "Usuario";
  const role = profile?.role || "user";

  userName.textContent = displayName;
  userEmail.textContent = user.email || profile?.email || "";
  roleBadge.classList.toggle("hidden", role !== "admin");
  adminBtn.classList.toggle("hidden", role !== "admin");
}

async function loadAdminUsers() {
  adminUsers.innerHTML = '<p class="muted">Cargando usuarios…</p>';

  try {
    const users = await listUserProfiles();

    if (!users.length) {
      adminUsers.innerHTML = '<p class="muted">No hay perfiles registrados.</p>';
      return;
    }

    adminUsers.innerHTML = "";
    users.forEach(profile => {
      const row = document.createElement("div");
      row.className = "admin-user-row";

      const main = document.createElement("div");
      main.className = "admin-user-main";

      const name = document.createElement("strong");
      name.textContent = profile.displayName || "Sin nombre";

      const email = document.createElement("span");
      email.textContent = profile.email || "Sin correo";

      const role = document.createElement("span");
      role.className = "admin-user-role";
      role.textContent = profile.role || "user";

      main.append(name, email);
      row.append(main, role);
      adminUsers.appendChild(row);
    });
  } catch (error) {
    adminUsers.innerHTML = `<p class="auth-message">${friendlyAuthError(error)}</p>`;
  }
}



function updateConnectionUi() {
  if (!connectionStatus || !pendingSyncCount) return;

  const online = navigator.onLine;
  connectionStatus.textContent = online ? "En línea" : "Sin conexión";
  connectionStatus.classList.toggle("offline", !online);

  const pending = currentUser ? getPendingSessionCount(currentUser.uid) : 0;
  pendingSyncCount.textContent = pending
    ? `${pending} pendiente${pending === 1 ? "" : "s"}`
    : "";
}

async function trySyncPendingSessions() {
  if (!currentUser || !navigator.onLine) {
    updateConnectionUi();
    return;
  }

  const pending = getPendingSessionCount(currentUser.uid);
  if (!pending) {
    updateConnectionUi();
    return;
  }

  connectionStatus.textContent = "Sincronizando…";

  try {
    const result = await syncPendingSessions(
      currentUser.uid,
      ({ synced, total }) => {
        connectionStatus.textContent = `Sincronizando ${synced}/${total}…`;
      }
    );

    updateConnectionUi();

    if (result.synced > 0) {
      saveStatus.textContent = result.remaining
        ? `${result.synced} sincronizada(s); ${result.remaining} pendiente(s).`
        : `${result.synced} sesión(es) pendiente(s) sincronizada(s).`;
      saveStatus.className = "save-status success";
    }
  } catch (error) {
    console.warn("No fue posible sincronizar las sesiones pendientes:", error);
    updateConnectionUi();
  }
}

function timestampToDate(value){
  if(!value)return null;
  if(typeof value.toDate==="function")return value.toDate();
  if(value instanceof Date)return value;
  const parsed=new Date(value);
  return Number.isNaN(parsed.getTime())?null:parsed;
}
function formatSessionDate(value){
  const date=timestampToDate(value);
  if(!date)return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX",{dateStyle:"medium",timeStyle:"short"}).format(date);
}
function formatLongDuration(totalSeconds){
  const seconds=Math.max(0,Math.round(Number(totalSeconds)||0));
  const hours=Math.floor(seconds/3600),minutes=Math.floor((seconds%3600)/60),remaining=seconds%60;
  if(hours>0)return `${hours} h ${minutes} min`;
  if(minutes>0)return `${minutes} min ${remaining} s`;
  return `${remaining} s`;
}
function paceLabel(value){return ({verySlow:"Más lento",slow:"Lento",normal:"Normal",fast:"Rápido"})[value]||value||"—";}
function renderHistorySummary(sessions){
  const retentions=sessions.flatMap(s=>Array.isArray(s.retentionsSeconds)?s.retentionsSeconds.map(Number).filter(Number.isFinite):[]);
  const best=retentions.length?Math.max(...retentions):0;
  const avg=retentions.length?retentions.reduce((a,b)=>a+b,0)/retentions.length:0;
  const practice=sessions.reduce((sum,s)=>sum+(Number(s.durationSeconds)||0),0);
  const totalRounds=sessions.reduce((sum,s)=>sum+(Number(s.completedRounds)||0),0);

  const cutoff=new Date();
  cutoff.setHours(cutoff.getHours()-168);
  const last7=sessions.filter(s=>{
    const date=timestampToDate(s.startedAt);
    return date && date>=cutoff;
  }).length;

  historyTotalSessions.textContent=sessions.length;
  historyBestRetention.textContent=formatClock(best);
  historyAverageRetention.textContent=formatClock(avg);
  historyPracticeTime.textContent=formatLongDuration(practice);
  historyLast7Days.textContent=last7;
  historyTotalRounds.textContent=totalRounds;
}

function destroyHistoryCharts(){
  if(retentionTrendChart){
    retentionTrendChart.destroy();
    retentionTrendChart=null;
  }
  if(roundAverageChart){
    roundAverageChart.destroy();
    roundAverageChart=null;
  }
}

function chartBaseOptions(){
  return {
    responsive:true,
    maintainAspectRatio:false,
    interaction:{mode:"index",intersect:false},
    plugins:{
      legend:{
        labels:{
          color:"#dcecff",
          usePointStyle:true,
          boxWidth:8
        }
      },
      tooltip:{
        callbacks:{
          label(context){
            const value=Number(context.raw)||0;
            return `${context.dataset.label}: ${formatClock(value)}`;
          }
        }
      }
    },
    scales:{
      x:{
        ticks:{color:"#8eafd8",maxRotation:0,autoSkip:true},
        grid:{color:"rgba(173,205,255,.08)"}
      },
      y:{
        beginAtZero:true,
        ticks:{
          color:"#8eafd8",
          callback(value){ return formatClock(Number(value)||0); }
        },
        grid:{color:"rgba(173,205,255,.08)"}
      }
    }
  };
}

function renderRetentionTrendChart(sessions){
  if(typeof Chart==="undefined"){
    trendChartEmpty.textContent="No fue posible cargar Chart.js.";
    trendChartEmpty.classList.remove("hidden");
    retentionTrendCanvas.classList.add("hidden");
    return;
  }

  if(retentionTrendChart){
    retentionTrendChart.destroy();
    retentionTrendChart=null;
  }

  const ordered=[...sessions].reverse();

  if(!ordered.length){
    retentionTrendCanvas.classList.add("hidden");
    trendChartEmpty.classList.remove("hidden");
    return;
  }

  retentionTrendCanvas.classList.remove("hidden");
  trendChartEmpty.classList.add("hidden");

  const labels=ordered.map((session,index)=>{
    const date=timestampToDate(session.startedAt);
    if(!date)return `Sesión ${index+1}`;
    return new Intl.DateTimeFormat("es-MX",{day:"2-digit",month:"short"}).format(date);
  });

  retentionTrendChart=new Chart(retentionTrendCanvas,{
    type:"line",
    data:{
      labels,
      datasets:[
        {
          label:"Promedio",
          data:ordered.map(s=>Number(s.averageRetentionSeconds)||0),
          tension:.25,
          pointRadius:3
        },
        {
          label:"Mejor retención",
          data:ordered.map(s=>Number(s.bestRetentionSeconds)||0),
          tension:.25,
          pointRadius:3
        }
      ]
    },
    options:chartBaseOptions()
  });
}

function buildRoundAverages(sessions){
  const buckets=[];

  sessions.forEach(session=>{
    const values=Array.isArray(session.retentionsSeconds)?session.retentionsSeconds:[];
    values.forEach((value,index)=>{
      const seconds=Number(value);
      if(!Number.isFinite(seconds))return;
      if(!buckets[index])buckets[index]=[];
      buckets[index].push(seconds);
    });
  });

  return buckets.map(values=>{
    if(!values || !values.length)return 0;
    return values.reduce((sum,value)=>sum+value,0)/values.length;
  });
}

function renderRoundAverageChart(sessions){
  if(typeof Chart==="undefined"){
    roundChartEmpty.textContent="No fue posible cargar Chart.js.";
    roundChartEmpty.classList.remove("hidden");
    roundAverageCanvas.classList.add("hidden");
    return;
  }

  if(roundAverageChart){
    roundAverageChart.destroy();
    roundAverageChart=null;
  }

  const averages=buildRoundAverages(sessions);

  if(!averages.length){
    roundAverageCanvas.classList.add("hidden");
    roundChartEmpty.classList.remove("hidden");
    return;
  }

  roundAverageCanvas.classList.remove("hidden");
  roundChartEmpty.classList.add("hidden");

  roundAverageChart=new Chart(roundAverageCanvas,{
    type:"bar",
    data:{
      labels:averages.map((_,index)=>`Vuelta ${index+1}`),
      datasets:[
        {
          label:"Retención promedio",
          data:averages
        }
      ]
    },
    options:chartBaseOptions()
  });
}

function renderHistoryCharts(sessions){
  renderRetentionTrendChart(sessions);
  renderRoundAverageChart(sessions);
}

function showSessionDetail(session){
  detailTitle.textContent=formatSessionDate(session.startedAt);
  detailStartedAt.textContent=formatSessionDate(session.startedAt);
  detailDuration.textContent=formatLongDuration(session.durationSeconds);
  detailBreaths.textContent=`${session.breathsPerRound??"—"} por vuelta`;
  detailRounds.textContent=`${session.completedRounds??0} de ${session.plannedRounds??0}`;
  detailPace.textContent=paceLabel(session.pace);
  detailAverage.textContent=formatClock(session.averageRetentionSeconds||0);
  detailBest.textContent=formatClock(session.bestRetentionSeconds||0);
  detailStatus.textContent=session.status==="completed"?"Completada":(session.status||"—");
  detailRetentions.innerHTML="";
  const values=Array.isArray(session.retentionsSeconds)?session.retentionsSeconds:[];
  if(!values.length){detailRetentions.innerHTML='<p class="muted">No hay retenciones registradas.</p>';}
  else{values.forEach((seconds,index)=>{const row=document.createElement("div");row.className="retention-row";row.innerHTML=`<span>Vuelta ${index+1}</span><strong>${formatClock(seconds)}</strong>`;detailRetentions.appendChild(row);});}
  sessionDetailCard.classList.remove("hidden");
  sessionDetailCard.scrollIntoView({behavior:"smooth",block:"start"});
}
function renderHistoryList(sessions){
  historyList.innerHTML="";
  if(!sessions.length){historyList.innerHTML='<p class="muted">Todavía no tienes sesiones guardadas.</p>';return;}
  sessions.forEach((session,index)=>{
    const row=document.createElement("div");row.className="history-session-row";
    const main=document.createElement("div");main.className="history-session-main";main.innerHTML=`<strong>Sesión ${sessions.length-index}</strong><span>${formatSessionDate(session.startedAt)}</span>`;
    const avg=document.createElement("div");avg.className="history-session-metric";avg.innerHTML=`<span>Promedio</span><strong>${formatClock(session.averageRetentionSeconds||0)}</strong>`;
    const best=document.createElement("div");best.className="history-session-metric";best.innerHTML=`<span>Mejor</span><strong>${formatClock(session.bestRetentionSeconds||0)}</strong>`;
    const rounds=document.createElement("div");rounds.className="history-session-metric";rounds.innerHTML=`<span>Vueltas</span><strong>${session.completedRounds??0}/${session.plannedRounds??0}</strong>`;
    const button=document.createElement("button");button.type="button";button.className="history-detail-btn";button.textContent="Ver";button.addEventListener("click",()=>showSessionDetail(session));
    row.append(main,avg,best,rounds,button);historyList.appendChild(row);
  });
}
async function loadHistory(){
  if(!currentUser)return;
  historyStatus.textContent="Cargando historial…";historyStatus.className="history-status";sessionDetailCard.classList.add("hidden");
  try{
    const sessions=await listCompletedSessions(currentUser.uid,100);
    renderHistorySummary(sessions);renderHistoryList(sessions);renderHistoryCharts(sessions);
    historyStatus.textContent=sessions.length?`${sessions.length} sesión${sessions.length===1?"":"es"} cargada${sessions.length===1?"":"s"}.`:"Aún no hay sesiones guardadas.";
  }catch(error){
    console.error(error);renderHistorySummary([]);destroyHistoryCharts();historyList.innerHTML='<p class="muted">No fue posible cargar el historial.</p>';historyStatus.textContent="Error al consultar Firestore.";historyStatus.className="history-status error";
  }
}
async function openHistory(){if(!currentUser)return;showView(historyView);await loadHistory();}

const engine = new SessionEngine({
  onSessionStarted(config) {
    activeConfig = config;
    sessionStartedAt = new Date();
    saveStatus.textContent = "";
    saveStatus.className = "save-status";
    setSpeechEnabled(config.voice);
    setBreathingSoundEnabled(config.breathingSound);

    voiceGuide.checked = config.voice;
    sessionSoundToggle.checked = config.voice;
    sessionSoundLabel.textContent = config.voice ? "Voz" : "Sin voz";

    breathingSound.checked = config.breathingSound;
    sessionBreathingSoundToggle.checked = config.breathingSound;
    sessionBreathingSoundLabel.textContent = config.breathingSound ? "Respiración" : "Sin respiración";

    showView(sessionView);
    showPhase("breathing");
    breathLabel.textContent = `Respiración 0 de ${config.breaths}`;
    breathingInstruction.textContent = "PREPÁRATE";
    phaseHint.textContent = "Comienza con una respiración cómoda y sin forzar.";
    breathCue.classList.add("hidden");
    breathingOrb.classList.remove("inhale", "exhale");
  },

  onStartCountdown(value) {
    if (value === null) {
      startCountdown.classList.add("hidden");
      startCountdown.classList.remove("go");
      return;
    }

    startCountdown.classList.remove("hidden");
    startCountdown.textContent = value;
    startCountdown.classList.toggle("go", value === "COMIENZA");
    breathingInstruction.textContent = value === "COMIENZA" ? "COMIENZA" : "PREPÁRATE";
    phaseHint.textContent =
      value === "COMIENZA"
        ? "Primera respiración."
        : "Acomódate y respira con naturalidad.";
  },

  onRoundChanged(round, total) {
    roundLabel.textContent = `Vuelta ${round} de ${total}`;
  },

  onPhaseChanged(phase) {
    showPhase(phase);

    if (phase === "retention") {
      retentionTimer.textContent = "00:00";
      breathCue.classList.add("hidden");
    }

    if (phase === "recovery") {
      recoveryInstruction.textContent = "Inhala profundamente y mantén";
    }
  },

  onBreath({ breath, totalBreaths, step, duration, isLastBreath }) {
    breathLabel.textContent = `Respiración ${breath} de ${totalBreaths}`;
    breathingOrb.style.transitionDuration = `${duration}ms`;
    breathingOrb.classList.remove("inhale", "exhale");

    requestAnimationFrame(() => {
      breathingOrb.classList.add(step);
    });

    if (isLastBreath && step === "inhale") {
      breathCue.classList.remove("hidden");
      phaseHint.textContent = "Última respiración antes de la retención.";
    } else if (step === "inhale") {
      breathCue.classList.add("hidden");
      phaseHint.textContent = "Llena primero el abdomen y después el pecho.";
    } else {
      phaseHint.textContent = isLastBreath
        ? "Suelta el aire. Enseguida pasas a retención."
        : "Suelta el aire sin forzar.";
    }

    breathingInstruction.textContent = step === "inhale" ? "INHALA" : "EXHALA";
  },

  onRetentionTick(clock) {
    retentionTimer.textContent = clock;
  },

  onRecoveryTick(remaining) {
    recoveryTimer.textContent = remaining;
    recoveryInstruction.textContent = "Inhala profundamente y mantén";
  },

  onRecoveryRelease() {
    recoveryTimer.textContent = "0";
    recoveryInstruction.textContent = "¡SUELTA!";
  },

  onRecoveryFinished() {
    recoveryInstruction.textContent = "¡SUELTA!";
  },

  onPreparingNextRound(nextRound) {
    roundLabel.textContent = `Siguiente: vuelta ${nextRound}`;
  },

  async onComplete({ config, retentions }) {
    renderSummary(config, retentions);
    showView(summaryView);

    // Cierre final de la sesión. Se reproduce ya sobre la pantalla Resumen.
    // interrupt:false evita cortar “Suelta” si el sintetizador aún la está terminando.
    speak(
      "Regresa a la normalidad moviéndote poco a poco. Comienza con tus manos y pies. Ten un buen día y una buena vida.",
      {
        interrupt: false,
        rate: 0.72,
        pitch: 0.94
      }
    );

    if (!currentUser || !sessionStartedAt) {
      saveStatus.textContent = "No fue posible guardar la sesión: falta el usuario.";
      saveStatus.className = "save-status error";
      return;
    }

    saveStatus.textContent = "Guardando sesión…";
    saveStatus.className = "save-status";

    const sessionPayload = {
      userId: currentUser.uid,
      startedAt: sessionStartedAt,
      endedAt: new Date(),
      config,
      retentions
    };

    try {
      if (!navigator.onLine) {
        queueCompletedSession(sessionPayload);
        saveStatus.textContent = "Sin conexión: sesión guardada en este dispositivo.";
        saveStatus.className = "save-status success";
      } else {
        await saveCompletedSession(sessionPayload);
        saveStatus.textContent = "Sesión guardada en tu historial.";
        saveStatus.className = "save-status success";
      }
    } catch (error) {
      console.warn("Guardado inmediato no disponible:", error);

      try {
        queueCompletedSession(sessionPayload);
        saveStatus.textContent = "Sesión guardada localmente; se reintentará la sincronización.";
        saveStatus.className = "save-status success";
      } catch (queueError) {
        console.error("No se pudo guardar localmente:", queueError);
        saveStatus.textContent = "La sesión terminó, pero no fue posible guardar el resultado.";
        saveStatus.className = "save-status error";
      }
    }

    updateConnectionUi();
  },

  onStopped() {
    showView(setupView);
  }
});

function renderSummary(config, retentions) {
  const avg = average(retentions);
  const best = retentions.length ? Math.max(...retentions) : 0;

  summaryRounds.textContent = retentions.length;
  summaryBreaths.textContent = `${config.breaths} × ${retentions.length}`;
  summaryAverage.textContent = formatClock(avg);
  summaryBest.textContent = formatClock(best);

  retentionList.innerHTML = "";

  retentions.forEach((seconds, index) => {
    const row = document.createElement("div");
    row.className = "retention-row";
    row.innerHTML = `
      <span>Vuelta ${index + 1}</span>
      <strong>${formatClock(seconds)}</strong>
    `;
    retentionList.appendChild(row);
  });
}

/* ===== Autenticación ===== */

showLoginBtn.addEventListener("click", () => setAuthMode("login"));
showRegisterBtn.addEventListener("click", () => setAuthMode("register"));

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  setAuthMessage("");
  setAuthBusy(true);

  try {
    await loginUser({
      email: loginEmail.value.trim(),
      password: loginPassword.value
    });
    loginForm.reset();
  } catch (error) {
    setAuthMessage(friendlyAuthError(error));
  } finally {
    setAuthBusy(false);
  }
});

registerForm.addEventListener("submit", async event => {
  event.preventDefault();
  setAuthMessage("");

  const name = registerName.value.trim();
  const email = registerEmail.value.trim();
  const password = registerPassword.value;
  const confirmation = registerPasswordConfirm.value;

  if (!name) {
    setAuthMessage("Escribe tu nombre.");
    return;
  }

  if (password !== confirmation) {
    setAuthMessage("Las contraseñas no coinciden.");
    return;
  }

  setAuthBusy(true);

  try {
    await registerUser({ name, email, password });
    registerForm.reset();
    setAuthMessage("Cuenta creada correctamente.", true);
  } catch (error) {
    setAuthMessage(friendlyAuthError(error));
  } finally {
    setAuthBusy(false);
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    engine.stop(false);
    await logoutUser();
  } catch (error) {
    window.alert(friendlyAuthError(error));
  }
});

adminBtn.addEventListener("click", async () => {
  if (currentProfile?.role !== "admin") return;
  showView(adminView);
  await loadAdminUsers();
});

closeAdminBtn.addEventListener("click", () => {
  showView(setupView);
});

historyBtn.addEventListener("click", openHistory);
homeHistoryBtn.addEventListener("click", openHistory);
refreshHistoryBtn.addEventListener("click", loadHistory);
closeHistoryBtn.addEventListener("click", () => { sessionDetailCard.classList.add("hidden"); showView(setupView); });
closeDetailBtn.addEventListener("click", () => { sessionDetailCard.classList.add("hidden"); });

if (!firebaseConfigured) {
  firebaseNotice.classList.remove("hidden");
  setAuthMessage("Configura Firebase para activar registro e inicio de sesión.");
  setAuthBusy(true);
}

window.addEventListener("online", () => {
  updateConnectionUi();
  trySyncPendingSessions();
});

window.addEventListener("offline", updateConnectionUi);

updateConnectionUi();

watchAuth(async user => {
  currentUser = user;

  if (!user) {
    currentProfile = null;
    window.clearTimeout(preferenceSaveTimer);
    preferenceSaveTimer = null;
    userBar.classList.add("hidden");
    showView(authView);
    return;
  }

  try {
    currentProfile = await ensureUserProfile(user);
    renderUserBar(user, currentProfile);
    applyUserPreferences(currentProfile.preferences);
    showView(setupView);
    updateConnectionUi();
    trySyncPendingSessions();
  } catch (error) {
    currentProfile = null;
    setAuthMessage(friendlyAuthError(error));
    showView(authView);
  }
});

/* ===== Respiración V2.2: comportamiento conservado ===== */

safetyCheck.addEventListener("change", () => {
  startBtn.disabled = !safetyCheck.checked;
});

function applyVoiceState(enabled) {
  const voiceOn = Boolean(enabled);
  setSpeechEnabled(voiceOn);
  voiceGuide.checked = voiceOn;
  sessionSoundToggle.checked = voiceOn;
  sessionSoundLabel.textContent = voiceOn ? "Voz" : "Sin voz";
}

function applyBreathingSoundState(enabled) {
  const soundOn = Boolean(enabled);
  setBreathingSoundEnabled(soundOn);
  breathingSound.checked = soundOn;
  sessionBreathingSoundToggle.checked = soundOn;
  sessionBreathingSoundLabel.textContent = soundOn ? "Respiración" : "Sin respiración";
}

function applyVoiceVolumeState(value) {
  const numeric = Number(value);
  const normalized = Number.isFinite(numeric)
    ? Math.min(1, Math.max(0, numeric))
    : 1;
  const percent = Math.round(normalized * 100);

  setSpeechVolume(normalized);

  voiceVolume.value = String(percent);
  voiceVolumeValue.value = `${percent}%`;
  voiceVolumeValue.textContent = `${percent}%`;

  sessionVoiceVolume.value = String(percent);
  sessionVoiceVolumeValue.value = `${percent}%`;
  sessionVoiceVolumeValue.textContent = `${percent}%`;
}


function populateVoiceChoices(preferredName = voiceChoice.value || "auto") {
  const voices = getSpeechVoiceOptions();
  const previous = preferredName || "auto";

  voiceChoice.innerHTML = "";

  const autoOption = document.createElement("option");
  autoOption.value = "auto";
  autoOption.textContent = "Automática · relajante";
  voiceChoice.appendChild(autoOption);

  voices.forEach(voice => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} · ${voice.lang}${voice.natural ? " · Natural" : ""}`;
    voiceChoice.appendChild(option);
  });

  const available = [...voiceChoice.options].some(option => option.value === previous);
  voiceChoice.value = available ? previous : "auto";

  automaticVoiceName.textContent = `Automática: ${getAutomaticVoiceLabel()}`;
}

function applyVoiceChoiceState(name = "auto") {
  const requested = String(name || "auto");
  populateVoiceChoices(requested);
  setSpeechVoice(voiceChoice.value || "auto");
}

function applyBreathingSoundVolumeState(value) {
  const normalized = Math.min(1, Math.max(0, Number(value) || 0));
  const percent = Math.round(normalized * 100);

  setBreathingSoundVolume(normalized);

  breathingSoundVolume.value = String(percent);
  breathingSoundVolumeValue.value = `${percent}%`;
  breathingSoundVolumeValue.textContent = `${percent}%`;

  sessionBreathingVolume.value = String(percent);
  sessionBreathingVolumeValue.value = `${percent}%`;
  sessionBreathingVolumeValue.textContent = `${percent}%`;
}

setupAudioSettingsBtn.addEventListener("click", () => {
  toggleAudioPanel(setupAudioSettingsBtn, setupAudioSettingsPanel);
});

sessionAudioSettingsBtn.addEventListener("click", () => {
  toggleAudioPanel(sessionAudioSettingsBtn, sessionAudioSettingsPanel);
});

breathCount.addEventListener("change", queuePreferenceSave);
roundCount.addEventListener("change", queuePreferenceSave);
pace.addEventListener("change", queuePreferenceSave);

voiceGuide.addEventListener("change", () => {
  applyVoiceState(voiceGuide.checked);
  queuePreferenceSave();
});

voiceChoice.addEventListener("change", () => {
  setSpeechVoice(voiceChoice.value || "auto");
  queuePreferenceSave();
});

testVoiceBtn.addEventListener("click", () => {
  setSpeechVoice(voiceChoice.value || "auto");
  speak("Inhala suavemente. Exhala.", {
    interrupt: true,
    rate: 0.9,
    pitch: 0.98
  });
});

voiceVolume.addEventListener("input", () => {
  applyVoiceVolumeState(Number(voiceVolume.value) / 100);
  queuePreferenceSave();
});

sessionSoundToggle.addEventListener("change", () => {
  applyVoiceState(sessionSoundToggle.checked);
  queuePreferenceSave();
});

sessionVoiceVolume.addEventListener("input", () => {
  applyVoiceVolumeState(Number(sessionVoiceVolume.value) / 100);
  queuePreferenceSave();
});

breathingSound.addEventListener("change", async () => {
  applyBreathingSoundState(breathingSound.checked);

  if (breathingSound.checked) {
    await primeBreathingAudio();
  }

  queuePreferenceSave();
});

breathingSoundVolume.addEventListener("input", () => {
  applyBreathingSoundVolumeState(Number(breathingSoundVolume.value) / 100);
  queuePreferenceSave();
});

sessionBreathingVolume.addEventListener("input", () => {
  applyBreathingSoundVolumeState(Number(sessionBreathingVolume.value) / 100);
  queuePreferenceSave();
});

sessionBreathingSoundToggle.addEventListener("change", async () => {
  applyBreathingSoundState(sessionBreathingSoundToggle.checked);

  if (sessionBreathingSoundToggle.checked) {
    await primeBreathingAudio();
  }

  queuePreferenceSave();
});


onSpeechVoicesChanged(() => {
  const selected = currentProfile?.preferences?.voiceName || voiceChoice.value || "auto";
  populateVoiceChoices(selected);
  setSpeechVoice(voiceChoice.value || "auto");
});

startBtn.addEventListener("click", async () => {
  activeConfig = getConfig();

  // La sesión comienza con el mezclador cerrado para mantener la pantalla limpia.
  sessionAudioSettingsPanel.classList.add("hidden");
  sessionAudioSettingsBtn.setAttribute("aria-expanded", "false");
  sessionAudioSettingsBtn.textContent = "Volumen";

  // Los navegadores requieren una interacción del usuario para activar audio.
  // El clic en "Comenzar sesión" desbloquea Web Audio antes del primer ciclo.
  if (activeConfig.breathingSound) {
    await primeBreathingAudio();
  }

  engine.start(activeConfig);
});

finishRetentionBtn.addEventListener("click", () => {
  engine.finishRetention();
});

stopBtn.addEventListener("click", () => {
  const confirmStop = window.confirm(
    "¿Quieres finalizar esta sesión? En esta primera versión no se guardará el progreso incompleto."
  );

  if (confirmStop) engine.stop(true);
});

newSessionBtn.addEventListener("click", () => {
  showView(setupView);
});
