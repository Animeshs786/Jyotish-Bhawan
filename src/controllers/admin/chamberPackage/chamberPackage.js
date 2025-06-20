const ChamberPackage = require("../../../models/chamberPackage"); // Adjust path to your ChamberPackage model
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

exports.createChamberPackage = catchAsync(async (req, res, next) => {
  const { name, price, facture, chamberCity, duration, status } = req.body;
  let imagePath;

  console.log(req.body, "body");

  // Validate required fields
  if (!name || !price || !duration || !status) {
    return next(
      new AppError("Name, price, duration, and status are required", 400)
    );
  }

  // Validate price and duration
  if (price < 0) {
    return next(new AppError("Price cannot be negative", 400));
  }
  if (duration <= 0) {
    return next(new AppError("Duration must be a positive number", 400));
  }

  // Validate facture if provided
  let parsedFacture = [];
  if (facture) {
    try {
      parsedFacture = JSON.parse(facture);
      if (
        !Array.isArray(parsedFacture) ||
        !parsedFacture.every((item) => typeof item === "string")
      ) {
        return next(new AppError("Facture must be an array of strings", 400));
      }
    } catch (error) {
      return next(new AppError("Invalid facture format", 400));
    }
  }

  const chamberPackageData = {
    name,
    price,
    facture: parsedFacture,
    duration,
    status,
    chamberCity: chamberCity ? JSON.parse(chamberCity) : [],
  };

  try {
    // Handle image upload
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imageUrl = `${image.destination}/${image.filename}`;
      chamberPackageData.image = imageUrl;
      imagePath = imageUrl;
    } else {
      return next(new AppError("Image is required", 400));
    }

    const newChamberPackage = await ChamberPackage.create(chamberPackageData);

    res.status(201).json({
      status: true,
      message: "Chamber package created successfully",
      data: newChamberPackage,
    });
  } catch (error) {
    // Clean up uploaded image if creation fails
    if (imagePath) {
      await deleteOldFiles(imagePath).catch((err) => {
        console.error("Failed to delete image:", err);
      });
    }
    return next(error);
  }
});

exports.getAllChamberPackages = catchAsync(async (req, res) => {
  const {
    search,
    page: currentPage,
    limit: currentLimit,
    chamberCity,
  } = req.query;

  let query = {};

  // Search by name or status
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
    ];
  }

  if (chamberCity) {
    query.chamberCity = { $in: [chamberCity] };
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    ChamberPackage,
    null,
    query
  );

  const chamberPackages = await ChamberPackage.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Chamber packages fetched successfully",
    data: chamberPackages,
  });
});

exports.getChamberPackage = catchAsync(async (req, res, next) => {
  const chamberPackage = await ChamberPackage.findById(req.params.id);

  if (!chamberPackage) {
    return next(new AppError("Chamber package not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Chamber package fetched successfully",
    data: chamberPackage,
  });
});

exports.updateChamberPackage = catchAsync(async (req, res, next) => {
  const { name, price, facture, duration, status,chamberCity } = req.body;
  let imagePath;

  console.log(req.body, "body");
  const chamberPackage = await ChamberPackage.findById(req.params.id);

  if (!chamberPackage) {
    return next(new AppError("Chamber package not found", 404));
  }

  // Validate price if provided
  if (price !== undefined && price < 0) {
    return next(new AppError("Price cannot be negative", 400));
  }

  // Validate duration if provided
  if (duration !== undefined && duration <= 0) {
    return next(new AppError("Duration must be a positive number", 400));
  }

  // Validate facture if provided
  let parsedFacture;
  if (facture) {
    try {
      parsedFacture = JSON.parse(facture);
      if (
        !Array.isArray(parsedFacture) ||
        !parsedFacture.every((item) => typeof item === "string")
      ) {
        return next(new AppError("Facture must be an array of strings", 400));
      }
    } catch (error) {
      return next(new AppError("Invalid facture format", 400));
    }
  }

  const chamberPackageData = {};

  if (name) chamberPackageData.name = name;
  if (price !== undefined) chamberPackageData.price = price;
  if (parsedFacture) chamberPackageData.facture = parsedFacture;
  if (duration !== undefined) chamberPackageData.duration = duration;
  if (status) chamberPackageData.status = status;
  if (chamberCity) chamberPackageData.chamberCity = JSON.parse(chamberCity);

  try {
    // Handle image upload
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imageUrl = `${image.destination}/${image.filename}`;
      chamberPackageData.image = imageUrl;
      imagePath = imageUrl;

      // Delete old image if exists
      if (chamberPackage.image) {
        await deleteOldFiles(chamberPackage.image).catch((err) => {
          console.error("Failed to delete old image:", err);
        });
      }
    }

    const updatedChamberPackage = await ChamberPackage.findByIdAndUpdate(
      req.params.id,
      chamberPackageData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: "Chamber package updated successfully",
      data: updatedChamberPackage,
    });
  } catch (error) {
    // Clean up uploaded image if update fails
    if (imagePath) {
      await deleteOldFiles(imagePath).catch((err) => {
        console.error("Failed to delete image:", err);
      });
    }
    return next(error);
  }
});

exports.deleteChamberPackage = catchAsync(async (req, res, next) => {
  const chamberPackage = await ChamberPackage.findById(req.params.id);

  if (!chamberPackage) {
    return next(new AppError("Chamber package not found", 404));
  }

  // Delete associated image if exists
  if (chamberPackage.image) {
    await deleteOldFiles(chamberPackage.image).catch((err) => {
      console.error("Failed to delete image:", err);
    });
  }

  await ChamberPackage.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Chamber package deleted successfully",
    data: null,
  });
});
