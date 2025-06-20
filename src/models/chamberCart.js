const mongoose = require("mongoose");

const chamberCart = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
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
    },
  ],
});
const ChamberCart = mongoose.model("ChamberCart", chamberCart);
module.exports = ChamberCart;
