const mongoose = require("mongoose");
const ratingSchema = new mongoose.Schema({
  rating: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  astrologer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Astrologer",
  },
  review: {
    type: String,
    default: "",
  },
  isVerify: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Rating = new mongoose.model("Rating", ratingSchema);
module.exports = Rating;
