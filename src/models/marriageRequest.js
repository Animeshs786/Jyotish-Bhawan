const mongoose = require("mongoose");

const marriageRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  astrologer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Astrologer",
    required: true,
  },
  astrologerSchedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AstrologerSchedule",
    required: true,
  },
  marriagePackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MarriagePackage",
    required: true,
  },
  marriageTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MarriageTransaction",
    required: true,
  },
  type:{
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

const MarriageRequest = mongoose.model(
  "MarriageRequest",
  marriageRequestSchema
);

module.exports = MarriageRequest;
