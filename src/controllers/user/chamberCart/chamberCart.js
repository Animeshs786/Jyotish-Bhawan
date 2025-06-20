const ChamberCart = require("../../../models/chamberCart"); 
const User = require("../../../models/user"); 
const ChamberPackage = require("../../../models/chamberPackage"); 
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.createChamberCart = catchAsync(async (req, res, next) => {
  const { chamberPackageProduct } = req.body;
  const userId = req.user._id;

  console.log(req.body, "body");

  // Validate required fields
  if (!chamberPackageProduct) {
    return next(new AppError("Chamber package products are required", 400));
  }

  // Validate user
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Check for existing cart for the user
  const existingCart = await ChamberCart.findOne({ user: userId });
  if (existingCart) {
    return next(new AppError("User already has an active cart", 400));
  }

  // Validate chamberPackageProduct array
  if (!Array.isArray(chamberPackageProduct) || chamberPackageProduct.length === 0) {
    return next(new AppError("Chamber package products must be a non-empty array", 400));
  }

  // Validate each product in chamberPackageProduct
  for (const product of chamberPackageProduct) {
    const { chamberPackage, name, relation, gender, dob, placeBirth, birthTime, language } = product;

    // Validate required fields for each product
    if (!chamberPackage || !name || !relation || !gender || !dob || !placeBirth || !birthTime || !language) {
      return next(new AppError("All fields in chamber package product are required", 400));
    }

    // Validate gender
    if (!["male", "female", "other"].includes(gender)) {
      return next(new AppError("Gender must be 'male', 'female', or 'other'", 400));
    }

    // Validate dob format
    if (isNaN(new Date(dob).getTime())) {
      return next(new AppError("Invalid date of birth format", 400));
    }

    // Validate chamberPackage
    const packageExists = await ChamberPackage.findById(chamberPackage);
    if (!packageExists) {
      return next(new AppError(`Chamber package with ID ${chamberPackage} not found`, 404));
    }
  }

  const chamberCartData = {
    user: userId,
    chamberPackageProduct,
  };

  try {
    const newChamberCart = await ChamberCart.create(chamberCartData);

    res.status(201).json({
      status: true,
      message: "Cart created successfully",
      data: newChamberCart,
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllChamberCarts = catchAsync(async (req, res) => {
  const { page: currentPage, limit: currentLimit } = req.query;
  const userId = req.user._id;

  let query = { user: userId }; // Restrict to the authenticated user's carts

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    ChamberCart,
    null,
    query
  );

  const chamberCarts = await ChamberCart.find(query)
    .populate("user", "name email")
    .populate("chamberPackageProduct.chamberPackage", "name price")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "User carts fetched successfully",
    data: chamberCarts,
  });
});

exports.getChamberCart = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const chamberCart = await ChamberCart.findById(req.params.id)
    .populate("user", "name email")
    .populate("chamberPackageProduct.chamberPackage", "name price");

  if (!chamberCart) {
    return next(new AppError("Cart not found", 404));
  }

  // Ensure the cart belongs to the authenticated user
  if (chamberCart.user.toString() !== userId.toString()) {
    return next(new AppError("Unauthorized: You can only view your own cart", 403));
  }

  res.status(200).json({
    status: true,
    message: "Cart fetched successfully",
    data: chamberCart,
  });
});

exports.updateChamberCart = catchAsync(async (req, res, next) => {
  const { chamberPackageProduct } = req.body;
  const userId = req.user._id;

  console.log(req.body, "body");
  const chamberCart = await ChamberCart.findById(req.params.id);

  if (!chamberCart) {
    return next(new AppError("Cart not found", 404));
  }

  // Ensure the cart belongs to the authenticated user
  if (chamberCart.user.toString() !== userId.toString()) {
    return next(new AppError("Unauthorized: You can only update your own cart", 403));
  }

  const chamberCartData = {};

  // Validate chamberPackageProduct if provided
  if (chamberPackageProduct) {
    if (!Array.isArray(chamberPackageProduct) || chamberPackageProduct.length === 0) {
      return next(new AppError("Chamber package products must be a non-empty array", 400));
    }

    for (const product of chamberPackageProduct) {
      const { chamberPackage, name, relation, gender, dob, placeBirth, birthTime, language } = product;

      // Validate required fields for each product
      if (!chamberPackage || !name || !relation || !gender || !dob || !placeBirth || !birthTime || !language) {
        return next(new AppError("All fields in chamber package product are required", 400));
      }

      // Validate gender
      if (!["male", "female", "other"].includes(gender)) {
        return next(new AppError("Gender must be 'male', 'female', or 'other'", 400));
      }

      // Validate dob format
      if (isNaN(new Date(dob).getTime())) {
        return next(new AppError("Invalid date of birth format", 400));
      }

      // Validate chamberPackage
      const packageExists = await ChamberPackage.findById(chamberPackage);
      if (!packageExists) {
        return next(new AppError(`Chamber package with ID ${chamberPackage} not found`, 404));
      }
    }
    chamberCartData.chamberPackageProduct = chamberPackageProduct;
  }

  try {
    const updatedChamberCart = await ChamberCart.findByIdAndUpdate(
      req.params.id,
      chamberCartData,
      { new: true, runValidators: true }
    )
      .populate("user", "name email")
      .populate("chamberPackageProduct.chamberPackage", "name price");

    res.status(200).json({
      status: true,
      message: "Cart updated successfully",
      data: updatedChamberCart,
    });
  } catch (error) {
    return next(error);
  }
});

exports.deleteChamberCart = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const chamberCart = await ChamberCart.findById(req.params.id);

  if (!chamberCart) {
    return next(new AppError("Cart not found", 404));
  }

  // Ensure the cart belongs to the authenticated user
  if (chamberCart.user.toString() !== userId.toString()) {
    return next(new AppError("Unauthorized: You can only delete your own cart", 403));
  }

  await ChamberCart.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Cart deleted successfully",
    data: null,
  });
});