// server.js

const User = require('./Models/User');


const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');

const { sendVerificationCodeOnMail } = require('./Utils/Mailer.js');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token invalide' });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    req.user = user;
    next();
  });
};

require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

mongoose.connect(process.env.MONGO_URI, process.env.MONGO_OPTIONS)
.then(() => console.log("MongoDB connecté"))
.catch(err => console.error(err));


app.use(express.json());

// Sert les fichiers statiques comme script.js et style.css
app.use(express.static(path.join(__dirname, '../Front')));

app.listen(PORT, () => 
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
);


// Inscription
app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: 'Utilisateur déjà existant' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // code 6 chiffres
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
});

app.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) return res.status(400).json({ error: 'Email ou code manquant.' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

  if (user.isVerified) return res.status(400).json({ error: 'Adresse déjà vérifiée.' });

  if (
    user.verificationCode !== code ||
    !user.codeExpiration ||
    user.codeExpiration < new Date()
  ) {
    return res.status(400).json({ error: 'Code invalide ou expiré.' });
  }

  user.isVerified = true;
  user.verificationCode = undefined;
  user.codeExpiration = undefined;
  await user.save();

  res.json({ message: 'Adresse e-mail vérifiée avec succès.' });
});

app.post('/resend-verification-code', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email requis.' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

  if (user.isVerified) return res.status(400).json({ error: 'Adresse déjà vérifiée.' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  const emailSent = await sendVerificationCodeOnMail({ email, code });

  if (!emailSent) {
    return res.status(500).json({ error: "Erreur lors de l'envoi de l'e-mail." });
  }

  user.verificationCode = code;
  user.codeExpiration = expiration;
  await user.save();

  res.json({ message: 'Nouveau code envoyé.' });
});

// Connexion
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Utilisateur introuvable' });

  if (!user.isVerified) return res.status(401).json({ error: "Adresse e-mail non vérifiée." });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, email: user.email });
});

app.get('/api/me', authenticate, (req, res) => {
  res.json({ email: req.user.email, name: req.user.name });
});

// Fallback pour les routes SPA (sans extension)
// Toujours en Dernier 
app.get(/^\/(?!.*\.).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '../Front/index.html'));
});