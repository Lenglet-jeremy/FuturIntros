// UserAccount.js

export async function loadUserAccountPage() {
  const token = localStorage.getItem("token");
  if (!token) {
    // pas connecté => on renvoie vers /login
    history.pushState(null, null, "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
    return;
  }

  try {
    const res = await fetch("/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    const nameSpan  = document.getElementById("UserAccountName");
    const emailSpan = document.getElementById("UserAccountEmail");

    if (res.ok) {
      if (nameSpan)  nameSpan.textContent  = data.name ?? "Non renseigné";
      if (emailSpan) emailSpan.textContent = data.email;
    } else {
      document.getElementById("UserAccountContainer").innerHTML =
        `<p>Erreur : ${data.error}</p>`;
    }
  } catch (err) {
    console.error(err);
    document.getElementById("UserAccountContainer").innerHTML =
      "<p>Erreur lors du chargement de la page utilisateur.</p>";
  }
}






