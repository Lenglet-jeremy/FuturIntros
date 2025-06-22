require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const cors = require('cors');

const User = require('./Models/User');
const { sendVerificationCodeOnMail } = require('./Utils/Mailer.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, process.env.MONGO_OPTIONS)
.then(() => console.log("MongoDB connecté"))
.catch(err => console.error(err));

// Middleware
app.use(cors({ origin: true, credentials: true })); // CORS pour toutes origines
app.use(express.json()); // Parse les corps JSON
app.use(express.static(path.join(__dirname, '../Front'))); // Fichiers statiques

// Auth middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

// Inscription
app.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Utilisateur déjà existant' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const emailSent = await sendVerificationCodeOnMail({ email, code });

    if (!emailSent) {
      return res.status(500).json({ error: "Erreur lors de l'envoi de l'e-mail" });
    }

    const user = new User({
      name,
      email,
      password: hashedPassword,
      verificationCode: code,
      codeExpiration: expiration
    });

    await user.save();
    res.status(201).json({ message: 'Utilisateur enregistré. Vérifie ton e-mail.' });
  } catch (error) {
    console.error("Erreur d'inscription :", error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Vérification d'email
app.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email ou code manquant.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    if (user.isVerified) return res.status(400).json({ error: 'Adresse déjà vérifiée.' });

    if (user.verificationCode !== code || !user.codeExpiration || user.codeExpiration < new Date()) {
      return res.status(400).json({ error: 'Code invalide ou expiré.' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.codeExpiration = undefined;
    await user.save();

    res.json({ message: 'Adresse e-mail vérifiée avec succès.' });
  } catch (error) {
    console.error("Erreur de vérification :", error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Réenvoi du code
app.post('/resend-verification-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    if (user.isVerified) return res.status(400).json({ error: 'Adresse déjà vérifiée.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000);

    const emailSent = await sendVerificationCodeOnMail({ email, code });

    if (!emailSent) {
      return res.status(500).json({ error: "Erreur lors de l'envoi de l'e-mail." });
    }

    user.verificationCode = code;
    user.codeExpiration = expiration;
    await user.save();

    res.json({ message: 'Nouveau code envoyé.' });
  } catch (error) {
    console.error("Erreur de renvoi de code :", error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Connexion
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Utilisateur introuvable' });

    if (!user.isVerified) return res.status(401).json({ error: "Adresse e-mail non vérifiée." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, email: user.email });
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
});

// Infos utilisateur connecté
app.get('/api/me', authenticate, (req, res) => {
  res.json({ email: req.user.email, name: req.user.name });
});

// Fallback SPA (React, Vue, etc.)
app.get(/^\/(?!.*\.).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../Front/index.html'));
});

// Middleware global pour erreurs non gérées
app.use((err, req, res, next) => {
  console.error("Erreur non gérée :", err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
