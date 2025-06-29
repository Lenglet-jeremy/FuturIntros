// Middlewares/AuthMiddlewares.js

const jwt = require('jsonwebtoken');
const User = require('../Models/User');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant ou invalide." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

    req.user = user; // ← injecte les infos dans req.user
    next();
  } catch (err) {
    console.error("Erreur d'authentification :", err);
    res.status(401).json({ error: "Token invalide." });
  }
};
