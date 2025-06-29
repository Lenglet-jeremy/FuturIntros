
// Exercices.js

import { setSettingBehavior } from "./Settings/Settings.js";

export function setExercicesContentTabSelection() {
    const btns = document.querySelectorAll('.ExercicesContentTabsBar .TabBtn');
    const contentArea = document.getElementById('ExercicesContentData');

    // 🔍 Détection de l’onglet dans l’URL
    const pathParts = window.location.pathname.split('/');
    const tabFromUrl = pathParts.length === 3 ? pathParts[2].charAt(0).toUpperCase() + pathParts[2].slice(1).toLowerCase() : null;

    const availableTabs = ['Settings', 'Entrys', 'Handlings'];
    const selectedTab = availableTabs.includes(tabFromUrl) ? tabFromUrl : 'Entrys';

    

    const defaultBtn = document.querySelector(`.TabBtn[data-tab="${selectedTab}"]`);
    if (defaultBtn) {
        btns.forEach(b => b.classList.remove('Selected'));
        defaultBtn.classList.add('Selected');

        fetch(`/Modules/Exercices/${selectedTab}/${selectedTab}.html`)
            .then(res => {
                if (!res.ok) throw new Error("Erreur réseau");
                return res.text();
            })
            .then(html => {
                contentArea.innerHTML = html;
                
                if (tabFromUrl === "Settings") {
                    console.log("dfg");
                    console.log("dfg");
                    console.log("dfg");
                    console.log("dfg");
                    console.log("dfg");
                    console.log("dfg");
                    console.log("dfg");
                    
                    
                    setSettingBehavior();
                }
            })
            .catch(err => {
                console.error(err);
                contentArea.innerHTML = "<p>Erreur lors du chargement de l'onglet.</p>";
            });
    }

    // Gestion des clics
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // 🧠 Mise à jour de l'URL
            const newUrl = `/exercices/${tabName.toLocaleLowerCase()}`;
            
            history.pushState({ tab: tabName }, '', newUrl);


            btns.forEach(b => b.classList.remove('Selected'));
            btn.classList.add('Selected');

            fetch(`/Modules/Exercices/${tabName}/${tabName}.html`)
                
                .then(res => {
                    if (!res.ok) throw new Error("Erreur réseau");
                    return res.text();
                })
                .then(html => {
                    contentArea.innerHTML = html;
                })
                .catch(err => {
                    console.error(err);
                    contentArea.innerHTML = "<p>Erreur lors du chargement de l'onglet.</p>";
                });
        });
    });
}







