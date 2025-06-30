const mongoose = require("mongoose");

const marriagePackageAstrologerSchema = new mongoose.Schema({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MarriagePackageAstrologer = mongoose.model(
  "MarriagePackageAstrologer",
  marriagePackageAstrologerSchema
);
module.exports = MarriagePackageAstrologer;
