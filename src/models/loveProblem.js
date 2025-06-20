const mongoose = require("mongoose");

const loveProblemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  thumbImage:{
    type:String,
    required:true,
  },
  problem: {
    type: String,
    required: true,
  },
  solution: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
const LoveProblem = new mongoose.model("LoveProblem", loveProblemSchema);
module.exports = LoveProblem;
