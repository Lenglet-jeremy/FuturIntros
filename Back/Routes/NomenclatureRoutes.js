const express = require("express");
const router = express.Router();
const Nomenclature = require("../Models/Nomenclature");

// GET - liste des nomenclatures d’un utilisateur
router.get("/", async (req, res) => {
  const { email } = req.query;
  try {
    const data = await Nomenclature.find({ userEmail: email }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des données." });
  }
});

// POST - sauvegarde d’une nouvelle nomenclature
router.post("/", async (req, res) => {
  const { userName, userEmail, exerciseType, nomenclatureName, headers, tranches } = req.body;
  try {
    const newNom = new Nomenclature({ userName, userEmail, exerciseType, nomenclatureName, headers, tranches });
    await newNom.save();
    res.status(201).json({ message: "Nomenclature sauvegardée avec succès." });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la sauvegarde." });
  }
});

// DELETE - suppression d’une nomenclature par ID
router.delete("/:id", async (req, res) => {
  try {
    await Nomenclature.findByIdAndDelete(req.params.id);
    res.json({ message: "Supprimée avec succès." });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});


// PUT /api/nomenclatures/:id
router.put('/:id', async (req, res) => {
  const nomenclatureId = req.params.id;
  const updatedData = req.body;

  try {
    // Trouver la nomenclature par son _id et la mettre à jour avec les données reçues
    const updatedNomenclature = await Nomenclature.findByIdAndUpdate(
      nomenclatureId,
      updatedData,
      { new: true, runValidators: true } // new: renvoie l'objet mis à jour, runValidators: valide les données
    );

    if (!updatedNomenclature) {
      return res.status(404).json({ error: 'Nomenclature non trouvée' });
    }

    res.json(updatedNomenclature);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la nomenclature' });
  }
});

module.exports = router;
