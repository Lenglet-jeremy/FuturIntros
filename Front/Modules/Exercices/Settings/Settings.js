import { setTreadmillBehavior } from "./ExercicesType/Cardio/Treadmill/Treadmill.js";



export function setSettingBehavior() {
    console.log("gfhjghj");
    console.log("gfhjghj");
    console.log("gfhjghj");
    const exerciceType = document.getElementById("PhysicalActivitySettingsExerciseSelector");

    exerciceType.addEventListener("change", () => {
        if (exerciceType.value === "Tapis de course") {
            setTreadmillBehavior();
        }
    });

    // ✅ Ajout : déclenche immédiat si déjà sélectionné
    if (exerciceType.value === "Tapis de course") {
        setTreadmillBehavior();
    }
}
