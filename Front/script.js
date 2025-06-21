// script.js

import { handleMainPageRoutes } from "./MainPage/MainPage.js";

function navigateTo(url) {
    history.pushState(null, null, url);
    routeTo(url);
}

function setURLNavigation() {
    document.addEventListener("click", e => {
        const link = e.target.closest("a[data-link]");
        if (link) {
            e.preventDefault();
            navigateTo(link.pathname);
        }
    });

    window.addEventListener("popstate", () => {
        routeTo(location.pathname);
    });
}

async function routeTo(path) {
    await handleMainPageRoutes(path);
}

setURLNavigation();
routeTo(location.pathname);




