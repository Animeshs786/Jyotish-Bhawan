const mongoose = require("mongoose");
const moment = require("moment-timezone");
const LoveRequest = require("../../../models/loveRequest");
const LoveSchedule = require("../../../models/loveSchedule");
const LoveTransaction = require("../../../models/loveTransaction");
const User = require("../../../models/user");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");

moment.tz.setDefault("Asia/Kolkata");

// Validate time format (HH:mm)
const validateTimeFormat = (time) => {
  if (!time) return true; // Allow empty string as per schema default
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Validate endTime is after startTime
const isEndTimeAfterStartTime = (startTime, endTime, date) => {
  if (!startTime || !endTime) return true; // Allow empty strings
  const start = moment.tz(
    `${date.toISOString().split("T")[0]} ${startTime}`,
    "YYYY-MM-DD HH:mm",
    "Asia/Kolkata"
  );
  const end = moment.tz(
    `${date.toISOString().split("T")[0]} ${endTime}`,
    "YYYY-MM-DD HH:mm",
    "Asia/Kolkata"
  );
  return end.isAfter(start);
};

// Create a new love request
exports.createLoveRequest = catchAsync(async (req, res, next) => {
  const {
    loveSchedule,
    loveTransaction,
    type = "chat",
    startTime = "",
    endTime = "",
  } = req.body;
  const userId = req.user._id; // From protect middleware

  // Validate required fields
  if (!loveSchedule || !loveTransaction) {
    return next(
      new AppError("loveSchedule and loveTransaction are required", 400)
    );
  }

  // Validate ObjectIDs
  if (
    !mongoose.isValidObjectId(loveSchedule) ||
    !mongoose.isValidObjectId(loveTransaction)
  ) {
    return next(
      new AppError("Invalid ID format for loveSchedule or loveTransaction", 400)
    );
  }

  // Validate type
  if (!["chat", "call", "video"].includes(type)) {
    return next(new AppError("Invalid type value", 400));
  }

  // Validate time formats if provided
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    return next(
      new AppError(
        "startTime and endTime must be in HH:mm format (e.g., 14:30) or empty",
        400
      )
    );
  }

  // Validate user
  const userExists = await User.findById(userId);
  if (!userExists) {
    return next(new AppError("User not found", 404));
  }

  // Validate love schedule
  const scheduleExists = await LoveSchedule.findById(loveSchedule);
  if (!scheduleExists || !scheduleExists.isAvailable) {
    return next(new AppError("Schedule not found or not available", 404));
  }

  // Validate love transaction
  const transactionExists = await LoveTransaction.findById(loveTransaction);
  if (
    !transactionExists ||
    transactionExists.user.toString() !== userId.toString()
  ) {
    return next(new AppError("Transaction not found or not authorized", 404));
  }
  if (transactionExists.status !== "pending") {
    return next(new AppError("Transaction is not in pending status", 400));
  }

  // Validate schedule and transaction compatibility
  if (
    scheduleExists.lovePackage.toString() !==
    transactionExists.lovePackage.toString()
  ) {
    return next(
      new AppError(
        "Schedule and transaction must reference the same love package",
        400
      )
    );
  }

  // Validate endTime is after startTime if both are provided
  if (startTime && endTime) {
    if (!isEndTimeAfterStartTime(startTime, endTime, scheduleExists.date)) {
      return next(new AppError("endTime must be after startTime", 400));
    }
  }

  // Create love request
  const request = await LoveRequest.create({
    user: userId,
    loveSchedule,
    loveTransaction,
    type,
    startTime,
    endTime,
    status: "pending",
  });

  // Populate the request for response
  const populatedRequest = await LoveRequest.findById(request._id)
    .populate("user", "name email")
    .populate("loveSchedule", "date startTime endTime")
    .populate("loveTransaction", "amount gstAmount duration expiryDate")
    .populate("loveTransaction.lovePackage", "name duration sellPrice");

  res.status(201).json({
    status: true,
    message: "Love request created successfully",
    data: populatedRequest,
  });
});
