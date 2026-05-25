if ("serviceWorker" in navigator && ["http:", "https:"].includes(window.location.protocol)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      // The app still works normally if the browser blocks service workers.
    });
  });
}

let pendingInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  pendingInstallPrompt = event;
  showInstallButton();
});

window.addEventListener("appinstalled", () => {
  pendingInstallPrompt = null;
  document.querySelector("#installAppButton")?.remove();
});

function showInstallButton() {
  if (!pendingInstallPrompt || document.querySelector("#installAppButton")) return;

  const button = document.createElement("button");
  button.id = "installAppButton";
  button.className = "install-app-button";
  button.type = "button";
  button.textContent = "Install App";
  button.addEventListener("click", async () => {
    if (!pendingInstallPrompt) return;
    pendingInstallPrompt.prompt();
    await pendingInstallPrompt.userChoice;
    pendingInstallPrompt = null;
    button.remove();
  });
  document.body.append(button);
}
