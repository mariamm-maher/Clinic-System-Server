const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
  generalInfo: {
    name: { type: String, required: true },
    age: { type: Number },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female"], required: true },
    phone: { type: String, required: true },
    address: { type: String },
  },
  personalInfo: {
    occupation: { type: String },
    maritalStatus: {
      type: String,
      enum: ["single", "married", "divorced", "widowed"],
    },
    children: { type: Number, default: 0 },
    habits: [{ type: String }],
    other: { type: String },
  },
  visits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Visit" }],
  //date
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Patient", PatientSchema);
