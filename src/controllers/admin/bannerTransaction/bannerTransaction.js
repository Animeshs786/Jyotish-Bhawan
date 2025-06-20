const BannerTransaction = require("../../../models/bannerTransaction");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.getAllBannerTransaction = catchAsync(async (req, res, next) => {
  const { search, page: currentPage, limit: currentLimit,user } = req.query;
  let query = {  };
  if (user) {
    query.user = user;
  }

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
