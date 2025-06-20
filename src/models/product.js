const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  shortName: {
    type: String,
    required: true,
  },
  thumbImage: {
    type: String,
    required: true,
  },
  images: [String],
  about: String,
  benefits: String,
  productCategory:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"ProductCategory",
    required:true
  },
  productVariant: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Product = mongoose.model("Product", productSchema);
module.exports = Product;
