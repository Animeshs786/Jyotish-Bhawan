const ProductCategory = require("../../../models/productCategory"); // Adjust path
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

// Create a new product category
exports.createProductCategory = catchAsync(async (req, res, next) => {
  const { name, description, isActive } = req.body;
  let imagePath;

  // Validate input
  if (!name || !description) {
    return next(new AppError("Name and description are required", 400));
  }

  // Handle image upload
  if (!req.files || !req.files.image) {
    return next(new AppError("Image is required", 400));
  }

  const image = req.files.image[0];
  const imageUrl = `${image.destination}/${image.filename}`;
  imagePath = imageUrl;

  try {
    const productCategory = await ProductCategory.create({
      name,
      description,
      image: imageUrl,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      status: true,
      message: "Product category created successfully",
      data: productCategory,
    });
  } catch (error) {
    // Clean up uploaded image
    if (imagePath) {
      await deleteOldFiles(imagePath).catch((err) => {
        console.error("Failed to delete image:", err);
      });
    }
    if (error.code === 11000) {
      return next(new AppError("Category name already exists", 400));
    }
    return next(new AppError(`Failed to create category: ${error.message}`, 500));
  }
});

// Get all product categories
exports.getAllProductCategories = catchAsync(async (req, res, next) => {
  const { search, isActive, page: currentPage, limit: currentLimit } = req.query;

  let query = {};

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }
  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    ProductCategory,
    null,
    query
  );

  const productCategories = await ProductCategory.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
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

// Update a product category
exports.updateProductCategory = catchAsync(async (req, res, next) => {
  const { name, description, isActive } = req.body;
  let imagePath;

  const productCategory = await ProductCategory.findById(req.params.id);
  if (!productCategory) {
    return next(new AppError("Product category not found", 404));
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (isActive !== undefined) updateData.isActive = isActive;

  // Handle image upload
  if (req.files && req.files.image) {
    const image = req.files.image[0];
    const imageUrl = `${image.destination}/${image.filename}`;
    updateData.image = imageUrl;
    imagePath = imageUrl;

    // Delete old image if exists
    if (productCategory.image) {
      await deleteOldFiles(productCategory.image).catch((err) => {
        console.error("Failed to delete old image:", err);
      });
    }
  }

  // Validate input
  if (!name && !description && isActive === undefined && !updateData.image) {
    return next(new AppError("At least one field is required to update", 400));
  }

  try {
    const updatedCategory = await ProductCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: "Product category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    // Clean up uploaded image
    if (imagePath) {
      await deleteOldFiles(imagePath).catch((err) => {
        console.error("Failed to delete image:", err);
      });
    }
    if (error.code === 11000) {
      return next(new AppError("Category name already exists", 400));
    }
    return next(new AppError(`Failed to update category: ${error.message}`, 500));
  }
});


// Hard delete a product category
exports.deleteProductCategory = catchAsync(async (req, res, next) => {
  const productCategory = await ProductCategory.findById(req.params.id);
  if (!productCategory) {
    return next(new AppError("Product category not found", 404));
  }

  // Delete associated image if exists
  if (productCategory.image) {
    await deleteOldFiles(productCategory.image).catch((err) => {
      console.error("Failed to delete image:", err);
    });
  }

  await ProductCategory.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Product category permanently deleted",
    data: null,
  });
});