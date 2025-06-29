// App.js

const express = require('express');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');


const authRoutes = require('./Routes/AuthRoutes.js');
const nomenclatureRoutes = require("./Routes/NomenclatureRoutes.js");
const authenticate = require('./Middlewares/AuthMiddlewares.js');

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"; // ⚠️ change ça en prod

const app = express();

// Middlewares globaux
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../Front')));
app.use("/api/nomenclatures", nomenclatureRoutes);

// Routes
app.use('/', authRoutes);

// Exemple avec Express et JWT
app.use('/api/current-user', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Non autorisé' });

  const token = auth.split(' ')[1];
  // Vérifier le token ici
  const user = decodeToken(token); // exemple

  if (!user) return res.status(401).json({ error: 'Token invalide' });

  res.json({ name: user.name, email: user.email });
});
// Fallback SPA
app.get(/^\/(?!.*\.).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../Front/index.html'));
});



// Middleware global erreurs non gérées
app.use((err, req, res, next) => {
  console.error("Erreur non gérée :", err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

module.exports = app;

function decodeToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET); // renvoie le payload décodé
  } catch (err) {
    return null;
  }
}



