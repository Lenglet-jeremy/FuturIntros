const mongoose = require("mongoose");

const NomenclatureSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  exerciseType: { type: String, required: true },
  nomenclatureName: { type: String, required: true },
  headers: [String],
  tranches: [[String]],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Nomenclature", NomenclatureSchema);
