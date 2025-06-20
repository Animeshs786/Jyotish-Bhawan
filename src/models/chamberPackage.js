const mongoose = require("mongoose");
const ChamberCity = require("./chamberCity");

const chamberPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  chamberCity:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: ChamberCity
  }],
  facture: [String],
  duration: {
    type: Number, // in days 30 means 1 month
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const ChamberPackage = mongoose.model("ChamberPackage", chamberPackageSchema);
module.exports = ChamberPackage;
