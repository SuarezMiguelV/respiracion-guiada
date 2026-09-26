let deferredInstallPrompt = null;

const installBtn = document.querySelector("#installAppBtn");
const installStatus = document.querySelector("#installStatus");

function setInstallStatus(message = "") {
  if (installStatus) installStatus.textContent = message;
}

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true
  );
}

function updateInstallUi() {
  if (!installBtn) return;

  if (isStandalone()) {
    installBtn.classList.add("hidden");
    setInstallStatus("Aplicación instalada.");
    return;
  }

  installBtn.classList.toggle("hidden", !deferredInstallPrompt);
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

    if (choice?.outcome === "accepted") {
      setInstallStatus("Instalando aplicación…");
    }

    deferredInstallPrompt = null;
    updateInstallUi();
  } catch (error) {
    console.error("No se pudo iniciar la instalación PWA:", error);
    setInstallStatus("No se pudo iniciar la instalación.");
  } finally {
    installBtn.disabled = false;
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./service-worker.js", {
        scope: "./"
      });
    } catch (error) {
      console.error("No se pudo registrar el Service Worker:", error);
      setInstallStatus("No se pudo activar el modo instalable.");
    }
  });
}

updateInstallUi();
