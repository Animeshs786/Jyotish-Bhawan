const ProductVariant = require("../../../models/productVariant"); // Adjust path
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const pagination = require("../../../utils/pagination");

// Create a new product variant
exports.createProductVariant = catchAsync(async (req, res, next) => {
  const { name, description, price, sellPrice, duration, mantra } = req.body;

  // Validate input
  if (!name) {
    return next(new AppError("Name is required", 400));
  }
  if (price < 0 || sellPrice < 0) {
    return next(new AppError("Price and sellPrice cannot be negative", 400));
  }

  try {
    const productVariant = await ProductVariant.create({
      name,
      description,
      price,
      sellPrice,
      duration,
      mantra,
    });

    res.status(201).json({
      status: true,
      message: "Product variant created successfully",
      data: productVariant,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("Variant name already exists", 400));
    }
    return next(
      new AppError(`Failed to create variant: ${error.message}`, 500)
    );
  }
});

// Get all product variants
exports.getAllProductVariants = catchAsync(async (req, res, next) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;

  let query = {};
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    ProductVariant,
    null,
    query
  );

  const productVariants = await ProductVariant.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Product variants fetched successfully",
    data: productVariants,
  });
});

// Get a single product variant
exports.getProductVariant = catchAsync(async (req, res, next) => {
  const productVariant = await ProductVariant.findById(req.params.id);

  if (!productVariant) {
    return next(new AppError("Product variant not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Product variant fetched successfully",
    data: productVariant,
  });
});

// Update a product variant
exports.updateProductVariant = catchAsync(async (req, res, next) => {
  const { name, description, price, sellPrice, duration, mantra } = req.body;

  // Validate input
  if (!name && !description && price === undefined && sellPrice === undefined) {
    return next(new AppError("At least one field is required to update", 400));
  }
  if (
    (price !== undefined && price < 0) ||
    (sellPrice !== undefined && sellPrice < 0)
  ) {
    return next(new AppError("Price and sellPrice cannot be negative", 400));
  }

  const productVariant = await ProductVariant.findById(req.params.id);
  if (!productVariant) {
    return next(new AppError("Product variant not found", 404));
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (price !== undefined) updateData.price = price;
  if (sellPrice !== undefined) updateData.sellPrice = sellPrice;
  if (duration) updateData.duration = duration;
  if (mantra) updateData.mantra = mantra;

  try {
    const updatedVariant = await ProductVariant.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: "Product variant updated successfully",
      data: updatedVariant,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("Variant name already exists", 400));
    }
    return next(
      new AppError(`Failed to update variant: ${error.message}`, 500)
    );
  }
});

// Delete a product variant
exports.deleteProductVariant = catchAsync(async (req, res, next) => {
  const productVariant = await ProductVariant.findById(req.params.id);
  if (!productVariant) {
    return next(new AppError("Product variant not found", 404));
  }

  await ProductVariant.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Product variant deleted successfully",
    data: null,
  });
});
