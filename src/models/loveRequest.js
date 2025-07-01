const mongoose = require("mongoose");

const loveRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  loveSchedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LoveSchedule",
    required: true,
  },
  loveTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LoveTransaction",
    required: true,
  },
  type: {
    type: String,
    enum: ["chat", "call", "video"],
    default: "chat",
  },
  startTime: {
    type: String,
    default: "",
  },
  endTime: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "booked", "rejected"],
    default: "pending",
  },
});

const LoveRequest = mongoose.model("LoveRequest", loveRequestSchema);

module.exports = LoveRequest;
