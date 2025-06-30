// Settings.js

import {
  renderNomenclatureHistory,
  setTreadmillBehavior,
  fetchCurrentUser // 👈 on l'importe
} from "./ExercicesType/Cardio/Treadmill/Treadmill.js";

export async function setSettingBehavior() {
  await fetchCurrentUser(); // ✅ appel obligatoire avant tout

  renderNomenclatureHistory(""); // 👈 maintenant ça fonctionne au 1er chargement

  const exerciceType = document.getElementById("PhysicalActivitySettingsExerciseSelector");

  exerciceType.addEventListener("change", () => {
    if (exerciceType.value === "Tapis de course") {
      setTreadmillBehavior();
    }
  });

  if (exerciceType.value === "Tapis de course") {
    setTreadmillBehavior();
  }
}
