const mongoose = require("mongoose");

const ProductTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productData: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      productVariant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariant",
        required: true,
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
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
  },
  gstPrice: {
    type: Number,
    required: true,
  },
  finalPrice: {
    type: Number,
    required: true,
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  dueAmount: {
    type: Number,
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  couponCode: {
    type: String,
    default: "",
  },
  deliveryPrice: {
    type: Number,
    default: 0,
  },
  shipping:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Shipping",
    required:true,
  },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
const ProductTransaction = mongoose.model(
  "ProductTransaction",
  ProductTransactionSchema
);
module.exports = ProductTransaction;

