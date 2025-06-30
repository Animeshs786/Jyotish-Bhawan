const mongoose = require("mongoose");

const marriagePackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  sellPrice: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    required: true, //value consider in minutes
  },
  thumbImage: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  packageExpiry: {
    type: Number,
    required: true, //value consider in days 3 means expire after 3 day from purchase
  },
  about: String,
  feacture: [String],
  status: {
    type: Boolean,
    default: true,
  },
  rechargeAmount: {
    type: Number,
  },
  isGroup: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const MarriagePackage = mongoose.model(
  "MarriagePackage",
  marriagePackageSchema
);
module.exports = MarriagePackage;
