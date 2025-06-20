const mongoose = require("mongoose");

const giftCardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    required: true,
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const GiftCard = mongoose.model("GiftCard", giftCardSchema);
module.exports = GiftCard;
