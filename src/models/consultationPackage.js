const mongoose = require("mongoose");
const { image } = require("pdfkit");

const consultationPackageSchema = new mongoose.Schema({
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
  rechargeAmount:{
    type:Number
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ConsultationPackage = mongoose.model(
  "ConsultationPackage",
  consultationPackageSchema
);
module.exports = ConsultationPackage;
