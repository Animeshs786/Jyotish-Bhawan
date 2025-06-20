const ProductTransaction = require("../../../models/productTransaction");
const User = require("../../../models/user");
const Product = require("../../../models/product");
const ProductVariant = require("../../../models/productVariant");
const Coupon = require("../../../models/coupon");
const Shipping = require("../../../models/shipping");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const pagination = require("../../../utils/pagination");

// Create a new product transaction
exports.createProductTransaction = catchAsync(async (req, res, next) => {
  const {
    productData,
    totalPrice,
    gstPrice,
    finalPrice,
    paidAmount = 0,
    dueAmount = 0,
    discountAmount = 0,
    couponCode = "",
    deliveryPrice = 0,
    shipping,
    status = "pending",
  } = req.body;
  console.log(req.body,"++++++++++++")
  const userId = req.user._id; // From protect middleware

  // Validate required fields
  if (!productData || !Array.isArray(productData) || productData.length === 0) {
    return next(
      new AppError(
        "Product data is required and must be a non-empty array",
        400
      )
    );
  }
  if (
    totalPrice === undefined ||
    gstPrice === undefined ||
    finalPrice === undefined
  ) {
    return next(
      new AppError("Total price, GST price, and final price are required", 400)
    );
  }
  if (!shipping) {
    return next(new AppError("Shipping is required", 400));
  }

  // Validate prices
  if (
    totalPrice < 0 ||
    gstPrice < 0 ||
    finalPrice < 0 ||
    paidAmount < 0 ||
    dueAmount < 0 ||
    discountAmount < 0 ||
    deliveryPrice < 0
  ) {
    return next(new AppError("All prices must be non-negative", 400));
  }

  // Validate price consistency
  const expectedFinalPrice =
    totalPrice + gstPrice + deliveryPrice - discountAmount;
  if (Math.abs(finalPrice - expectedFinalPrice) > 0.01) {
    return next(
      new AppError(
        "Final price does not match totalPrice + gstPrice + deliveryPrice - discountAmount",
        400
      )
    );
  }
  if (Math.abs(paidAmount + dueAmount - finalPrice) > 0.01) {
    return next(
      new AppError("Paid amount + due amount must equal final price", 400)
    );
  }

  // Validate status
  if (!["pending", "success", "failed"].includes(status)) {
    return next(new AppError("Invalid status value", 400));
  }

  // Validate user
  const userExists = await User.findById(userId);
  if (!userExists) {
    return next(new AppError("User not found", 404));
  }

  // Validate shipping
  const shippingExists = await Shipping.findById(shipping);
  if (!shippingExists) {
    return next(new AppError("Shipping not found", 404));
  }

  // Validate productData
  for (const item of productData) {
    if (!item.product || !item.productVariant) {
      return next(
        new AppError(
          "Each product data item must include product and productVariant",
          400
        )
      );
    }

    // Validate product
    const productExists = await Product.findById(item.product);
    if (!productExists) {
      return next(new AppError(`Product ${item.product} not found`, 404));
    }

    // Validate productVariant
    const variantExists = await ProductVariant.findById(item.productVariant);
    if (!variantExists) {
      return next(
        new AppError(`Product variant ${item.productVariant} not found`, 404)
      );
    }

    // Validate memberDetail if provided
    if (item.memberDetail && Array.isArray(item.memberDetail)) {
      for (const member of item.memberDetail) {
        if (
          member.gender &&
          !["male", "female", "other"].includes(member.gender)
        ) {
          return next(
            new AppError("Invalid gender value in memberDetail", 400)
          );
        }
      }
    }
  }

  // Validate coupon if provided
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({
      code: { $regex: `^${couponCode}$`, $options: "i" },
    });
    if (!coupon) {
      return next(new AppError("Invalid coupon code", 400));
    }
    if (coupon.expire && new Date(coupon.expire) < new Date()) {
      return next(new AppError("Coupon has expired", 400));
    }
    if (coupon.product.length > 0) {
      const productIds = productData.map((item) => item.product.toString());
      const validProducts = coupon.product.map((p) => p.toString());
      if (!productIds.every((id) => validProducts.includes(id))) {
        return next(
          new AppError("Coupon is not applicable to some products", 400)
        );
      }
    }
    // Assume useCount validation requires CouponUsage schema or tracking (not implemented here)
    // Placeholder: Check useCount per user (requires additional schema)
  }

  try {
    const transaction = await ProductTransaction.create({
      user: userId,
      productData,
      totalPrice,
      gstPrice,
      finalPrice,
      paidAmount,
      dueAmount,
      discountAmount,
      couponCode,
      deliveryPrice,
      shipping,
      status,
      updatedAt: Date.now(),
    });

    const populatedTransaction = await ProductTransaction.findById(
      transaction._id
    )
      .populate("user", "name email")
      .populate("productData.product", "name shortName thumbImage")
      .populate("productData.productVariant", "name price sellPrice")
      .populate("shipping", "address price"); // Adjust fields based on Shipping schema

    res.status(201).json({
      status: true,
      message: "Product transaction created successfully",
      data: populatedTransaction,
    });
  } catch (error) {
    return next(
      new AppError(`Failed to create transaction: ${error.message}`, 500)
    );
  }
});

// Get all product transactions for the user
exports.getAllProductTransactions = catchAsync(async (req, res, next) => {
  const {
    status,
    startDate,
    endDate,
    page: currentPage,
    limit: currentLimit,
  } = req.query;
  const userId = req.user._id;

  let query = { user: userId };

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
    .populate("productData.product")
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
    .populate("productData.product")
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
