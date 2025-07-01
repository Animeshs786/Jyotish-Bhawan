const mongoose = require("mongoose");
const loveMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lovePackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LovePackage",
    required: true,
  },
  yourName: {
    type: String,
    required: true,
  },
  partnerName: {
    type: String,
    required: true,
  },
  yourImage: {
    type: String,
    required: true,
  },
  partnerImage: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true, // Active by default
  },
});
const LoveMember = mongoose.model("LoveMember", loveMemberSchema);
module.exports = LoveMember;
