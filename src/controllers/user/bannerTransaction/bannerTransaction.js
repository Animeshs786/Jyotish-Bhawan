const BannerTransaction = require("../../../models/bannerTransaction");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.createBannerTransaction = catchAsync(async (req, res, next) => {
  const {
    bookBanner,
    shipping,
    customerDetail,
    amount,
    format,
    gstAmount,
    finalAmount,
    status,
    deliverStatus,
  } = req.body;

  const user = req.user._id;

  // Validate required fields
  if (
    !bookBanner ||
    !shipping ||
    !user ||
    !amount ||
    !format ||
    !gstAmount ||
    !finalAmount
  ) {
    return next(
      new AppError(
        "BookBanner, shipping, user, amount, format, gstAmount, and finalAmount are required",
        400
      )
    );
  }

  // Validate customerDetail if provided
  if (customerDetail) {
    try {
      const parsedCustomerDetail = Array.isArray(customerDetail)
        ? customerDetail
        : JSON.parse(customerDetail);

      for (const detail of parsedCustomerDetail) {
        if (
          detail.gender &&
          !["male", "female", "other"].includes(detail.gender)
        ) {
          return next(new AppError("Invalid gender value", 400));
        }
        if (
          detail.language &&
          !["english", "hindi", "bangla"].includes(detail.language)
        ) {
          return next(new AppError("Invalid language value", 400));
        }
      }
    } catch (error) {
      return next(new AppError("Invalid customerDetail format", 400));
    }
  }

  // Validate format
  if (!["handwritten", "printed"].includes(format)) {
    return next(new AppError("Invalid format value", 400));
  }

  // Validate status if provided
  if (status && !["pending", "success", "failed"].includes(status)) {
    return next(new AppError("Invalid status value", 400));
  }

  // Validate deliverStatus if provided
  if (
    deliverStatus &&
    !["pending", "dispatch", "cancel", "complete"].includes(deliverStatus)
  ) {
    return next(new AppError("Invalid deliverStatus value", 400));
  }

  const transactionData = {
    bookBanner,
    shipping,
    user,
    customerDetail: customerDetail
      ? Array.isArray(customerDetail)
        ? customerDetail
        : JSON.parse(customerDetail)
      : [],
    amount,
    format,
    gstAmount,
    finalAmount,
    status: status || "pending",
    deliverStatus: deliverStatus || "pending",
  };

  try {
    const newTransaction = await BannerTransaction.create(transactionData);

    // Populate references for response
    await newTransaction.populate("bookBanner shipping user");

    res.status(201).json({
      status: true,
      message: "Transaction created successfully",
      data: newTransaction,
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllBannerTransaction = catchAsync(async (req, res, next) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;
  const user = req.user._id;
  let query = { user };

  if (search) {
    query.$or = [
      { status: { $regex: search, $options: "i" } },
      { deliverStatus: { $regex: search, $options: "i" } },
      { format: { $regex: search, $options: "i" } },
      { "customerDetail.name": { $regex: search, $options: "i" } },
    ];
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    BannerTransaction,
    null,
    query
  );

  const transactions = await BannerTransaction.find(query)
    .populate("bookBanner shipping user")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Transactions fetched successfully",
    data: transactions,
  });
});

exports.getBannerTransaction = catchAsync(async (req, res, next) => {
  const transaction = await BannerTransaction.findById(req.params.id).populate(
    "bookBanner shipping user"
  );

  if (!transaction) {
    return next(new AppError("Transaction not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Transaction fetched successfully",
    data: transaction,
  });
});
