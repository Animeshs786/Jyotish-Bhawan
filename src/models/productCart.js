const mongoose = require("mongoose");

const productCartSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  productVariant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  memberDetail: [
    {
      name: String,
      gender: {
        type: String,
        enum: ["male", "female", "other"],
      },
      motherName: {
        type: String,
        defautl: "",
      },
      fatherName: {
        type: String,
        defautl: "",
      },
      husbandName: {
        type: String,
        defautl: "",
      },
      gotra: {
        type: String,
        defautl: "",
      },
      problemDetail: {
        type: String,
        defautl: "",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ProductCart = mongoose.model("ProductCart", productCartSchema);
module.exports = ProductCart;
