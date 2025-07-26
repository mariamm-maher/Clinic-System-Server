const mongoose = require("mongoose");

const InvestigationSchema = new mongoose.Schema({
  labs: [String], // can be lab names or result URLs
  imaging: [String],
  biopsy: [String],
});

module.exports = mongoose.model("Investigation", InvestigationSchema);
