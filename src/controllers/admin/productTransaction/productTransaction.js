const ProductTransaction = require("../../../models/productTransaction");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const pagination = require("../../../utils/pagination");

// Get all product transactions for the user
exports.getAllProductTransactions = catchAsync(async (req, res, next) => {
  const {
    status,
    startDate,
    endDate,
    page: currentPage,
    limit: currentLimit,
    userId,
  } = req.query;

  let query = {};

  if (userId) {
    query.user = userId;
  }

  // Filter by status
  if (status) {
    if (!["pending", "success", "failed"].includes(status)) {
      return next(new AppError("Invalid status value", 400));
    }
    query.status = status;
  }

  // Filter by createdAt range
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    ProductTransaction,
    null,
    query
  );

  const transactions = await ProductTransaction.find(query)
    .populate("user", "name email")
    .populate({
      path: "productData.product",
      populate: {
        path: "productVariant", 
        model: "ProductVariant",
      },
    })
    .populate("productData.productVariant")
    .populate("shipping") // Adjust fields based on Shipping schema
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Product transactions fetched successfully",
    data: transactions,
  });
});

// Get a single product transaction for the user
exports.getProductTransaction = catchAsync(async (req, res, next) => {
  const transaction = await ProductTransaction.findOne({
    _id: req.params.id,
  })
    .populate("user", "name email")
    .populate({
      path: "productData.product",
      populate: {
        path: "productVariant",
        model: "ProductVariant",
      },
    })
    .populate("productData.productVariant")
    .populate("shipping"); // Adjust fields based on Shipping schema

  if (!transaction) {
    return next(new AppError("Transaction not found or not authorized", 404));
  }

  res.status(200).json({
    status: true,
    message: "Product transaction fetched successfully",
    data: transaction,
  });
});
