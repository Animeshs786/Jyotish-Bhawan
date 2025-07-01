const mongoose = require("mongoose");

const loveScheduleSchema = new mongoose.Schema({
  lovePackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LovePackage",
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const LoveSchedule = mongoose.model("LoveSchedule", loveScheduleSchema);

module.exports = LoveSchedule;
