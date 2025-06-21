/* UserEmailVerify.css */

export function SetEmailVerifyBehavior() {
  const email = sessionStorage.getItem("pendingEmail");
  if (!email) {             // Pas d'e‑mail stocké → on renvoie à la connexion
    window.location.href = "/UserLogin.html"; return;
  }

  // Soumission du code
  document.getElementById("EmailVerificationForm")
          .addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = document.getElementById("verificationCode").value.trim();

    if (!/^[0-9]{6}$/.test(code)) {
      alert("Code à 6 chiffres requis."); return;
    }

    try {
      const res = await fetch("/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Code invalide");

      alert("Adresse confirmée ! Vous pouvez vous connecter.");
      sessionStorage.removeItem("pendingEmail");
      window.location.href = "/login";
    } catch (err) {
      alert(err.message);
    }
  });

  // Renvoi du code
  document.getElementById("resendCodeLink")
          .addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/resend-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'envoi");
      alert("Nouveau code envoyé, pense à vérifier tes spams.");
    } catch (err) {
      alert(err.message);
    }
  });
}