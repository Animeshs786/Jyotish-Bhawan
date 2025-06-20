const mongoose = require("mongoose");

const packageAstrologerSchema = new mongoose.Schema({
  consultationPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ConsultationPackage",
    required: true,
  },
  astrologer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Astrologer",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PackageAstrologer = mongoose.model(
  "PackageAstrologer",
  packageAstrologerSchema
);
module.exports = PackageAstrologer;
