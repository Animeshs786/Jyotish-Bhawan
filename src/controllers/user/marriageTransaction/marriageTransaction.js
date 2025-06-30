const User = require("../../../models/user");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const moment = require("moment-timezone");
const mongoose = require("mongoose");
const pagination = require("../../../utils/pagination");
const Astrologer = require("../../../models/asteroLogerSchema");
const MarriageTransaction = require("../../../models/marriageTransaction");
const MarriagePackage = require("../../../models/marriagePackage");

moment.tz.setDefault("Asia/Kolkata");

// Create a new consultation transaction
exports.createMarriageTransaction = catchAsync(async (req, res, next) => {
  const { marriagePackage, astrologer, amount, gstAmount, boyDetail,girlDetail } =
    req.body;
  const userId = req.user._id; // From protect middleware

  // Validate required fields
  if (!marriagePackage) {
    return next(new AppError("Marriage package ID is required", 400));
  }
  if (!astrologer) {
    return next(new AppError("Astrologer ID is required", 400));
  }
  if (amount === undefined || amount < 0) {
    return next(new AppError("Valid amount is required", 400));
  }
  if (gstAmount === undefined || gstAmount < 0) {
    return next(new AppError("Valid GST amount is required", 400));
  }

  // Validate ObjectIDs
  if (
    !mongoose.isValidObjectId(marriagePackage) ||
    !mongoose.isValidObjectId(astrologer)
  ) {
    return next(
      new AppError("Invalid consultation package or astrologer ID", 400)
    );
  }



  // Validate user
  const userExists = await User.findById(userId);
  if (!userExists) {
    return next(new AppError("User not found", 404));
  }

  // Validate consultation package
  const packageExists = await MarriagePackage.findById(marriagePackage);
  if (!packageExists) {
    return next(new AppError("Marriage package not found", 404));
  }
  if (!packageExists.status) {
    return next(new AppError("Marriage package is not active", 400));
  }

  // Validate astrologer
  const astrologerExists = await Astrologer.findById(astrologer);
  if (!astrologerExists) {
    return next(new AppError("Astrologer not found", 404));
  }

  // Calculate expiry date based on packageExpiry (in days)
  const expiryDate = moment()
    .tz("Asia/Kolkata")
    .add(packageExists.packageExpiry, "days")
    .toDate();

  // Create consultation transaction
  const transaction = await MarriageTransaction.create({
    marriagePackage,
    astrologer,
    user: userId,
    boyDetail,
    girlDetail,
    status: "pending",
    duration: packageExists.duration, // Set duration from package
    expiryDate, // Set calculated expiry date
    amount,
    gstAmount,
    createdAt: Date.now(),
  });

  // Populate the transaction for response
  const populatedTransaction = await MarriageTransaction.findById(
    transaction._id
  )
    .populate("marriagePackage", "name duration sellPrice")
    .populate("astrologer", "name")
    .populate("user", "name email");

  res.status(201).json({
    status: true,
    message: "Consultation transaction created successfully",
    data: populatedTransaction,
  });
});

// Get all consultation transactions for the user
exports.getAllMarriageTransactions = catchAsync(async (req, res, next) => {
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
    MarriageTransaction,
    null,
    query
  );

  const transactions = await MarriageTransaction.find(query)
    .populate("marriagePackage", "name duration sellPrice")
    .populate("astrologer")
    .populate("user")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Consultation transactions fetched successfully",
    data: transactions,
  });
});

// Get a single consultation transaction
exports.getMarriageTransaction = catchAsync(async (req, res, next) => {
  const transactionId = req.params.id;
  const userId = req.user._id;

  // Validate ObjectID
  if (!mongoose.isValidObjectId(transactionId)) {
    return next(new AppError("Invalid transaction ID", 400));
  }

  const transaction = await MarriageTransaction.findOne({
    _id: transactionId,
    user: userId,
  })
    .populate("marriagePackage", "name duration sellPrice")
    .populate("astrologer")
    .populate("user");

  if (!transaction) {
    return next(new AppError("Transaction not found or not authorized", 404));
  }

  res.status(200).json({
    status: true,
    message: "Consultation transaction fetched successfully",
    data: transaction,
  });
});

// Update a consultation transaction status
exports.updateMarriageTransaction = catchAsync(async (req, res, next) => {
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

  const transaction = await MarriageTransaction.findOne({
    _id: transactionId,
    user: userId,
  });

  if (!transaction) {
    return next(new AppError("Transaction not found or not authorized", 404));
  }

  // Update status
  transaction.status = status;
  transaction.updatedAt = Date.now();
  await transaction.save();

  // Populate the updated transaction
  const populatedTransaction = await MarriageTransaction.findById(transactionId)
    .populate("marriagePackage", "name duration sellPrice")
    .populate("astrologer", "name")
    .populate("user", "name email");

  res.status(200).json({
    status: true,
    message: "Consultation transaction updated successfully",
    data: populatedTransaction,
  });
});

// Cancel a consultation transaction
exports.cancelMarriageTransaction = catchAsync(async (req, res, next) => {
  const transactionId = req.params.id;
  const userId = req.user._id;

  // Validate ObjectID
  if (!mongoose.isValidObjectId(transactionId)) {
    return next(new AppError("Invalid transaction ID", 400));
  }

  const transaction = await MarriageTransaction.findOne({
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
  transaction.updatedAt = Date.now();
  await transaction.save();

  // Populate the updated transaction
  const populatedTransaction = await MarriageTransaction.findById(transactionId)
    .populate("marriagePackage", "name duration sellPrice")
    .populate("astrologer", "name")
    .populate("user", "name email");

  res.status(200).json({
    status: true,
    message: "Consultation transaction cancelled successfully",
    data: populatedTransaction,
  });
});
