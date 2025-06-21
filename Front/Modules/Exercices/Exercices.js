// Exercices.js
export function setExercicesContentTabSelection() {
    const btns = document.querySelectorAll('.ExercicesContentTabsBar .TabBtn');
    const contentArea = document.getElementById('ExercicesContentData');

    const defaultTab = 'Entrys';

    // ✅ Sélectionner et charger "Entrys" par défaut
    if (contentArea && contentArea.innerHTML.trim() === '') {
        const defaultBtn = document.querySelector(`.TabBtn[data-tab="${defaultTab}"]`);
        if (defaultBtn) {
            btns.forEach(b => b.classList.remove('Selected'));
            defaultBtn.classList.add('Selected');

            fetch(`Modules/Exercices/${defaultTab}/${defaultTab}.html`)
                .then(res => {
                    if (!res.ok) throw new Error("Erreur réseau");
                    return res.text();
                })
                .then(html => {
                    contentArea.innerHTML = html;
                })
                .catch(err => {
                    console.error(err);
                    contentArea.innerHTML = "<p>Erreur lors du chargement de l'onglet par défaut.</p>";
                });
        }
    }

    // ✅ Gestion des clics sur les autres onglets
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            btns.forEach(b => b.classList.remove('Selected'));
            btn.classList.add('Selected');

            fetch(`Modules/Exercices/${tabName}/${tabName}.html`)
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
