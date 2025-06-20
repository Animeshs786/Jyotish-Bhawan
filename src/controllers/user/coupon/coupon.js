const Coupon = require("../../../models/coupon");
const Product = require("../../../models/product");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const mongoose = require("mongoose");
const ProductTransaction = require("../../../models/productTransaction");

exports.getAllCoupons = catchAsync(async (req, res, next) => {
  let { productIds } = req.body;

  // Build query
  let query = {
    $or: [{ expire: { $exists: false } }, { expire: { $gt: new Date() } }],
  };

  if (productIds.length === 0) {
    // Fetch coupons valid for all products (empty product array)
    query.product = { $size: 0 };
  } else {
    // Fetch coupons where product array includes at least one of the productIds
    query.product = { $all: productIds };
  }

  // Fetch coupons
  const coupons = await Coupon.find(query)
    .populate("product", "name shortName thumbImage")
    .sort({ createdAt: -1 });

  // Placeholder: Filter coupons by per-user useCount (requires CouponUsage schema)
  // Example:
  // const validCoupons = coupons.filter(async (coupon) => {
  //   const usage = await CouponUsage.countDocuments({ user: userId, coupon: coupon._id });
  //   return usage < coupon.useCount;
  // });

  res.status(200).json({
    status: true,
    message: "Valid coupons fetched successfully",
    data: coupons,
  });
});
exports.applyCoupon = catchAsync(async (req, res) => {
  try {
    const { productId, amount, couponCode } = req.body;
    const userId = req.user._id;
    if (!userId || !productId || !amount || !couponCode) {
      return res.status(400).json({ status: false, message: "Missing fields" });
    }

    const coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
    });
    if (!coupon) {
      return res
        .status(404)
        .json({ status: false, message: "Coupon code not found" });
    }

    // Check expiry
    if (coupon.expire && new Date() > coupon.expire) {
      return res.status(400).json({ status: false, message: "Coupon expired" });
    }

    // Check if coupon is restricted to specific products
    if (coupon.product.length > 0 && !coupon.product.includes(productId)) {
      return res.status(400).json({
        status: false,
        message: "Coupon not valid for this product",
      });
    }

    // Check minimum amount
    if (coupon.minAmount && amount < coupon.minAmount) {
      return res.status(400).json({
        status: false,
        message: `Minimum amount of ₹${coupon.minAmount} required to use this coupon`,
      });
    }

    // Check user has already used the coupon
    const alreadyUsed = await ProductTransaction.countDocuments({
      user: new mongoose.Types.ObjectId(userId),
      couponCode: coupon.code,
    });

    if (alreadyUsed >= coupon.useCount) {
      return res.status(400).json({
        status: false,
        message: "Coupon already used by the user",
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "flat") {
      discount = coupon.discountValue;
    } else if (coupon.discountType === "percentage") {
      discount = (amount * coupon.discountValue) / 100;
    }

    const finalAmount = amount - discount;

    return res.status(200).json({
      status: true,
      message: "Coupon applied successfully",
      data: {
        couponCode: coupon.code,
        discountValue: discount,
        amount: finalAmount,
      },
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});
