const mongoose = require("mongoose");

const consultationRequestSchema = new mongoose.Schema({
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
  consultationPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ConsultationPackage",
    required: true,
  },
  consoutationTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ConsultationTransaction",
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

const ConsultationRequest = mongoose.model(
  "ConsultationRequest",
  consultationRequestSchema
);

module.exports = ConsultationRequest;
