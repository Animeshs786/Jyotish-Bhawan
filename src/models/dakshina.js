const mongoose = require("mongoose");

const dakshinaScheama = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: String,
  gotra: String,
  number: String,
  detail: {
    type: String,
    required: true,
  },
  amount: Number,
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Dakshina = mongoose.model("Dakshina", dakshinaScheama);
module.exports = Dakshina;
