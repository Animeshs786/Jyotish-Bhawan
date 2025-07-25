const moment = require("moment-timezone");
const mongoose = require("mongoose");
const ConsultationPackage = require("../../../models/consultationPackage");
const ConsultationTransaction = require("../../../models/consultationTransaction");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
moment.tz.setDefault("Asia/Kolkata");

exports.getAllConsultationPackages = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  let query = { status: true };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { about: { $regex: search, $options: "i" } },
    ];
  }

  const consultationPackages = await ConsultationPackage.find(query).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: true,
    message: "Consultation packages fetched successfully",
    data: consultationPackages,
  });
});

exports.getConsultationPackage = catchAsync(async (req, res, next) => {
  const consultationPackage = await ConsultationPackage.findById(req.params.id);

  if (!consultationPackage) {
    return next(new AppError("Consultation package not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Consultation package fetched successfully",
    data: consultationPackage,
  });
});

// Check user's subscription status for a consultation package
exports.checkConsultationSubscription = catchAsync(async (req, res, next) => {
  const { consultationPackage } = req.body;
  const userId = req.user._id; // From protect middleware

  // Validate required fields
  if (!consultationPackage) {
    return next(new AppError("Consultation package ID is required", 400));
  }

  // Validate ObjectID
  if (!mongoose.isValidObjectId(consultationPackage)) {
    return next(new AppError("Invalid consultation package ID", 400));
  }

  // Validate consultation package
  const packageExists = await ConsultationPackage.findById(consultationPackage);
  if (!packageExists || !packageExists.status) {
    return next(
      new AppError("Consultation package not found or not active", 404)
    );
  }

  // Check for active subscriptions
  const now = moment().tz("Asia/Kolkata").toDate();
  const transactions = await ConsultationTransaction.find({
    user: userId,
    consultationPackage,
    status: { $in: ["pending", "completed"] },
    expiryDate: { $gt: now },
  })
    .populate("consultationPackage", "name duration sellPrice")
    .populate("astrologer", "name")
    .populate("user", "name email");

  const isSubscribed = transactions.length > 0;

  res.status(200).json({
    status: true,
    message: isSubscribed
      ? "Active subscription found"
      : "No active subscription found",
    isSubscribed,
    data: isSubscribed ? transactions : [],
  });
});
