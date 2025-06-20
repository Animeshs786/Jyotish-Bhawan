const Dakshina = require("../../../models/dakshina"); // Adjust path
const User = require("../../../models/user"); // Adjust path (assumed)
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const pagination = require("../../../utils/pagination");

// Create a new dakshina record
exports.createDakshina = catchAsync(async (req, res, next) => {
  const { detail, amount, status,name,gotra,contact } = req.body;
  const userId = req.user._id; // From protect middleware

  // Validate input
  if (!detail) {
    return next(new AppError("Detail is required", 400));
  }
  if (amount !== undefined && amount < 0) {
    return next(new AppError("Amount must be non-negative", 400));
  }
  if (status && !["pending", "success", "failed"].includes(status)) {
    return next(new AppError("Invalid status value", 400));
  }

  // Validate user
  const userExists = await User.findById(userId);
  if (!userExists) {
    return next(new AppError("User not found", 404));
  }

  const dakshina = await Dakshina.create({
    user: userId,
    detail,
    amount,
    status: status || "pending",
    name,
    gotra,
    contact
  });

  const populatedDakshina = await Dakshina.findById(dakshina._id).populate(
    "user",
    "name email"
  );

  res.status(201).json({
    status: true,
    message: "Dakshina created successfully",
    data: populatedDakshina,
  });
});

// Get all dakshina records for the user
exports.getAllDakshinas = catchAsync(async (req, res, next) => {
  const { status, page: currentPage, limit: currentLimit, user } = req.query;

  let query = {};
  if (user) {
    query.user = user;
  }

  // Filter by status
  if (status) {
    if (!["pending", "success", "failed"].includes(status)) {
      return next(new AppError("Invalid status value", 400));
    }
    query.status = status;
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Dakshina,
    null,
    query
  );

  const dakshinas = await Dakshina.find(query)
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Dakshina records fetched successfully",
    data: dakshinas,
  });
});

// Get a single dakshina record
exports.getDakshina = catchAsync(async (req, res, next) => {
  const dakshina = await Dakshina.findOne({
    _id: req.params.id,
  }).populate("user", "name email");

  if (!dakshina) {
    return next(
      new AppError("Dakshina record not found or not authorized", 404)
    );
  }

  res.status(200).json({
    status: true,
    message: "Dakshina record fetched successfully",
    data: dakshina,
  });
});

// Update a dakshina record
exports.updateDakshina = catchAsync(async (req, res, next) => {
  const { detail, amount, status } = req.body;

  const dakshina = await Dakshina.findOne({
    _id: req.params.id,
  });
  if (!dakshina) {
    return next(
      new AppError("Dakshina record not found or not authorized", 404)
    );
  }

  const updateData = {};
  if (detail) updateData.detail = detail;
  if (amount !== undefined) {
    if (amount < 0) {
      return next(new AppError("Amount must be non-negative", 400));
    }
    updateData.amount = amount;
  }
  if (status) {
    if (!["pending", "success", "failed"].includes(status)) {
      return next(new AppError("Invalid status value", 400));
    }
    updateData.status = status;
  }

  // Validate input
  if (
    !updateData.detail &&
    updateData.amount === undefined &&
    !updateData.status
  ) {
    return next(new AppError("At least one field is required to update", 400));
  }

  const updatedDakshina = await Dakshina.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  ).populate("user", "name email");

  res.status(200).json({
    status: true,
    message: "Dakshina record updated successfully",
    data: updatedDakshina,
  });
});

// Delete a dakshina record
exports.deleteDakshina = catchAsync(async (req, res, next) => {
  const dakshina = await Dakshina.findOne({
    _id: req.params.id,
  });

  if (!dakshina) {
    return next(
      new AppError("Dakshina record not found or not authorized", 404)
    );
  }

  await Dakshina.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Dakshina record deleted successfully",
    data: null,
  });
});
