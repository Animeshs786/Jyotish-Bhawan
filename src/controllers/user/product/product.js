const Product = require("../../../models/product");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const {
    search,
    page: currentPage,
    limit: currentLimit,
    productCategory,
  } = req.query;

  let query = { isActive: true };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { shortName: { $regex: search, $options: "i" } },
    ];
  }
  if (productCategory) {
    query.productCategory = productCategory;
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Product,
    null,
    query
  );

  const products = await Product.find(query)
    .populate("productVariant")
    .populate("productCategory")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Products fetched successfully",
    data: products,
  });
});

// Get a single product
exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate("productCategory")
    .populate("productVariant");

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Product fetched successfully",
    data: product,
  });
});
