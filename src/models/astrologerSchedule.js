const mongoose = require("mongoose");

const astrologerScheduleSchema = new mongoose.Schema({
  consultationPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ConsultationPackage",
  },
  marriagePackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MarriagePackage",
  },
  astrologer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Astrologer",
    required: true,
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

const AstrologerSchedule = mongoose.model(
  "AstrologerSchedule",
  astrologerScheduleSchema
);

module.exports = AstrologerSchedule;
