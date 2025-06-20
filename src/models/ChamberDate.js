const mongoose = require("mongoose");

const chamberDateSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  chamberCity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChamberCity",
    required: true,
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
});
const ChamberDate = new mongoose.model("ChamberDate", chamberDateSchema);
module.exports = ChamberDate;
