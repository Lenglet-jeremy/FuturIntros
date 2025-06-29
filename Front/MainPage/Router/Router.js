// Router.js

import { setExercicesContentTabSelection } from "../../Modules/Exercices/Exercices.js";
import { loadUserAccountPage } from "../UserAccount/UserAccount.js";
import { SetEmailVerifyBehavior } from "../UserAccount/UserEmailVerify/UserEmailVerify.js";
import { setLoginBehavior } from "../UserAccount/UserLogin/UserLogin.js";
import { SetRegisterBehavior } from "../UserAccount/UserRegister/UserRegister.js";

const routes = {
    '/': './MainPage/Home/Home.html',

    '/exercices': '../Modules/Exercices/Exercices.html',
    '/exercices/settings': '../Modules/Exercices/Settings/Settings.html',
    '/exercices/entrys': '../Modules/Exercices/Entrys/Entrys.html',
    '/exercices/handlings': '../Modules/Exercices/Handlings/Handlings.html',
    
    '/journal': './Modules/Journal/Journal.html',
    '/planning': './Modules/Planning/Planning.html',
    '/login': './MainPage/UserAccount/UserLogin/UserLogin.html',
    '/register': './MainPage/UserAccount/UserRegister/UserRegister.html',
    '/emailVerifying': './MainPage/UserAccount/UserEmailVerify/UserEmailVerify.html',
    '/account': './MainPage/UserAccount/UserAccount.html'       
};

export async function loadPageContent(path) {
    let basePath = path;

    // 🔁 Fallback pour les sous-routes comme /exercices/entrys
    if (path.startsWith('/exercices/')) {
        basePath = '/exercices';
    }

    const pageUrl = routes[basePath] ?? null;


    if (!pageUrl && path === "/") {
        const res = await fetch(routes["/"]);
        const homeHtml = await res.text();
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = homeHtml;

        const homeContent = tempDiv.querySelector("#HomeContentArea") || homeHtml;
        document.querySelector("#MainPageSelectedMenu").innerHTML = typeof homeContent === "string"
            ? homeContent
            : homeContent.outerHTML;
        return;
    }

    if (pageUrl) {
        const res = await fetch(pageUrl);
        if (!res.ok) throw new Error("Fichier de contenu non trouvé");
        const html = await res.text();
        document.querySelector("#MainPageSelectedMenu").innerHTML = html;

        if (path.startsWith("/exercices")) {            
            setExercicesContentTabSelection();
        }

        if (path === "/register") {
            SetRegisterBehavior();
        }

        if (path === "/login") {
            setLoginBehavior()
        }

        if (path === "/emailVerifying") {
            SetEmailVerifyBehavior()
        }

        if (path === "/account") {
            loadUserAccountPage();
        }

        const registerLink = document.getElementById("UserRegisterLink");
        if (registerLink) {
            registerLink.addEventListener("click", (e) => {
                e.preventDefault();
                window.location.href = "/register";
            });
        }

        const loginLink = document.getElementById("UserLoginLink");
        if (loginLink) {
            loginLink.addEventListener("click", (e) => {
                e.preventDefault();
                window.location.href = "/login";
            });
        }
    } else {
        document.querySelector("#MainPageSelectedMenu").innerHTML = `<p>📛 Page introuvable</p>`;
    }
}







