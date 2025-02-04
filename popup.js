// Fonction pour activer/désactiver Focus
document.getElementById("toggleFocus").addEventListener("click", () => {
  chrome.storage.local.get(
    ["focusMode", "hardcoreMode"],
    ({ focusMode, hardcoreMode }) => {
      if (hardcoreMode) {
        alert("Mode Hardcore activé ! Impossible de désactiver Focus.");
        return;
      }
      // Si pas en mode hardcore, basculer focusMode
      chrome.storage.local.set({ focusMode: !focusMode }, () => {
        updateFocusButton();
      });
    }
  );
});

// Fonction pour mettre à jour le bouton "Focus"
function updateFocusButton() {
  chrome.storage.local.get("focusMode", ({ focusMode }) => {
    document.getElementById("toggleFocus").textContent = focusMode
      ? "Désactiver Focus"
      : "Activer Focus";
  });
}

// Vérifier si on est sur chrome://extensions/ pour désactiver le bouton
function checkIfOnExtensionsPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0].url.startsWith("chrome://extensions/")) {
      document.getElementById("toggleFocus").disabled = true;
    } else {
      document.getElementById("toggleFocus").disabled = false;
    }
  });
}
checkIfOnExtensionsPage();

// Ajouter une URL à la liste blanche
document.getElementById("addWhitelist").addEventListener("click", () => {
  let url = document.getElementById("whitelistUrl").value.trim();
  if (!url) return;

  chrome.storage.local.get({ whitelist: [] }, ({ whitelist }) => {
    if (!whitelist.includes(url)) {
      whitelist.push(url);
      chrome.storage.local.set({ whitelist }, () => {
        updateWhitelistUI();
        chrome.runtime.sendMessage({ action: "updateWhitelist" }); // Notifier content.js
      });
    }
  });
});

// Mise à jour de l'UI de la liste blanche
function updateWhitelistUI() {
  chrome.storage.local.get({ whitelist: [] }, ({ whitelist }) => {
    let listElement = document.getElementById("whitelist");
    listElement.innerHTML = "";
    whitelist.forEach((site) => {
      let li = document.createElement("li");
      li.textContent = site;
      let removeBtn = document.createElement("button");
      removeBtn.textContent = "X";
      removeBtn.addEventListener("click", () => {
        chrome.storage.local.set({
          whitelist: whitelist.filter((s) => s !== site),
        });
        updateWhitelistUI();
      });
      li.appendChild(removeBtn);
      listElement.appendChild(li);
    });
  });
}

// Fonction pour activer le mode Hardcore
document.getElementById("toggleHardcore").addEventListener("click", () => {
  chrome.storage.local.get(["focusMode"], ({ focusMode }) => {
    if (!focusMode) {
      alert(
        "Le mode Focus doit être activé avant de pouvoir activer le mode Hardcore."
      );
      return;
    }

    // Récupérer la durée sélectionnée pour le mode Hardcore
    let duration = parseInt(
      document.getElementById("hardcoreDuration").value,
      10
    );
    if (isNaN(duration) || duration <= 0) {
      alert("Veuillez entrer une durée valide.");
      return;
    }

    let endTime = Date.now() + duration * 1000;

    chrome.storage.local.set(
      { hardcoreMode: true, hardcoreEndTime: endTime },
      () => {
        updateHardcoreUI();
      }
    );
  });
});

// Mise à jour de l'UI du mode Hardcore
function updateHardcoreUI() {
  chrome.storage.local.get(
    ["hardcoreMode", "hardcoreEndTime"],
    ({ hardcoreMode, hardcoreEndTime }) => {
      let timerElement = document.getElementById("hardcoreTimer");

      if (hardcoreMode) {
        let interval = setInterval(() => {
          let remaining = Math.max(
            0,
            Math.floor((hardcoreEndTime - Date.now()) / 1000)
          );
          timerElement.textContent = `Temps restant : ${remaining} sec`;

          if (remaining <= 0) {
            chrome.storage.local.set({ hardcoreMode: false }, () => {
              clearInterval(interval);
              updateHardcoreUI();
            });
          }
        }, 1000);
      } else {
        timerElement.textContent = "";
      }
    }
  );
}

// Initialisation de l'interface
updateFocusButton();
updateHardcoreUI();
updateWhitelistUI();
chrome.runtime.sendMessage({ action: "updateWhitelist" });
