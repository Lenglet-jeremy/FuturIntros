// Treadmill.js

let headersSet = false; // Déclarée en dehors des fonctions
let nomenclatureHistory = []; // en haut du fichier
const currentUser = {
  name: "invité",
  email: "invité"
};

async function saveToLocaleStorage() {
  if (currentUser.name === "invité" || currentUser.email === "invité") {
    await fetchCurrentUser(); // ← tente de mettre à jour
  }

  const exerciseType = document.getElementById("PhysicalActivitySettingsExerciseSelector").value.trim();
  const nomenclatureName = document.getElementById("physicalActivitySettingsNomenclatureName").value.trim();

  if (!exerciseType || !nomenclatureName) {
    alert("Veuillez remplir tous les champs.");
    return;
  }

  const headers = Array.from(document.querySelectorAll("#TablephysicalActivitySettings thead th"))
    .map(th => th.textContent.trim());
  const tranches = Array.from(document.querySelectorAll("#TablephysicalActivitySettings tbody tr"))
    .map(row => Array.from(row.querySelectorAll("input")).map(input => input.value.trim()));

  const payload = {
    _id: Date.now().toString(), // id unique même hors ligne
    nomenclatureName,
    exerciseType,
    headers,
    tranches
  };

  if (currentUser.email === "invité") {
    // Sauvegarde dans localStorage
    const guestData = JSON.parse(localStorage.getItem("nomenclatures") || "[]");
    guestData.push(payload);
    localStorage.setItem("nomenclatures", JSON.stringify(guestData));
  } else {
    // Sauvegarde en base
    payload.userName = currentUser.name;
    payload.userEmail = currentUser.email;

    try {
      const res = await fetch("/api/nomenclatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde en base");
    } catch (err) {
      console.error(err);
      alert("Erreur MongoDB.");
    }
  }

  renderNomenclatureHistory();
  resetNomenclatureForm();
}

async function migrateLocalToMongoIfNeeded() {
  if (currentUser.email !== "invité") {
    const guestData = JSON.parse(localStorage.getItem("nomenclatures") || "[]");

    for (const payload of guestData) {
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

async function fetchCurrentUser() {

  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Token non trouvé");

    const response = await fetch("/me", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Réponse non valide de /me");
    }

    const data = await response.json();
    if (data.error === "Token invalide") {
      localStorage.removeItem("token");
      throw new Error("Token invalide");
    }

    // Mise à jour du currentUser global
    currentUser.name = data.name ?? "invité";
    currentUser.email = data.email ?? "invité";

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

async function renderNomenclatureHistory(exerciseType = "") {
  const container = document.querySelector(".physicalActivitySettingsHistory");

  if (!exerciseType) {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  container.style.display = "block"; // ou "" selon ton design
  container.innerHTML = "<p>Nomenclatures historiques</p>";

  let history = [];

  if (currentUser.email === "invité") {
    history = JSON.parse(localStorage.getItem("nomenclatures") || "[]");
  } else {
    const res = await fetch(`/api/nomenclatures?email=${currentUser.email}`);
    history = await res.json();
  }

  nomenclatureHistory = history;

  const filteredHistory = history.filter(item => item.exerciseType === exerciseType);

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