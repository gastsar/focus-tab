let focusStartTime = null;

// Récupérer l'état du mode Focus
chrome.storage.local.get(
  ["focusMode", "hardcoreMode", "hardcoreEndTime"],
  ({ focusMode, hardcoreMode, hardcoreEndTime }) => {
    if (focusMode) {
      focusStartTime = Date.now();
    }

    // Vérifier si le mode Hardcore doit encore être actif
    if (hardcoreMode && Date.now() > hardcoreEndTime) {
      chrome.storage.local.set({ hardcoreMode: false });
    }
  }
);

// Gérer les changements d'état du mode Focus
chrome.storage.onChanged.addListener((changes) => {
  if (changes.focusMode) {
    chrome.storage.local.get("totalFocusTime", ({ totalFocusTime = 0 }) => {
      if (changes.focusMode.newValue) {
        focusStartTime = Date.now();
      } else if (focusStartTime) {
        let sessionTime = (Date.now() - focusStartTime) / 1000;
        focusStartTime = null;
        chrome.storage.local.set({
          totalFocusTime: totalFocusTime + sessionTime,
        });
      }
    });
  }
});

// Mise à jour de la liste blanche
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateWhitelist") {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.url && !tab.url.startsWith("chrome://") && chrome.scripting) {
          try {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"],
            });
          } catch (err) {
            console.error("Erreur d'injection de script : ", err.message);
          }
        }
      });
    });
  }
});

// Empêcher la désactivation du Focus si Hardcore est actif
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleFocus") {
    chrome.storage.local.get(
      ["hardcoreMode", "hardcoreEndTime"],
      ({ hardcoreMode, hardcoreEndTime }) => {
        if (hardcoreMode && Date.now() < hardcoreEndTime) {
          sendResponse({ blocked: true });
        } else {
          sendResponse({ blocked: false });
        }
      }
    );
    return true;
  }
});

// Fonction pour désactiver l'extension sur les pages `chrome://` et `edge://`
function handleTabUpdate(tabId, url) {
  if (!url) return;

  if (url.startsWith("chrome://") || url.startsWith("edge://")) {
    chrome.action.disable(tabId);
  } else {
    chrome.action.enable(tabId);
  }
}

// Vérifier lors du changement d'onglet actif
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab || !tab.url) return;
    handleTabUpdate(tabId, tab.url);
  });
});

// Vérifier lors du chargement ou mise à jour d'un onglet
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    handleTabUpdate(tabId, tab.url);
  }
});
