const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  sellPrice: Number,
  duration:Number,
  mantra:Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);
module.exports = ProductVariant;
