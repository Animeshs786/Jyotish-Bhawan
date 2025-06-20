const ProductCategory = require("../../../models/productCategory");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");

// Get all product categories
exports.getAllProductCategories = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  let query = { isActive: true };

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const productCategories = await ProductCategory.find(query).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: true,
    message: "Product categories fetched successfully",
    data: productCategories,
  });
});

// Get a single product category
exports.getProductCategory = catchAsync(async (req, res, next) => {
  const productCategory = await ProductCategory.findById(req.params.id);

  if (!productCategory) {
    return next(new AppError("Product category not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Product category fetched successfully",
    data: productCategory,
  });
});
