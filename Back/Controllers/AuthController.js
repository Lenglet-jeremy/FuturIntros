// AuthController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../Models/User.js');
const { sendVerificationCodeOnMail } = require('../Utils/Mailer.js');

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Utilisateur déjà existant' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000);

    const emailSent = await sendVerificationCodeOnMail({ email, code });
    if (!emailSent) return res.status(500).json({ error: "Erreur lors de l'envoi de l'e-mail" });

    const user = new User({ name, email, password: hashedPassword, verificationCode: code, codeExpiration: expiration });
    await user.save();

    res.status(201).json({ message: 'Utilisateur enregistré. Vérifie ton e-mail.' });
  } catch (error) {
    console.error("Erreur d'inscription :", error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    if (user.isVerified) return res.status(400).json({ error: 'Adresse déjà vérifiée.' });

    const now = new Date();
    if (user.verificationCode !== code || user.codeExpiration < now) {
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
};

exports.resendCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    if (user.isVerified) return res.status(400).json({ error: 'Adresse déjà vérifiée.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000);
    const emailSent = await sendVerificationCodeOnMail({ email, code });

    if (!emailSent) return res.status(500).json({ error: "Erreur lors de l'envoi de l'e-mail." });

    user.verificationCode = code;
    user.codeExpiration = expiration;
    await user.save();

    res.json({ message: 'Nouveau code envoyé.' });
  } catch (error) {
    console.error("Erreur de renvoi de code :", error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: 'Utilisateur introuvable' });
    if (!user.isVerified) return res.status(401).json({ error: "Adresse e-mail non vérifiée." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, email: user.email });
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
};

exports.getMe = (req, res) => {
  res.json({ email: req.user.email, name: req.user.name });
};
