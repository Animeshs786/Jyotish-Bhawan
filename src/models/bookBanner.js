const mongoose = require("mongoose");

const bookBannerSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
  },
  sellPrice: {
    type: Number,
  },
  type: {
    type: String,
    enum: ["kundli", "lalKitab"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const BookBanner = mongoose.model("BookBanner", bookBannerSchema);
module.exports = BookBanner;
