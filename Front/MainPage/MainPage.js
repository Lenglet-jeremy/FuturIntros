// MainPage.js

import { loadPageContent } from "./Router/Router.js";


export async function handleMainPageRoutes(path) {
    const bodyDiv = document.getElementById("BodyContent");

    try {
        const mainRes = await fetch('./MainPage/MainPage.html');
        if (!mainRes.ok) throw new Error("MainPage.html non trouvé");

        const mainHtml = await mainRes.text();
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = mainHtml;

        const mainPageContent = tempDiv.querySelector("#MainPageContentArea");
        const selectedMenuContainer = tempDiv.querySelector("#MainPageSelectedMenu");

        if (!mainPageContent || !selectedMenuContainer) {
            throw new Error("Structure invalide dans MainPage.html");
        }

        bodyDiv.innerHTML = mainPageContent.outerHTML;

        // ✅ Mise à jour du nom utilisateur
        const token = localStorage.getItem('token');
        const accountName = document.getElementById('AccountName');

        if (token && accountName) {
            try {
                const res = await fetch('/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await res.json();
                console.log(data);

                if (!res.ok || data.error === "Token invalide") {
                    localStorage.removeItem('token');
                    accountName.textContent = "Compte";
                    history.pushState(null, null, "/login");
                    window.dispatchEvent(new PopStateEvent('popstate'));
                    return;
                }

                // ✅ Affiche nom ou email
                accountName.textContent = data.name ?? data.email;

            } catch (err) {
                console.warn("Erreur lors de la récupération du compte:", err);
                localStorage.removeItem('token');
                accountName.textContent = "Compte";
                history.pushState(null, null, "/login");
                window.dispatchEvent(new PopStateEvent('popstate'));
                return;
            }
        } else if (!token && accountName) {
            accountName.textContent = "Compte";
        }


        handleBurgerMenu();
        await loadPageContent(path);
        
    } catch (err) {
        console.error(err);
        bodyDiv.innerHTML = `<p>📛 Une erreur est survenue</p>`;
    }
}


export function handleBurgerMenu() {
  const burger = document.getElementById('MainPageBurgerToggle');
  const close = document.getElementById('MainPageCloseMenu');
  const menu = document.getElementById('MainPageMainMenu');
  const nav = document.getElementById('MainPageNavigationPanel');
  const accountButton = document.getElementById('MainPageUserAccountArea');
  const logoutButton = document.getElementById('LogoutButton');
  const accountName = document.getElementById('AccountName');

  // → menu burger
  if (burger && close && menu && nav) {
    burger.addEventListener('click', () => {
      menu.classList.add('active');
      menu.style.visibility = "visible";
      nav.classList.add('menuOpen');
    });

    const closeMenu = () => {
      menu.classList.remove('active');
      nav.classList.remove('menuOpen');
      setTimeout(() => {
        menu.style.visibility = "hidden";
      }, 500);
    };

    close.addEventListener('click', closeMenu);
    const links = menu.querySelectorAll('a[data-link]');
    links.forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // → bouton "Se déconnecter"
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('token');

      if (accountName) accountName.textContent = "Compte";

      history.pushState(null, null, "/login");
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  }

  // → clic sur "Compte"
  if (accountButton) {
    accountButton.addEventListener('click', () => {
      const token = localStorage.getItem('token');
      const target = token ? "/account" : "/login";
      history.pushState(null, null, target);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  }
}

