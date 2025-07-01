const mongoose = require("mongoose");
const moment = require("moment-timezone");
const LoveTransaction = require("../../../models/loveTransaction");
const LovePackage = require("../../../models/lovePackage");
const LoveMember = require("../../../models/loveMember");
const User = require("../../../models/user");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const pagination = require("../../../utils/pagination");

moment.tz.setDefault("Asia/Kolkata");

// Create a new love transaction
exports.createLoveTransaction = catchAsync(async (req, res, next) => {
  const { lovePackage, loveMember, amount, gstAmount } = req.body;
  const userId = req.user._id; // From protect middleware

  // Validate required fields
  if (!lovePackage) {
    return next(new AppError("Love package ID is required", 400));
  }
  if (!loveMember) {
    return next(new AppError("Love member ID is required", 400));
  }
  if (amount === undefined || amount < 0) {
    return next(new AppError("Valid amount is required", 400));
  }
  if (gstAmount === undefined || gstAmount < 0) {
    return next(new AppError("Valid GST amount is required", 400));
  }

  // Validate ObjectIDs
  if (
    !mongoose.isValidObjectId(lovePackage) ||
    !mongoose.isValidObjectId(loveMember)
  ) {
    return next(new AppError("Invalid love package or love member ID", 400));
  }

  // Validate user
  const userExists = await User.findById(userId);
  if (!userExists) {
    return next(new AppError("User not found", 404));
  }

  // Validate love package
  const packageExists = await LovePackage.findById(lovePackage);
  if (!packageExists) {
    return next(new AppError("Love package not found", 404));
  }
  if (!packageExists.status) {
    return next(new AppError("Love package is not active", 400));
  }

  // Validate love member
  const memberExists = await LoveMember.findById(loveMember);
  if (!memberExists) {
    return next(new AppError("Love member not found", 404));
  }
  if (!memberExists.status) {
    return next(new AppError("Love member is not active", 400));
  }
  if (memberExists.user.toString() !== userId.toString()) {
    return next(new AppError("Love member does not belong to this user", 403));
  }

  // Calculate expiry date based on packageExpiry (in days)
  const expiryDate = moment()
    .tz("Asia/Kolkata")
    .add(packageExists.packageExpiry, "days")
    .toDate();

  // Create love transaction
  const transaction = await LoveTransaction.create({
    lovePackage,
    loveMember,
    user: userId,
    status: "pending",
    duration: packageExists.duration, // Set duration from package
    expiryDate, // Set calculated expiry date
    amount,
    gstAmount,
    createdAt: Date.now(),
  });

  // Populate the transaction for response
  const populatedTransaction = await LoveTransaction.findById(transaction._id)
    .populate("lovePackage", "name duration sellPrice")
    .populate("loveMember", "yourName partnerName")
    .populate("user", "name email");

  res.status(201).json({
    status: true,
    message: "Love transaction created successfully",
    data: populatedTransaction,
  });
});

// Get all love transactions for the user
exports.getAllLoveTransactions = catchAsync(async (req, res, next) => {
  const {
    status,
    startDate,
    endDate,
    page: currentPage,
    limit: currentLimit,
  } = req.query;
  const userId = req.user._id;

  let query = { user: userId };

  // Filter by status
  if (status) {
    if (!["pending", "completed", "cancelled"].includes(status)) {
      return next(new AppError("Invalid status value", 400));
    }
    query.status = status;
  }

  // Filter by createdAt range
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      if (!moment(startDate, moment.ISO_8601, true).isValid()) {
        return next(new AppError("Invalid startDate format", 400));
      }
      query.createdAt.$gte = moment(startDate).tz("Asia/Kolkata").toDate();
    }
    if (endDate) {
      if (!moment(endDate, moment.ISO_8601, true).isValid()) {
        return next(new AppError("Invalid endDate format", 400));
      }
      query.createdAt.$lte = moment(endDate).tz("Asia/Kolkata").toDate();
    }
  }

  // Pagination
  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    LoveTransaction,
    null,
    query
  );

  const transactions = await LoveTransaction.find(query)
    .populate("lovePackage", "name duration sellPrice")
    .populate("loveMember", "yourName partnerName")
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Love transactions fetched successfully",
    data: transactions,
  });
});

// Get a single love transaction
exports.getLoveTransaction = catchAsync(async (req, res, next) => {
  const transactionId = req.params.id;
  const userId = req.user._id;

  // Validate ObjectID
  if (!mongoose.isValidObjectId(transactionId)) {
    return next(new AppError("Invalid transaction ID", 400));
  }

  const transaction = await LoveTransaction.findOne({
    _id: transactionId,
    user: userId,
  })
    .populate("lovePackage", "name duration sellPrice")
    .populate("loveMember", "yourName partnerName")
    .populate("user", "name email");

  if (!transaction) {
    return next(new AppError("Transaction not found or not authorized", 404));
  }

  res.status(200).json({
    status: true,
    message: "Love transaction fetched successfully",
    data: transaction,
  });
});

// Update a love transaction status
exports.updateLoveTransaction = catchAsync(async (req, res, next) => {
  const transactionId = req.params.id;
  const { status } = req.body;
  const userId = req.user._id;

  // Validate ObjectID
  if (!mongoose.isValidObjectId(transactionId)) {
    return next(new AppError("Invalid transaction ID", 400));
  }

  // Validate status
  if (!status || !["pending", "completed", "cancelled"].includes(status)) {
    return next(new AppError("Invalid or missing status value", 400));
  }

  const transaction = await LoveTransaction.findOne({
    _id: transactionId,
    user: userId,
  });

  if (!transaction) {
    return next(new AppError("Transaction not found or not authorized", 404));
  }

  // Update status
  transaction.status = status;
  await transaction.save();

  // Populate the updated transaction
  const populatedTransaction = await LoveTransaction.findById(transactionId)
    .populate("lovePackage", "name duration sellPrice")
    .populate("loveMember", "yourName partnerName")
    .populate("user", "name email");

  res.status(200).json({
    status: true,
    message: "Love transaction updated successfully",
    data: populatedTransaction,
  });
});

// Cancel a love transaction
exports.cancelLoveTransaction = catchAsync(async (req, res, next) => {
  const transactionId = req.params.id;
  const userId = req.user._id;

  // Validate ObjectID
  if (!mongoose.isValidObjectId(transactionId)) {
    return next(new AppError("Invalid transaction ID", 400));
  }

  const transaction = await LoveTransaction.findOne({
    _id: transactionId,
    user: userId,
  });

  if (!transaction) {
    return next(new AppError("Transaction not found or not authorized", 404));
  }

  if (transaction.status === "cancelled") {
    return next(new AppError("Transaction is already cancelled", 400));
  }

  if (transaction.status === "completed") {
    return next(new AppError("Cannot cancel a completed transaction", 400));
  }

  // Update status to cancelled
  transaction.status = "cancelled";
  await transaction.save();

  // Populate the updated transaction
  const populatedTransaction = await LoveTransaction.findById(transactionId)
    .populate("lovePackage", "name duration sellPrice")
    .populate("loveMember", "yourName partnerName")
    .populate("user", "name email");

  res.status(200).json({
    status: true,
    message: "Love transaction cancelled successfully",
    data: populatedTransaction,
  });
});
