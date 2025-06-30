const mongoose = require("mongoose");
const marriageTransactionSchema = new mongoose.Schema({
  marriagePackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MarriagePackage",
    required: true,
  },
  astrologer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Astrologer",
    required: true,
  },
  boyDetail: [
    {
      name: String,
      dob: Date,
      birthTime: String,
      birthPlace: String,
      language: {
        type: String,
        enum: ["english", "hindi", "bangla"],
      },
    },
  ],
  girlDetail: [
    {
      name: String,
      dob: Date,
      birthTime: String,
      birthPlace: String,
      language: {
        type: String,
        enum: ["english", "hindi", "bangla"],
      },
    },
  ],
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

const MarriageTransaction = mongoose.model(
  "MarriageTransaction",
  marriageTransactionSchema
);
module.exports = MarriageTransaction;
