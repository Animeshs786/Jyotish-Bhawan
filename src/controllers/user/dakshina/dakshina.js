const Dakshina = require("../../../models/dakshina"); // Adjust path
const User = require("../../../models/user"); // Adjust path (assumed)
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const pagination = require("../../../utils/pagination");

// Create a new dakshina record
exports.createDakshina = catchAsync(async (req, res, next) => {
  const { detail, amount, status } = req.body;
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

