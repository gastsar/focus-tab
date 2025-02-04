// Fonction pour appliquer le flou selon les paramètres de focusMode et whitelist
function applyBlur() {
  chrome.storage.local.get(
    ["focusMode", "whitelist"],
    ({ focusMode, whitelist }) => {
      let currentSite = window.location.hostname;

      // Ne pas appliquer le flou sur les pages système comme chrome://, extensions://, etc.
      if (
        currentSite.startsWith("chrome://") ||
        currentSite.startsWith("extensions") ||
        currentSite.startsWith("chrome://extensions")
      ) {
        return; // Sortir si c'est une page système
      }

      // Vérifier si le site actuel est dans la liste blanche
      let isWhitelisted =
        whitelist && whitelist.some((site) => currentSite.includes(site));

      // Appliquer ou non le flou en fonction de focusMode et de la whitelist
      document.body.style.filter =
        focusMode && !isWhitelisted ? "blur(5px)" : "none";
    }
  );
}

// Appliquer le flou dès le chargement de la page
applyBlur();

// Écouter les changements dans chrome.storage pour mettre à jour en temps réel
chrome.storage.onChanged.addListener((changes) => {
  if (changes.whitelist || changes.focusMode) {
    applyBlur(); // Appliquer la mise à jour du flou en temps réel
  }
});
