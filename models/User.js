const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function () {
      return !this.google; // فقط مطلوب لو مش مستخدم Google
    },
  },
  google: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["admin", "doctor", "staff"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
