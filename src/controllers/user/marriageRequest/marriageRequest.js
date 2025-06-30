const mongoose = require("mongoose");
const moment = require("moment-timezone");
const AstrologerSchedule = require("../../../models/astrologerSchedule");
const User = require("../../../models/user");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const Astrologer = require("../../../models/asteroLogerSchema");
const MarriageTransaction = require("../../../models/marriageTransaction");
const MarriageRequest = require("../../../models/marriageRequest");
const MarriagePackage = require("../../../models/marriagePackage");

moment.tz.setDefault("Asia/Kolkata");

// Create a new consultation request
exports.createMarriageRequest = catchAsync(async (req, res, next) => {
  const {
    marriagePackage,
    astrologer,
    astrologerSchedule,
    marriageTransaction,
    type = "chat",
  } = req.body;
  const userId = req.user._id; // From protect middleware

  // Validate required fields
  if (
    !marriagePackage ||
    !astrologer ||
    !astrologerSchedule ||
    !marriageTransaction
  ) {
    return next(new AppError("All required fields must be provided", 400));
  }

  // Validate ObjectIDs
  if (
    !mongoose.isValidObjectId(marriagePackage) ||
    !mongoose.isValidObjectId(astrologer) ||
    !mongoose.isValidObjectId(astrologerSchedule) ||
    !mongoose.isValidObjectId(marriageTransaction)
  ) {
    return next(new AppError("Invalid ID format for one or more fields", 400));
  }

  // Validate user
  const userExists = await User.findById(userId);
  if (!userExists) {
    return next(new AppError("User not found", 404));
  }

  // Validate consultation package
  const packageExists = await MarriagePackage.findById(marriagePackage);
  if (!packageExists || !packageExists.status) {
    return next(
      new AppError("Consultation package not found or not active", 404)
    );
  }

  // Validate astrologer
  const astrologerExists = await Astrologer.findById(astrologer);
  if (!astrologerExists) {
    return next(new AppError("Astrologer not found", 404));
  }

  // Validate astrologer schedule
  const scheduleExists = await AstrologerSchedule.findById(astrologerSchedule);
  if (!scheduleExists || !scheduleExists.isAvailable) {
    return next(new AppError("Schedule not found or not available", 404));
  }
  if (
    scheduleExists.marriagePackage.toString() !== marriagePackage ||
    scheduleExists.astrologer.toString() !== astrologer
  ) {
    return next(
      new AppError("Schedule does not match package or astrologer", 400)
    );
  }

  // Validate consultation transaction
  const transactionExists = await MarriageTransaction.findById(
    marriageTransaction
  );
  if (
    !transactionExists ||
    transactionExists.user.toString() !== userId.toString()
  ) {
    return next(new AppError("Transaction not found or not authorized", 404));
  }
  if (
    transactionExists.marriagePackage.toString() !== marriagePackage ||
    transactionExists.astrologer.toString() !== astrologer ||
    transactionExists.status !== "pending"
  ) {
    return next(
      new AppError(
        "Transaction does not match package, astrologer, or is not pending",
        400
      )
    );
  }

  // Create consultation request
  const request = await MarriageRequest.create({
    user: userId,
    astrologer,
    astrologerSchedule,
    marriagePackage,
    marriageTransaction,
    status: "pending",
    type,
  });

  // Populate the request for response
  const populatedRequest = await MarriageRequest.findById(request._id)
    .populate("user", "name email")
    .populate("astrologer", "name")
    .populate("astrologerSchedule", "date startTime endTime")
    .populate("marriagePackage", "name duration sellPrice")
    .populate("marriageTransaction", "amount gstAmount duration expiryDate");

  res.status(201).json({
    status: true,
    message: "Consultation request created successfully",
    data: populatedRequest,
  });
});
