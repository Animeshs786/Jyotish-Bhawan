const mongoose = require("mongoose");

const groupConsultScheduleSchema = new mongoose.Schema({
  consultationPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ConsultationPackage",
    required: true,
  },

  date: {
    type: Date,
    required: true,
  },
  cityName: {
    type: String,
    required: true, //city name where the consultation is scheduled
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

const GroupConsultSchedule = mongoose.model(
  "GroupConsultSchedule",
  groupConsultScheduleSchema
);

module.exports = GroupConsultSchedule;
