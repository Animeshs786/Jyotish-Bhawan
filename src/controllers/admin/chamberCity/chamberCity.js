const ChamberCity = require("../../../models/chamberCity"); // Adjust path to your ChamberCity model
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

exports.createChamberCity = catchAsync(async (req, res, next) => {
  const { name, status } = req.body;
  let imagePath;

  console.log(req.body, "body");

  // Validate required fields
  if (!name) {
    return next(new AppError("Name is required", 400));
  }

  // Check for duplicate city name
  const existingCity = await ChamberCity.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
  });
  if (existingCity) {
    return next(new AppError("City name must be unique", 400));
  }

  const chamberCityData = {
    name,
    status: status !== undefined ? status : true,
  };

  try {
    // Handle image upload
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imageUrl = `${image.destination}/${image.filename}`;
      chamberCityData.image = imageUrl;
      imagePath = imageUrl;
    } else {
      return next(new AppError("Image is required", 400));
    }

    const newChamberCity = await ChamberCity.create(chamberCityData);

    res.status(201).json({
      status: true,
      message: "Chamber city created successfully",
      data: newChamberCity,
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

exports.getAllChamberCities = catchAsync(async (req, res) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;

  let query = {};

  // Search by name
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    ChamberCity,
    null,
    query
  );

  const chamberCities = await ChamberCity.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Chamber cities fetched successfully",
    data: chamberCities,
  });
});

exports.getChamberCity = catchAsync(async (req, res, next) => {
  const chamberCity = await ChamberCity.findById(req.params.id);

  if (!chamberCity) {
    return next(new AppError("Chamber city not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Chamber city fetched successfully",
    data: chamberCity,
  });
});

exports.updateChamberCity = catchAsync(async (req, res, next) => {
  const { name, status } = req.body;
  let imagePath;

  console.log(req.body, "body");
  const chamberCity = await ChamberCity.findById(req.params.id);

  if (!chamberCity) {
    return next(new AppError("Chamber city not found", 404));
  }

  // Check for duplicate city name (excluding current city)
  if (name && name !== chamberCity.name) {
    const existingCity = await ChamberCity.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      _id: { $ne: req.params.id },
    });
    if (existingCity) {
      return next(new AppError("City name must be unique", 400));
    }
  }

  const chamberCityData = {};

  if (name) chamberCityData.name = name;
  if (status !== undefined) chamberCityData.status = status;

  try {
    // Handle image upload
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imageUrl = `${image.destination}/${image.filename}`;
      chamberCityData.image = imageUrl;
      imagePath = imageUrl;

      // Delete old image if exists
      if (chamberCity.image) {
        await deleteOldFiles(chamberCity.image).catch((err) => {
          console.error("Failed to delete old image:", err);
        });
      }
    }

    const updatedChamberCity = await ChamberCity.findByIdAndUpdate(
      req.params.id,
      chamberCityData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: "Chamber city updated successfully",
      data: updatedChamberCity,
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

exports.deleteChamberCity = catchAsync(async (req, res, next) => {
  const chamberCity = await ChamberCity.findById(req.params.id);

  if (!chamberCity) {
    return next(new AppError("Chamber city not found", 404));
  }

  // Delete associated image if exists
  if (chamberCity.image) {
    await deleteOldFiles(chamberCity.image).catch((err) => {
      console.error("Failed to delete image:", err);
    });
  }

  await ChamberCity.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Chamber city deleted successfully",
    data: null,
  });
});