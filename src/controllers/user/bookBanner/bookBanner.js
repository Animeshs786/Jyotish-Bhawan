const BookBanner = require("../../../models/bookBanner");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.getAllBookBanners = catchAsync(async (req, res) => {
  const { search, page: currentPage, limit: currentLimit, type } = req.query;

  let query = {};

  if (search) {
    query.$or = [{ type: { $regex: search, $options: "i" } }];
  }
  if (type) {
    query.type =type;
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    BookBanner,
    null,
    query
  );

  const bookBanners = await BookBanner.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Book banners fetched successfully",
    data: bookBanners,
  });
});

exports.getBookBanner = catchAsync(async (req, res, next) => {
  const bookBanner = await BookBanner.findById(req.params.id);

  if (!bookBanner) {
    return next(new AppError("Book banner not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Book banner fetched successfully",
    data: bookBanner,
  });
});
