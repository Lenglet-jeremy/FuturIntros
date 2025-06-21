// UserRegister.js

function isPasswordStrong(password) {
    // Exige au moins : 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return strongPasswordRegex.test(password);
}

// UserRegister.js
function checkPasswordStrength(password) {
    const requirementsDiv = document.getElementById("password-requirements");

    // 1. Vérification des règles
    const rules = {
        length:    password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number:    /[0-9]/.test(password),
        special:   /[\W_]/.test(password),
    };

    // 2. Affiche / cache chaque ligne selon la règle
    document.getElementById("req-length").style.display    = rules.length    ? "none" : "block";
    document.getElementById("req-uppercase").style.display = rules.uppercase ? "none" : "block";
    document.getElementById("req-lowercase").style.display = rules.lowercase ? "none" : "block";
    document.getElementById("req-number").style.display    = rules.number    ? "none" : "block";
    document.getElementById("req-special").style.display   = rules.special   ? "none" : "block";

    // 3. Si tout est OK on masque le bloc, sinon on l’affiche
    const allValid = Object.values(rules).every(Boolean);
    requirementsDiv.style.display = allValid ? "none"  : "flex";
    requirementsDiv.style.opacity = allValid ? "0"     : "1";
}





function onSubmit() {
  const registerForm = document.getElementById("RegisterForm");

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const inputs = registerForm.querySelectorAll("input");
    const [fullName, email, password, confirmPassword] = [...inputs].map(i => i.value.trim());

    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!isPasswordStrong(password)) {
      alert("Mot de passe trop faible.");
      return;
    }

    try {
      const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur à l'inscription");

      sessionStorage.setItem("pendingEmail", email);

      alert("Inscription réussie, vérifie ta boîte mail !");
      window.location.href = "/emailVerifying";
    } catch (err) {
      alert(err.message);
    }
  });
}


export function SetRegisterBehavior() {
    onSubmit();

    const passwordInput = document.getElementById("password");

    // Affiche le bloc dès que l’utilisateur commence à taper
    passwordInput.addEventListener("input", e => checkPasswordStrength(e.target.value));

    // (optionnel) Masquer de nouveau le bloc quand le champ perd le focus
    passwordInput.addEventListener("blur", () => {
        const reqDiv = document.getElementById("password-requirements");
        if (reqDiv.style.display !== "none") {
            reqDiv.style.opacity = "0.2"; // léger fade – à adapter
        }
    });

    
    // → Ajout pour préremplir le champ nom complet si l'utilisateur est connecté
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.name) {
          const nameInput = document.getElementById("RegisterFullNameInput");
          if (nameInput) nameInput.value = data.name;
        }
      })
      .catch(err => console.warn("Impossible de préremplir le nom :", err));
    }
}



