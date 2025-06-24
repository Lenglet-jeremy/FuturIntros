// Server.js

require('dotenv').config();
const app = require('./App.js');
const connectDB = require('./Config/Db.js');

const PORT = process.env.PORT || 3000;

connectDB();

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
