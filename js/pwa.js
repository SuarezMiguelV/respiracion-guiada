const APP_VERSION = "2.16";

let deferredInstallPrompt = null;
let swRegistration = null;
let refreshing = false;

const installBtn = document.querySelector("#installAppBtn");
const installStatus = document.querySelector("#installStatus");
const updateBanner = document.querySelector("#updateBanner");
const updateBtn = document.querySelector("#updateAppBtn");
const dismissUpdateBtn = document.querySelector("#dismissUpdateBtn");
const appVersion = document.querySelector("#appVersion");

function setInstallStatus(message = "") {
  if (installStatus) installStatus.textContent = message;
}

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

function updateInstallUi() {
  if (!installBtn) return;
  if (isStandalone()) {
    installBtn.classList.add("hidden");
    setInstallStatus("");
    return;
  }
  installBtn.classList.toggle("hidden", !deferredInstallPrompt);
}

function showUpdateBanner() { updateBanner?.classList.remove("hidden"); }
function hideUpdateBanner() { updateBanner?.classList.add("hidden"); }

function trackInstallingWorker(worker) {
  if (!worker) return;
  worker.addEventListener("statechange", () => {
    if (worker.state === "installed" && navigator.serviceWorker.controller) {
      showUpdateBanner();
    }
  });
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallUi();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  updateInstallUi();
  setInstallStatus("Aplicación instalada.");
});

installBtn?.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    setInstallStatus("Usa la opción Instalar aplicación de tu navegador.");
    return;
  }
  installBtn.disabled = true;
  try {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice?.outcome === "accepted") setInstallStatus("Instalando aplicación…");
    deferredInstallPrompt = null;
    updateInstallUi();
  } catch (error) {
    console.error("No se pudo iniciar la instalación PWA:", error);
    setInstallStatus("No se pudo iniciar la instalación.");
  } finally {
    installBtn.disabled = false;
  }
});

updateBtn?.addEventListener("click", () => {
  const waiting = swRegistration?.waiting;
  if (!waiting) {
    hideUpdateBanner();
    swRegistration?.update();
    return;
  }
  updateBtn.disabled = true;
  updateBtn.textContent = "Actualizando…";
  waiting.postMessage({ type: "SKIP_WAITING" });
});

dismissUpdateBtn?.addEventListener("click", hideUpdateBanner);

navigator.serviceWorker?.addEventListener("controllerchange", () => {
  if (refreshing) return;
  refreshing = true;
  window.location.reload();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      swRegistration = await navigator.serviceWorker.register("./service-worker.js", { scope: "./" });
      if (swRegistration.waiting && navigator.serviceWorker.controller) showUpdateBanner();
      swRegistration.addEventListener("updatefound", () => trackInstallingWorker(swRegistration.installing));
      try { await swRegistration.update(); }
      catch (error) { console.warn("No fue posible comprobar actualizaciones:", error); }
    } catch (error) {
      console.error("No se pudo registrar el Service Worker:", error);
      setInstallStatus("No se pudo activar el modo instalable.");
    }
  });
}

if (appVersion) appVersion.textContent = `v${APP_VERSION}`;
updateInstallUi();
