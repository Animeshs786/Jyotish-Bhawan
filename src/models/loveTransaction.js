const mongoose = require("mongoose");
const loveTransactionSchema = new mongoose.Schema({
  lovePackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LovePackage",
    required: true,
  },
  loveMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LoveMember",
    required: true, //member who is booking the consultation
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, //user who is booking the consultation
  },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },
  duration: {
    type: Number,
    required: true, //value consider in minutes //defaut duraton
  },
  expiryDate: {
    type: Date,
    required: true, //date when the consultation package will expire
  },
  amount: {
    type: Number,
    required: true, //total amount for the consultation
  },
  gstAmount: {
    type: Number,
    required: true, //GST amount applied on the consultation
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const LoveTransaction = mongoose.model(
  "LoveTransaction",
  loveTransactionSchema
);
module.exports = LoveTransaction;
