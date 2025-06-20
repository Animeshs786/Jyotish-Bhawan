const Coupon = require("../../../models/coupon");
const Product = require("../../../models/product");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const pagination = require("../../../utils/pagination");

// Create a new coupon
exports.createCoupon = catchAsync(async (req, res, next) => {
  const {
    code,
    discountType,
    product,
    discountValue,
    useCount,
    expire,
    minAmount,
  } = req.body;

  // Validate input
  if (!code || !discountValue) {
    return next(new AppError("Code and discount value are required", 400));
  }
  if (discountValue <= 0) {
    return next(new AppError("Discount value must be positive", 400));
  }
  if (
    useCount !== undefined &&
    (!Number.isInteger(useCount) || useCount <= 0)
  ) {
    return next(new AppError("Use count must be a positive integer", 400));
  }
  if (discountType && !["flat", "percentage"].includes(discountType)) {
    return next(new AppError("Invalid discount type", 400));
  }
  if (expire && new Date(expire) <= new Date()) {
    return next(new AppError("Expiry date must be in the future", 400));
  }

  // Validate product IDs if provided
  if (product && product.length > 0) {
    const productExists = await Product.find({ _id: { $in: product } });
    if (productExists.length !== product.length) {
      return next(new AppError("One or more products not found", 404));
    }
  }

  // Check for duplicate code (case-insensitive)
  const existingCoupon = await Coupon.findOne({
    code: { $regex: `^${code}$`, $options: "i" },
  });
  if (existingCoupon) {
    return next(new AppError("Coupon code already exists", 400));
  }

  try {
    const coupon = await Coupon.create({
      code,
      discountType: discountType || "flat",
      product: product || [],
      discountValue,
      useCount: useCount || 1,
      expire,
      minAmount: minAmount || 0,
    });

    const populatedCoupon = await Coupon.findById(coupon._id).populate(
      "product",
      "name shortName thumbImage"
    );

    res.status(201).json({
      status: true,
      message: "Coupon created successfully",
      data: populatedCoupon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("Coupon code already exists", 400));
    }
    return next(new AppError(`Failed to create coupon: ${error.message}`, 500));
  }
});

// Get all coupons
exports.getAllCoupons = catchAsync(async (req, res, next) => {
  const { search, active, page: currentPage, limit: currentLimit } = req.query;

  let query = {};
  if (search) {
    query.code = { $regex: search, $options: "i" };
  }
  if (active === "true") {
    query.$or = [
      { expire: { $exists: false } },
      { expire: { $gt: new Date() } },
    ];
  } else if (active === "false") {
    query.expire = { $lte: new Date() };
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Coupon,
    null,
    query
  );

  const coupons = await Coupon.find(query)
    .populate("product", "name shortName thumbImage")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Coupons fetched successfully",
    data: coupons,
  });
});

// Get a single coupon
exports.getCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id).populate(
    "product",
    "name shortName thumbImage"
  );

  if (!coupon) {
    return next(new AppError("Coupon not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Coupon fetched successfully",
    data: coupon,
  });
});

// Update a coupon
exports.updateCoupon = catchAsync(async (req, res, next) => {
  const {
    code,
    discountType,
    product,
    discountValue,
    useCount,
    expire,
    minAmount,
  } = req.body;

  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return next(new AppError("Coupon not found", 404));
  }

  const updateData = {};
  if (code && code !== coupon.code) {
    const existingCoupon = await Coupon.findOne({
      code: { $regex: `^${code}$`, $options: "i" },
      _id: { $ne: req.params.id },
    });
    if (existingCoupon) {
      return next(new AppError("Coupon code already exists", 400));
    }
    updateData.code = code;
  }
  if (discountType && !["flat", "percentage"].includes(discountType)) {
    return next(new AppError("Invalid discount type", 400));
  }
  if (discountType) updateData.discountType = discountType;
  if (product !== undefined) {
    if (product.length > 0) {
      const productExists = await Product.find({ _id: { $in: product } });
      if (productExists.length !== product.length) {
        return next(new AppError("One or more products not found", 404));
      }
    }
    updateData.product = product;
  }
  if (discountValue !== undefined) {
    if (discountValue <= 0) {
      return next(new AppError("Discount value must be positive", 400));
    }
    updateData.discountValue = discountValue;
  }
  if (useCount !== undefined) {
    if (!Number.isInteger(useCount) || useCount <= 0) {
      return next(new AppError("Use count must be a positive integer", 400));
    }
    updateData.useCount = useCount;
  }
  if (expire !== undefined) {
    if (expire && new Date(expire) <= new Date()) {
      return next(new AppError("Expiry date must be in the future", 400));
    }
    updateData.expire = expire || null;
  }
  if (minAmount !== undefined) {
    updateData.minAmount = minAmount;
  }

  // Validate input
  if (
    !updateData.code &&
    !updateData.discountType &&
    product === undefined &&
    discountValue === undefined &&
    useCount === undefined &&
    expire === undefined
  ) {
    return next(new AppError("At least one field is required to update", 400));
  }

  try {
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("product", "name shortName thumbImage");

    res.status(200).json({
      status: true,
      message: "Coupon updated successfully",
      data: updatedCoupon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("Coupon code already exists", 400));
    }
    return next(new AppError(`Failed to update coupon: ${error.message}`, 500));
  }
});

// Delete a coupon
exports.deleteCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return next(new AppError("Coupon not found", 404));
  }

  await Coupon.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Coupon deleted successfully",
    data: null,
  });
});
