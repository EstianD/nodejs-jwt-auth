const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  profileName: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  imageName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Profile", profileSchema);
