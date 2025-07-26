const mongoose = require("mongoose");
const { Schema } = mongoose;

const BookingSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: false,
    },
    patientName: {
      type: String,
      required: true,
    },
    patientPhone: {
      type: String,
      required: true,
    },
    day: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    // مصدر الحجز
    createdFrom: {
      type: String,
      enum: ["clinic", "phone", "website"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "canceled", "done"],
      default: "pending",
    },
    notes: {
      type: String,
    },
    // مين اللي أنشأ الحجز (سكرتير مثلاً)
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // أو "Staff"
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", BookingSchema);
