import { setTreadmillBehavior } from "./ExercicesType/Cardio/Treadmill/Treadmill.js";

export function setSettingBehavior(){
    console.log("fgh");
    
    
    
    const exerciceType = document.getElementById("PhysicalActivitySettingsExerciseSelector")

    exerciceType.addEventListener("change", () => {
        if(exerciceType.value === "Tapis de course"){
            
            setTreadmillBehavior()
        }
        
    })
    
}