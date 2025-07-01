const moment = require("moment-timezone");
const mongoose = require("mongoose");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const LovePackage = require("../../../models/lovePackage");
const LoveTransaction = require("../../../models/loveTransaction");
moment.tz.setDefault("Asia/Kolkata");

exports.getAllLovePackages = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  let query = { status: true };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { about: { $regex: search, $options: "i" } },
    ];
  }

  const LovePackages = await LovePackage.find(query).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: true,
    message: "Consultation packages fetched successfully",
    data: LovePackages,
  });
});

exports.getLovePackage = catchAsync(async (req, res, next) => {
  const lovePackage = await LovePackage.findById(req.params.id);

  if (!lovePackage) {
    return next(new AppError("Consultation package not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Consultation package fetched successfully",
    data: lovePackage,
  });
});

// Check user's subscription status for a consultation package
exports.checkLoveSubscription = catchAsync(async (req, res, next) => {
  const { lovePackage } = req.body;
  const userId = req.user._id; // From protect middleware

  // Validate required fields
  if (!lovePackage) {
    return next(new AppError("Consultation package ID is required", 400));
  }

  // Validate ObjectID
  if (!mongoose.isValidObjectId(lovePackage)) {
    return next(new AppError("Invalid consultation package ID", 400));
  }

  // Validate consultation package
  const packageExists = await LovePackage.findById(lovePackage);
  if (!packageExists || !packageExists.status) {
    return next(
      new AppError("Consultation package not found or not active", 404)
    );
  }

  // Check for active subscriptions
  const now = moment().tz("Asia/Kolkata").toDate();
  const transactions = await LoveTransaction.find({
    user: userId,
    LovePackage,
    status: { $in: ["pending", "completed"] },
    expiryDate: { $gt: now },
  })
    .populate("LovePackage", "name duration sellPrice")
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
