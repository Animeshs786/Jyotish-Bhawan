const ProductCart = require("../../../models/productCart");
const Product = require("../../../models/product");
const ProductVariant = require("../../../models/productVariant");
const User = require("../../../models/user");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");

// Create a new cart item for the user
exports.createProductCart = catchAsync(async (req, res, next) => {
  const { product, productVariant, memberDetail } = req.body;
  const userId = req.user._id; // From protect middleware

  // Validate input
  if (!product) {
    return next(new AppError("Product is required", 400));
  }

  // Validate product
  const productExists = await Product.findById(product);
  if (!productExists) {
    return next(new AppError("Product not found", 404));
  }

  // Validate productVariant if provided
  if (productVariant) {
    const variantExists = await ProductVariant.findById(productVariant);
    if (!variantExists) {
      return next(new AppError("Product variant not found", 404));
    }
  }

  // Validate user
  const userExists = await User.findById(userId);
  if (!userExists) {
    return next(new AppError("User not found", 404));
  }

  try {
    const cartItem = await ProductCart.create({
      product,
      productVariant,
      user: userId,
      memberDetail: memberDetail ? memberDetail : [],
    });

    const populatedCartItem = await ProductCart.findById(cartItem._id)
      .populate("product", "name shortName thumbImage")
      .populate("productVariant", "name price sellPrice")
      .populate("user", "name email");

    res.status(201).json({
      status: true,
      message: "Cart item added successfully",
      data: populatedCartItem,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(
        new AppError("This product/variant is already in your cart", 400)
      );
    }
    return next(new AppError(`Failed to add to cart: ${error.message}`, 500));
  }
});

// Get all cart items for the user
exports.getAllProductCarts = catchAsync(async (req, res, next) => {
  const userId = req.user._id; // From protect middleware

  const query = { user: userId };

  const cartItems = await ProductCart.find(query)
    .populate("product", "name shortName thumbImage")
    .populate("productVariant", "name price sellPrice")
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: true,
    message: "Cart items fetched successfully",
    data: cartItems,
  });
});

// Get a single cart item for the user
exports.getProductCart = catchAsync(async (req, res, next) => {
  const userId = req.user._id; // From protect middleware
  const cartItem = await ProductCart.findOne({
    _id: req.params.id,
    user: userId,
  })
    .populate("product", "name shortName thumbImage")
    .populate("productVariant", "name price sellPrice")
    .populate("user", "name email");

  if (!cartItem) {
    return next(new AppError("Cart item not found or not authorized", 404));
  }

  res.status(200).json({
    status: true,
    message: "Cart item fetched successfully",
    data: cartItem,
  });
});

// Update a cart item for the user
exports.updateProductCart = catchAsync(async (req, res, next) => {
  const { product, productVariant, memberDetail } = req.body;
  const userId = req.user._id; // From protect middleware

  const cartItem = await ProductCart.findOne({
    _id: req.params.id,
    user: userId,
  });
  if (!cartItem) {
    return next(new AppError("Cart item not found or not authorized", 404));
  }

  const updateData = {};

  // Validate product if provided
  if (product) {
    const productExists = await Product.findById(product);
    if (!productExists) {
      return next(new AppError("Product not found", 404));
    }
    updateData.product = product;
  }

  // Validate productVariant if provided
  if (productVariant) {
    const variantExists = await ProductVariant.findById(productVariant);
    if (!variantExists) {
      return next(new AppError("Product variant not found", 404));
    }
    updateData.productVariant = productVariant;
  }

  if (memberDetail) {
    updateData.memberDetail = memberDetail;
  }

  // Validate input
  if (
    !updateData.product &&
    !updateData.productVariant &&
    !updateData.memberDetail
  ) {
    return next(new AppError("At least one field is required to update", 400));
  }

  try {
    const updatedCartItem = await ProductCart.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("product", "name shortName thumbImage")
      .populate("productVariant", "name price sellPrice")
      .populate("user", "name email");

    res.status(200).json({
      status: true,
      message: "Cart item updated successfully",
      data: updatedCartItem,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(
        new AppError("This product/variant is already in your cart", 400)
      );
    }
    return next(
      new AppError(`Failed to update cart item: ${error.message}`, 500)
    );
  }
});

// Delete a cart item for the user
exports.deleteProductCart = catchAsync(async (req, res, next) => {
  const userId = req.user._id; // From protect middleware
  const cartItem = await ProductCart.findOne({
    _id: req.params.id,
    user: userId,
  });

  if (!cartItem) {
    return next(new AppError("Cart item not found or not authorized", 404));
  }

  await ProductCart.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Cart item deleted successfully",
    data: null,
  });
});
