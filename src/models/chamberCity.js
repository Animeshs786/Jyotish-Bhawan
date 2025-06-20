const mongoose = require("mongoose");

const chamberCitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
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

const ChamberCity = mongoose.model("ChamberCity", chamberCitySchema);
module.exports = ChamberCity;
