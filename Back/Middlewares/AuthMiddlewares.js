const jwt = require('jsonwebtoken');
const User = require('../Models/User.js');

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

module.exports = authenticate;
