let headersSet = false; // Déclarée en dehors des fonctions

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
}


function loadNomenclatureInTable(id) {
    const history = JSON.parse(sessionStorage.getItem("NomenclatureHistory") || "[]");
    const nomenclature = history.find(item => item.id === id);
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

function renderNomenclatureHistory() {
    const container = document.querySelector(".physicalActivitySettingsHistory");
    const history = JSON.parse(sessionStorage.getItem("NomenclatureHistory") || "[]");

    // Vide les anciens éléments sauf le titre
    container.innerHTML = "<p>Nomenclatures historiques</p>";

    history.forEach(item => {
        const div = document.createElement("div");
        div.className = "physicalActivitySettingsHistoryItem";
        const nameSpan = document.createElement("span");
        nameSpan.textContent = item.nomenclatureName + " (" + item.exerciseType + ")";
        nameSpan.style.cursor = "pointer";
        nameSpan.onclick = () => loadNomenclatureInTable(item.id);

        div.appendChild(nameSpan);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "X";
        deleteBtn.style.marginLeft = "10px";
        deleteBtn.onclick = () => deleteNomenclature(item.id);

        div.appendChild(deleteBtn);
        container.appendChild(div);
    });
}

function deleteNomenclature(id) {
    let history = JSON.parse(sessionStorage.getItem("NomenclatureHistory") || "[]");
    history = history.filter(item => item.id !== id);
    sessionStorage.setItem("NomenclatureHistory", JSON.stringify(history));
    renderNomenclatureHistory();
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


function saveToSessionStorage() {
    const exerciseSelector = document.getElementById("PhysicalActivitySettingsExerciseSelector");
    const nomenclatureNameInput = document.getElementById("physicalActivitySettingsNomenclatureName");

    const exerciseType = exerciseSelector.value.trim();
    const nomenclatureName = nomenclatureNameInput.value.trim();

    if (!exerciseType || !nomenclatureName) {
        alert("Veuillez remplir tous les champs avant de sauvegarder.");
        return;
    }

    const headerCells = document.querySelectorAll("#TablephysicalActivitySettings thead th");
    const headers = Array.from(headerCells).map(th => th.textContent.trim());

    const rows = document.querySelectorAll("#TablephysicalActivitySettings tbody tr");
    const tranches = [];

    rows.forEach(row => {
        const inputs = row.querySelectorAll("input");
        const tranche = Array.from(inputs).map(input => input.value.trim());
        if (tranche.length > 0 && tranche.some(val => val !== "")) {
            tranches.push(tranche);
        }
    });

    const newNomenclature = {
        id: Date.now(), // identifiant unique
        exerciseType,
        nomenclatureName,
        headers,
        tranches
    };

    let history = JSON.parse(sessionStorage.getItem("NomenclatureHistory") || "[]");
    history.push(newNomenclature);
    sessionStorage.setItem("NomenclatureHistory", JSON.stringify(history));

    renderNomenclatureHistory(); // 🔁 Met à jour l'affichage
    nomenclatureNameInput.value = "";
    exerciseSelector.value = "";
    document.querySelector("#TablephysicalActivitySettings tbody").innerHTML = "";
    headersSet = false;
    headerCells.forEach(th => th.innerHTML = "");
}




export function setTreadmillBehavior() {
    const addSliceButton = document.getElementById("physicalActivitySettingsBtn");
    const exerciseSelector = document.getElementById("PhysicalActivitySettingsExerciseSelector");

    const newNomenclatureButton = document.getElementById("physicalActivitySettingsNewBtn");
    newNomenclatureButton.onclick = () => {
        resetNomenclatureForm();
    };


    addSliceButton.onclick = () => {
        const selectedExercise = exerciseSelector.value.trim();
        if (!selectedExercise) {
            alert("Veuillez d'abord sélectionner un type d'exercice.");
            return;
        }

        setHeadersTable();
        addLineToBodyTable();
    };

    const saveNomenclatureButton = document.getElementById("physicalActivitySettingsSaveBtn");
    saveNomenclatureButton.onclick = () => {
        saveToSessionStorage();
    };

    // 🔁 Historique visible au chargement
    renderNomenclatureHistory();
}
