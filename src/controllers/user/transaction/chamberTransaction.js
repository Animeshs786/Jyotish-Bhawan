const ChamberTransaction = require("../../../models/chamberTransaction");
const ChamberPackage = require("../../../models/chamberPackage"); // Adjust path to your ChamberPackage model
const User = require("../../../models/user");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.createChamberTransaction = catchAsync(async (req, res, next) => {
  const {
    chamberPackageProduct,
    totalPrice,
    gstPrice,
    finalPrice,
    paidAmount,
    startDate,
    chamberCity,
  } = req.body;
  const userId = req.user._id;

  // Validate required fields
  if (
    !chamberPackageProduct ||
    !Array.isArray(chamberPackageProduct) ||
    chamberPackageProduct.length === 0
  ) {
    return next(
      new AppError(
        "Chamber package products array is required and must not be empty",
        400
      )
    );
  }
  if (
    totalPrice === undefined ||
    gstPrice === undefined ||
    finalPrice === undefined ||
    !startDate
  ) {
    return next(
      new AppError(
        "Total price, GST price, final price, and start date are required",
        400
      )
    );
  }

  // Validate user
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Validate startDate format
  const startDateObj = new Date(startDate);
  if (isNaN(startDateObj.getTime())) {
    return next(new AppError("Invalid start date format", 400));
  }

  // Validate paidAmount
  const effectivePaidAmount = paidAmount !== undefined ? paidAmount : 0;
  if (effectivePaidAmount < 0) {
    return next(new AppError("Paid amount cannot be negative", 400));
  }

  const transactionProducts = [];

  for (const product of chamberPackageProduct) {
    const {
      chamberPackage,
      name,
      relation,
      gender,
      dob,
      placeBirth,
      birthTime,
      language,
    } = product;

    // Validate required fields in product
    if (
      !chamberPackage ||
      !name ||
      !relation ||
      !gender ||
      !dob ||
      !placeBirth ||
      !birthTime ||
      !language
    ) {
      return next(
        new AppError("All chamber package product fields are required", 400)
      );
    }

    // Validate chamberPackage
    const packageDoc = await ChamberPackage.findById(chamberPackage);
    if (!packageDoc) {
      return next(
        new AppError(`Invalid chamber package ID: ${chamberPackage}`, 400)
      );
    }

    // Calculate expiredAt based on startDate and package duration
    const expiredAt = new Date(startDateObj);
    expiredAt.setDate(startDateObj.getDate() + packageDoc.duration);

    // Add to transaction products
    transactionProducts.push({
      chamberPackage: packageDoc._id,
      name,
      relation,
      gender,
      dob,
      placeBirth,
      birthTime,
      language,
      expiredAt,
      visitStatus: false,
      visitDate: startDateObj,
    });
  }

  // Calculate dueAmount
  const dueAmount = finalPrice - effectivePaidAmount;

  const chamberTransactionData = {
    user: userId,
    chamberPackageProduct: transactionProducts,
    totalPrice,
    gstPrice,
    finalPrice,
    paidAmount: effectivePaidAmount,
    dueAmount,
    status: "pending",
    updatedAt: new Date(),
    chamberCity,
  };

  console.log(chamberTransactionData, "chamberTransactionData");

  try {
    const newChamberTransaction = await ChamberTransaction.create(
      chamberTransactionData
    );

    res.status(201).json({
      status: true,
      message: "Transaction created successfully",
      data: newChamberTransaction,
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllChamberTransactions = catchAsync(async (req, res, next) => {
  const { page: currentPage, limit: currentLimit, status } = req.query;
  const userId = req.user._id;

  // Build query
  let query = { user: userId };

  // Filter by status if provided
  if (status) {
    const validStatuses = ["pending", "success", "failed"];
    if (!validStatuses.includes(status)) {
      return next(
        new AppError(
          "Invalid status filter. Use 'pending', 'success', or 'failed'",
          400
        )
      );
    }
    query.status = status;
  }

  // Pagination
  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    ChamberTransaction,
    null,
    query
  );

  // Fetch transactions
  const transactions = await ChamberTransaction.find(query)
    .populate({
      path: "chamberPackageProduct.chamberPackage",
      select: "name price duration", // Adjust fields as needed
    })
    .populate("user", "name email")
    .populate("chamberCity")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Chamber transactions fetched successfully",
    data: transactions,
  });
});

exports.getChamberTransaction = catchAsync(async (req, res, next) => {
  // Fetch transactions
  const transactions = await ChamberTransaction.findById(req.params.id)
    .populate({
      path: "chamberPackageProduct.chamberPackage",
      select: "name price duration", // Adjust fields as needed
    })
    .populate("chamberCity")
    .populate("user", "name email");

  res.status(200).json({
    status: true,
    message: "Chamber transactions fetched successfully",
    data: transactions,
  });
});
