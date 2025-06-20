const mongoose = require("mongoose");

const ChamberTransaction = new mongoose.Schema({
  chamberPackageProduct: [
    {
      chamberPackage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChamberPackage",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      relation: {
        type: String,
        required: true,
      },
      gender: {
        type: String,
        enum: ["male", "female", "other"],
        required: true,
      },
      dob: {
        type: Date,
        required: true,
      },
      placeBirth: {
        type: String,
        required: true,
      },
      birthTime: {
        type: String,
        required: true,
      },
      language: {
        type: String,
        required: true,
      },
      expiredAt: {
        type: Date,
        required: true,
      },
      visitStatus: {
        type: Boolean,
        default: false,
      },
      visitDate: {
        type: Date,
      },
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true, // sum of chamber price
  },
  gstPrice: {
    type: Number,
    required: true, // 18 percent gst price on totalprice
  },
  finalPrice: {
    type: Number,
    required: true, // sum of chamber price + gst price
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  dueAmount: {
    type: Number,
    default: 0,
  },
  chamberCity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChamberCity",
    required: true,
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
const ChamberTransactionModel = mongoose.model(
  "ChamberTransaction",
  ChamberTransaction
);
module.exports = ChamberTransactionModel;
