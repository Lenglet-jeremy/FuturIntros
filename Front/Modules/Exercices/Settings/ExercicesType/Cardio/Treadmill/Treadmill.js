// Treadmill.js

let headersSet = false; // Déclarée en dehors des fonctions
let nomenclatureHistory = []; // en haut du fichier
const currentUser = {
  name: "invité",
  email: "invité"
};

async function saveToLocaleStorage() {
  if (currentUser.name === "invité" || currentUser.email === "invité") {
    await fetchCurrentUser();
  }

  const exerciseType = document.getElementById("PhysicalActivitySettingsExerciseSelector").value.trim();
  const nomenclatureName = document.getElementById("physicalActivitySettingsNomenclatureName").value.trim();

  if (!exerciseType || !nomenclatureName) {
    alert("Veuillez remplir tous les champs.");
    return;
  }

  // Récupérer les données existantes selon utilisateur (local ou mongo)
  let existingData = [];
  if (currentUser.email === "invité") {
    existingData = JSON.parse(localStorage.getItem("nomenclatures") || "[]");
  } else {
    const res = await fetch(`/api/nomenclatures?email=${currentUser.email}`);
    if (res.ok) {
      existingData = await res.json();
    } else {
      alert("Erreur lors de la récupération des données.");
      return;
    }
  }

  // Chercher si un doublon existe (même nom ET même exerciceType)
  const duplicateIndex = existingData.findIndex(item =>
    item.nomenclatureName === nomenclatureName && item.exerciseType === exerciseType
  );

  // Si doublon trouvé, demander confirmation
  if (duplicateIndex !== -1) {
    const confirmed = confirm(`Une nomenclature avec le nom "${nomenclatureName}" pour "${exerciseType}" existe déjà. Voulez-vous l'écraser ?`);
    if (!confirmed) {
      return; // Annule la sauvegarde
    }
  }

  // Préparer le payload avec un nouvel _id ou garder l'ancien si doublon
  const payload = {
    _id: duplicateIndex !== -1 ? existingData[duplicateIndex]._id : Date.now().toString(),
    nomenclatureName,
    exerciseType,
    headers: Array.from(document.querySelectorAll("#TablephysicalActivitySettings thead th")).map(th => th.textContent.trim()),
    tranches: Array.from(document.querySelectorAll("#TablephysicalActivitySettings tbody tr"))
      .map(row => Array.from(row.querySelectorAll("input")).map(input => input.value.trim()))
  };

  if (currentUser.email === "invité") {
    if (duplicateIndex !== -1) {
      // Remplace la nomenclature existante
      existingData[duplicateIndex] = payload;
    } else {
      existingData.push(payload);
    }
    localStorage.setItem("nomenclatures", JSON.stringify(existingData));
  } else {
    payload.userName = currentUser.name;
    payload.userEmail = currentUser.email;

    try {
      // Si doublon, mettre à jour (PUT ou PATCH), sinon POST
      if (duplicateIndex !== -1) {
        const res = await fetch(`/api/nomenclatures/${payload._id}`, {
          method: "PUT", // ou PATCH selon API
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Erreur lors de la mise à jour en base");
      } else {
        const res = await fetch("/api/nomenclatures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Erreur lors de la sauvegarde en base");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur MongoDB.");
      return;
    }
  }

  // Met à jour l'historique et recharge la nomenclature
  await renderNomenclatureHistory(exerciseType);
  loadNomenclatureInTable(payload._id);

  // Surligne visuellement la nomenclature active
  document.querySelectorAll(".physicalActivitySettingsHistoryItem").forEach(item => item.classList.remove("active"));

  const lastHistoryItem = [...document.querySelectorAll(".physicalActivitySettingsHistoryItem")]
    .find(item => item.textContent.includes(nomenclatureName) && item.textContent.includes(exerciseType));
  if (lastHistoryItem) {
    lastHistoryItem.classList.add("active");
  }

  console.log("Nomenclature sauvegardée !");
}



async function migrateLocalToMongoIfNeeded() {

  // Si le mail utilisateur a été trouvé...
  if (currentUser.email !== "invité") {
    // Aller cherche les nomenclatures dans le localstorage
    const guestData = JSON.parse(localStorage.getItem("nomenclatures") || "[]");

    // Parcourt les nomenclatures créer
    // Pour les stocker dans /api/nomenclature 
    // qui sera utilisé pour stocker sur mongoDB
    for (const payload of guestData) {
      console.log(payload);
      
      payload.userName = currentUser.name;
      payload.userEmail = currentUser.email;

      await fetch("/api/nomenclatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    localStorage.removeItem("nomenclatures");
  }
}

export async function fetchCurrentUser() {

  try {

    // Recupere le jeton utilisateur
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Token non trouvé");

    // Utilise le jeton pour identifier l'utilisateur
    const response = await fetch("/me", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Réponse non valide de /me");
    }

    // Si l'utilisateur n'a pas été trouvé, supprimer le jeton
    const data = await response.json();
    if (data.error === "Token invalide") {
      localStorage.removeItem("token");
      throw new Error("Token invalide");
    }

    // Recupere le mail et nom utilisateur
    currentUser.name = data.name ?? "invité";
    currentUser.email = data.email ?? "invité";

    // Affiche le mail et nom utilisateur dans le font
    const nameEl = document.getElementById("UserAccountName");
    const emailEl = document.getElementById("UserAccountEmail");
    if (nameEl) nameEl.textContent = currentUser.name;
    if (emailEl) emailEl.textContent = currentUser.email;

    await migrateLocalToMongoIfNeeded();


  } catch (err) {
    console.warn("Utilisateur invité -", err.message);
  }
}


function setHeadersTable() {
    if (headersSet) return;

    const Table = document.getElementById("TablephysicalActivitySettings");
    const HeaderRow = Table.querySelector("thead tr");

    const DureeTh = document.createElement("th");
    DureeTh.textContent = "Durée";

    const InclinaisonTh = document.createElement("th");
    InclinaisonTh.textContent = "Inclinaison";

    const VitesseTh = document.createElement("th");
    VitesseTh.textContent = "Vitesse";

    HeaderRow.insertBefore(DureeTh, HeaderRow.children[0]);
    HeaderRow.insertBefore(InclinaisonTh, HeaderRow.children[1]);
    HeaderRow.insertBefore(VitesseTh, HeaderRow.children[2]);

    headersSet = true;

    const ActionTh = document.createElement("th");
    ActionTh.textContent = "Action";
    HeaderRow.appendChild(ActionTh);

}

function addLineToBodyTable() {
    const Table = document.getElementById("TablephysicalActivitySettings");
    const Body = Table.querySelector("tbody");

    const NewRow = document.createElement("tr");

    // Créer et ajouter 3 cellules avec input
    for (let i = 0; i < 3; i++) {
        const Td = document.createElement("td");
        const Input = document.createElement("input");
        Input.type = "text";
        Td.appendChild(Input);
        NewRow.appendChild(Td);
    }

    // Ajouter un bouton de suppression à la fin de la ligne
    const deleteTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.onclick = () => {
        NewRow.remove(); // Supprime la ligne
    };
    deleteTd.appendChild(deleteBtn);
    NewRow.appendChild(deleteTd);

    Body.appendChild(NewRow);
}


function resetNomenclatureForm() {
    // Vide les champs de saisie
    document.getElementById("physicalActivitySettingsNomenclatureName").value = "";
    document.getElementById("PhysicalActivitySettingsExerciseSelector").value = "";
    const nomenclatureIdInput = document.getElementById("physicalActivitySettingsNomenclatureId");
    if (nomenclatureIdInput) nomenclatureIdInput.value = "";

    // Vide le tableau
    const tbody = document.querySelector("#TablephysicalActivitySettings tbody");
    tbody.innerHTML = "";

    // Vide les en-têtes
    const thead = document.querySelector("#TablephysicalActivitySettings thead tr");
    thead.innerHTML = "";
    headersSet = false;

    // 🔄 Deselect de l'item actif dans l'historique
    document.querySelectorAll(".physicalActivitySettingsHistoryItem").forEach(item => {
        item.classList.remove("active");
    });
}

function loadNomenclatureInTable(id) {
    const nomenclature = nomenclatureHistory.find(item => item._id === id); // ✅
    if (!nomenclature) return;

    // Vide le tableau
    const tbody = document.querySelector("#TablephysicalActivitySettings tbody");
    tbody.innerHTML = "";

    // Vide les en-têtes et remet ceux de la nomenclature
    const thead = document.querySelector("#TablephysicalActivitySettings thead tr");
    thead.innerHTML = "";
    headersSet = false; // pour forcer setHeadersTable à rejouer
    nomenclature.headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        thead.appendChild(th);
    });

    // Ajoute une colonne "Action" si elle n'existe pas
    if (!nomenclature.headers.includes("Action")) {
        const th = document.createElement("th");
        th.textContent = "Action";
        thead.appendChild(th);
    }

    // Recrée les lignes avec les valeurs de tranches
    nomenclature.tranches.forEach(tranche => {
        const row = document.createElement("tr");

        tranche.forEach(value => {
            const td = document.createElement("td");
            const input = document.createElement("input");
            input.type = "text";
            input.value = value;
            td.appendChild(input);
            row.appendChild(td);
        });

        // Bouton de suppression de ligne
        const deleteTd = document.createElement("td");
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "🗑️";
        deleteBtn.onclick = () => row.remove();
        deleteTd.appendChild(deleteBtn);
        row.appendChild(deleteTd);

        tbody.appendChild(row);
    });

    // Remplit les champs en haut
  document.getElementById("physicalActivitySettingsNomenclatureName").value = nomenclature.nomenclatureName;
  document.getElementById("PhysicalActivitySettingsExerciseSelector").value = nomenclature.exerciseType;
}

function deleteNomenclature(id) {
  if (currentUser.email === "invité") {
    const guestData = JSON.parse(localStorage.getItem("nomenclatures") || "[]");
    const filtered = guestData.filter(item => item._id !== id);
    localStorage.setItem("nomenclatures", JSON.stringify(filtered));
    renderNomenclatureHistory();
  } else {
    fetch(`/api/nomenclatures/${id}`, { method: "DELETE" })
      .then(() => renderNomenclatureHistory())
      .catch(err => {
        console.error(err);
        alert("Erreur lors de la suppression.");
      });
  }
}

export async function renderNomenclatureHistory(exerciseType = "") {
  const container = document.querySelector(".physicalActivitySettingsHistory");

  container.style.display = "block"; // Toujours visible
  container.innerHTML = "<p>Nomenclatures historiques</p>";

  let history = [];

  if (currentUser.email === "invité") {
    history = JSON.parse(localStorage.getItem("nomenclatures") || "[]");
  } else {
    const res = await fetch(`/api/nomenclatures?email=${currentUser.email}`);
    history = await res.json();
  }

  nomenclatureHistory = history;

  // Si exerciseType est vide, on affiche tout
  const filteredHistory = exerciseType
    ? history.filter(item => item.exerciseType === exerciseType)
    : history;

  filteredHistory.forEach(item => {
    const div = document.createElement("div");
    div.className = "physicalActivitySettingsHistoryItem";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = `${item.nomenclatureName} (${item.exerciseType})`;
    nameSpan.style.cursor = "pointer";
    nameSpan.onclick = () => {
      document.querySelectorAll(".physicalActivitySettingsHistoryItem").forEach(item => {
        item.classList.remove("active");
      });
      div.classList.add("active");
      loadNomenclatureInTable(item._id);
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";
    deleteBtn.onclick = () => deleteNomenclature(item._id);

    div.appendChild(nameSpan);
    div.appendChild(deleteBtn);
    container.appendChild(div);
  });
}





export async function setTreadmillBehavior() {
    await fetchCurrentUser();
    const addSliceButton = document.getElementById("physicalActivitySettingsBtn");
    const exerciseSelector = document.getElementById("PhysicalActivitySettingsExerciseSelector");

    const newNomenclatureButton = document.getElementById("physicalActivitySettingsNewBtn");
    newNomenclatureButton.onclick = () => {
      resetNomenclatureForm();
      const selectedExercise = exerciseSelector.value.trim();
      renderNomenclatureHistory(selectedExercise);
    };



    addSliceButton.onclick = () => {
      const selectedExercise = exerciseSelector.value.trim();
      renderNomenclatureHistory(selectedExercise);


      if (!selectedExercise) {
        alert("Veuillez d'abord sélectionner un type d'exercice.");
        return;
      }

      setHeadersTable();
      addLineToBodyTable();
    };

    const saveNomenclatureButton = document.getElementById("physicalActivitySettingsSaveBtn");
    saveNomenclatureButton.onclick = () => {
        saveToLocaleStorage();
    };

    exerciseSelector.onchange = () => {
      const selectedExercise = exerciseSelector.value.trim();
      renderNomenclatureHistory(selectedExercise);
    };


    const selectedExercise = exerciseSelector.value.trim();
    renderNomenclatureHistory(selectedExercise);

}