const Product = require("../../../models/product"); // Adjust path
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

// Create a new product
exports.createProduct = catchAsync(async (req, res, next) => {
  const {
    name,
    shortName,
    about,
    benefits,
    productVariant,
    isActive = true,
    productCategory,
  } = req.body;
  let thumbImagePath;
  let imagePaths = [];

  // Validate input
  if (!name || !shortName || !productCategory) {
    return next(
      new AppError("Name and shortName and productCategory are required", 400)
    );
  }

  // Handle thumbImage upload
  if (!req.files || !req.files.thumbImage) {
    return next(new AppError("Thumbnail image is required", 400));
  }

  const thumbImage = req.files.thumbImage[0];
  const thumbImageUrl = `${thumbImage.destination}/${thumbImage.filename}`;
  thumbImagePath = thumbImageUrl;

  // Handle multiple images upload
  if (req.files && req.files.images) {
    imagePaths = req.files.images.map(
      (file) => `${file.destination}/${file.filename}`
    );
  }

  try {
    const product = await Product.create({
      name,
      shortName,
      thumbImage: thumbImageUrl,
      images: imagePaths,
      about,
      benefits,
      productVariant: productVariant ? JSON.parse(productVariant) : [],
      isActive,
      productCategory,
    });

    res.status(201).json({
      status: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    // Clean up uploaded thumbImage
    if (thumbImagePath) {
      await deleteOldFiles(thumbImagePath).catch((err) => {
        console.error("Failed to delete thumbnail image:", err);
      });
    }
    // Clean up uploaded images
    if (imagePaths.length > 0) {
      await Promise.all(
        imagePaths.map((path) =>
          deleteOldFiles(path).catch((err) => {
            console.error("Failed to delete image:", err);
          })
        )
      );
    }
    if (error.code === 11000) {
      return next(new AppError("Product name already exists", 400));
    }
    return next(
      new AppError(`Failed to create product: ${error.message}`, 500)
    );
  }
});

// Get all products
exports.getAllProducts = catchAsync(async (req, res, next) => {
  const {
    search,
    page: currentPage,
    limit: currentLimit,
    productCategory,
  } = req.query;

  let query = {};
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

// Update a product
exports.updateProduct = catchAsync(async (req, res, next) => {
  const {
    name,
    shortName,
    about,
    benefits,
    productVariant,
    isActive,
    productCategory,
  } = req.body;
  let thumbImagePath;
  let imagePaths = [];

  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (productCategory) updateData.productCategory = productCategory;
  if (shortName) updateData.shortName = shortName;
  if (about) updateData.about = about;
  if (benefits) updateData.benefits = benefits;
  if (productVariant) updateData.productVariant = JSON.parse(productVariant);
  if (isActive !== undefined) updateData.isActive = isActive;

  // Handle thumbImage upload
  if (req.files && req.files.thumbImage) {
    const thumbImage = req.files.thumbImage[0];
    const thumbImageUrl = `${thumbImage.destination}/${thumbImage.filename}`;
    updateData.thumbImage = thumbImageUrl;
    thumbImagePath = thumbImageUrl;

    // Delete old thumbImage if exists
    if (product.thumbImage) {
      await deleteOldFiles(product.thumbImage).catch((err) => {
        console.error("Failed to delete old thumbnail image:", err);
      });
    }
  }

  // Handle multiple images upload
  if (req.files && req.files.images) {
    updateData.images = req.files.images.map(
      (file) => `${file.destination}/${file.filename}`
    );
    imagePaths = updateData.images;

    // Delete old images if exists
    if (product.images && product.images.length > 0) {
      await Promise.all(
        product.images.map((path) =>
          deleteOldFiles(path).catch((err) => {
            console.error("Failed to delete old image:", err);
          })
        )
      );
    }
  }

  // Validate input
  if (
    !name &&
    !shortName &&
    !about &&
    !benefits &&
    !productVariant &&
    !updateData.thumbImage &&
    !updateData.images
  ) {
    return next(new AppError("At least one field is required to update", 400));
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("productVariant");

    res.status(200).json({
      status: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    // Clean up uploaded thumbImage
    if (thumbImagePath) {
      await deleteOldFiles(thumbImagePath).catch((err) => {
        console.error("Failed to delete thumbnail image:", err);
      });
    }
    // Clean up uploaded images
    if (imagePaths.length > 0) {
      await Promise.all(
        imagePaths.map((path) =>
          deleteOldFiles(path).catch((err) => {
            console.error("Failed to delete image:", err);
          })
        )
      );
    }
    if (error.code === 11000) {
      return next(new AppError("Product name already exists", 400));
    }
    return next(
      new AppError(`Failed to update product: ${error.message}`, 500)
    );
  }
});

// Delete a product
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // Delete associated thumbImage if exists
  if (product.thumbImage) {
    await deleteOldFiles(product.thumbImage).catch((err) => {
      console.error("Failed to delete thumbnail image:", err);
    });
  }

  // Delete associated images if exists
  if (product.images && product.images.length > 0) {
    await Promise.all(
      product.images.map((path) =>
        deleteOldFiles(path).catch((err) => {
          console.error("Failed to delete image:", err);
        })
      )
    );
  }

  await Product.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Product deleted successfully",
    data: null,
  });
});
