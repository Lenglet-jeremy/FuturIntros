// UserLogin.js


export function setLoginBehavior(){
    document.getElementById('LoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = e.target.elements[0].value;
    const password = e.target.elements[1].value;

    try {
        const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', data.email);
        window.location.href = '/'; // redirection vers la page principale
        } else {
        alert(data.error);
        }
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
    }
});
}