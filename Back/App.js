const express = require('express');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./Routes/AuthRoutes.js');

const app = express();

// Middlewares globaux
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../Front')));

// Routes
app.use('/', authRoutes);

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
