const mongoose = require("mongoose");
const moment = require("moment-timezone");
const ConsultationRequest = require("../../../models/consultationRequest");
const ConsultationPackage = require("../../../models/consultationPackage");
const ConsultationTransaction = require("../../../models/consultationTransaction");
const AstrologerSchedule = require("../../../models/astrologerSchedule");
const User = require("../../../models/user");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const Astrologer = require("../../../models/asteroLogerSchema");

moment.tz.setDefault("Asia/Kolkata");

// Create a new consultation request
exports.createConsultationRequest = catchAsync(async (req, res, next) => {
  const {
    consultationPackage,
    astrologer,
    astrologerSchedule,
    consoutationTransaction,
    type = "chat",//call,video,chat
  } = req.body;
  const userId = req.user._id; // From protect middleware

  // Validate required fields
  if (
    !consultationPackage ||
    !astrologer ||
    !astrologerSchedule ||
    !consoutationTransaction
  ) {
    return next(new AppError("All required fields must be provided", 400));
  }

  // Validate ObjectIDs
  if (
    !mongoose.isValidObjectId(consultationPackage) ||
    !mongoose.isValidObjectId(astrologer) ||
    !mongoose.isValidObjectId(astrologerSchedule) ||
    !mongoose.isValidObjectId(consoutationTransaction)
  ) {
    return next(new AppError("Invalid ID format for one or more fields", 400));
  }

  // Validate user
  const userExists = await User.findById(userId);
  if (!userExists) {
    return next(new AppError("User not found", 404));
  }

  // Validate consultation package
  const packageExists = await ConsultationPackage.findById(consultationPackage);
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
    scheduleExists.consultationPackage.toString() !== consultationPackage ||
    scheduleExists.astrologer.toString() !== astrologer
  ) {
    return next(
      new AppError("Schedule does not match package or astrologer", 400)
    );
  }

  // Validate consultation transaction
  const transactionExists = await ConsultationTransaction.findById(
    consoutationTransaction
  );
  if (
    !transactionExists ||
    transactionExists.user.toString() !== userId.toString()
  ) {
    return next(new AppError("Transaction not found or not authorized", 404));
  }
  if (
    transactionExists.consultationPackage.toString() !== consultationPackage ||
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
  const request = await ConsultationRequest.create({
    user: userId,
    astrologer,
    astrologerSchedule,
    consultationPackage,
    consoutationTransaction,
    status: "pending",
    type,
  });

  // Populate the request for response
  const populatedRequest = await ConsultationRequest.findById(request._id)
    .populate("user", "name email")
    .populate("astrologer", "name")
    .populate("astrologerSchedule", "date startTime endTime")
    .populate("consultationPackage", "name duration sellPrice")
    .populate(
      "consoutationTransaction",
      "amount gstAmount duration expiryDate"
    );

  res.status(201).json({
    status: true,
    message: "Consultation request created successfully",
    data: populatedRequest,
  });
});
