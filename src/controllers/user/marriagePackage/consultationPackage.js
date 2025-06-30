const moment = require("moment-timezone");
const mongoose = require("mongoose");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const MarriagePackage = require("../../../models/marriagePackage");
const MarriageTransaction = require("../../../models/marriageTransaction");
moment.tz.setDefault("Asia/Kolkata");

exports.getAllMarriagePackages = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  let query = { status: true };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { about: { $regex: search, $options: "i" } },
    ];
  }

  const MarriagePackages = await MarriagePackage.find(query).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: true,
    message: "Consultation packages fetched successfully",
    data: MarriagePackages,
  });
});

exports.getMarriagePackage = catchAsync(async (req, res, next) => {
  const MarriagePackage = await MarriagePackage.findById(req.params.id);

  if (!MarriagePackage) {
    return next(new AppError("Consultation package not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Consultation package fetched successfully",
    data: MarriagePackage,
  });
});

// Check user's subscription status for a consultation package
exports.checkMarriageSubscription = catchAsync(async (req, res, next) => {
  const { MarriagePackage } = req.body;
  const userId = req.user._id; // From protect middleware

  // Validate required fields
  if (!MarriagePackage) {
    return next(new AppError("Consultation package ID is required", 400));
  }

  // Validate ObjectID
  if (!mongoose.isValidObjectId(MarriagePackage)) {
    return next(new AppError("Invalid consultation package ID", 400));
  }

  // Validate consultation package
  const packageExists = await MarriagePackage.findById(MarriagePackage);
  if (!packageExists || !packageExists.status) {
    return next(
      new AppError("Consultation package not found or not active", 404)
    );
  }

  // Check for active subscriptions
  const now = moment().tz("Asia/Kolkata").toDate();
  const transactions = await MarriageTransaction.find({
    user: userId,
    MarriagePackage,
    status: { $in: ["pending", "completed"] },
    expiryDate: { $gt: now },
  })
    .populate("MarriagePackage", "name duration sellPrice")
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
