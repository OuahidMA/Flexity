const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  primary_muscles: { type: [String], required: true },
  secondary_muscles: { type: [String], default: [] },
  category: { type: String, required: true },
});

module.exports = mongoose.model('Exercise', exerciseSchema);