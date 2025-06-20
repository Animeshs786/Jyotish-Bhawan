const mongoose = require("mongoose");

const bannerTransactionSchema = new mongoose.Schema({
  bookBanner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BookBanner",
    required: true,
  },
  shipping: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shipping",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  customerDetail: [
    {
      name: String,
      gender: {
        type: String,
        enum: ["male", "female", "other"],
      },
      dob: Date,
      birthTime: String,
      birthPlace: String,
      language: {
        type: String,
        enum: ["english", "hindi", "bangla"],
      },
    },
  ],
  amount: {
    type: Number,
    required: true,
  },
  format: {
    type: String,
    enum: ["handwritten", "printed"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
  deliverStatus: {
    type: String,
    enum: ["pending", "dispatch", "cancel", "complete"],
    default: "pending",
  },
  gstAmount: {
    type: Number,
    required: true,
  },
  finalAmount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const BannerTransaction = mongoose.model(
  "BannerTransaction",
  bannerTransactionSchema
);

module.exports = BannerTransaction;
