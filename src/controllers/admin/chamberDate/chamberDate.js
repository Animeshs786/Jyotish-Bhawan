 // Adjust path to your ChamberCity model
const ChamberCity = require("../../../models/chamberCity");
const ChamberDate = require("../../../models/ChamberDate");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.createChamberDate = catchAsync(async (req, res, next) => {
  const { date, chamberCity } = req.body;

  console.log(req.body, "body");

  // Validate required fields
  if (!date || !chamberCity) {
    return next(new AppError("Date and chamber city are required", 400));
  }

  // Validate date format
  if (isNaN(new Date(date).getTime())) {
    return next(new AppError("Invalid date format", 400));
  }

  // Check if chamberCity exists
  const existingCity = await ChamberCity.findById(chamberCity);
  if (!existingCity) {
    return next(new AppError("Chamber city not found", 404));
  }

  // Check for duplicate date for the same chamber city
  const existingDate = await ChamberDate.findOne({
    date: new Date(date).setHours(0, 0, 0, 0), // Normalize to start of day
    chamberCity,
  });
  if (existingDate) {
    return next(new AppError("Date already exists for this chamber city", 400));
  }

  const chamberDateData = {
    date: new Date(date),
    chamberCity,
  };

  try {
    const newChamberDate = await ChamberDate.create(chamberDateData);

    res.status(201).json({
      status: true,
      message: "Chamber date created successfully",
      data: newChamberDate,
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllChamberDates = catchAsync(async (req, res) => {
  const {
    search,
    page: currentPage,
    limit: currentLimit,
    chamberCityId,
  } = req.query;

  let query = {};

  // Filter by chamberCity if provided
  if (chamberCityId) {
    query.chamberCity = chamberCityId;
  }

  // Search by date (partial match on date string)
  if (search) {
    const dateRegex = new RegExp(search, "i");
    query.date = { $regex: dateRegex };
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    ChamberDate,
    null,
    query
  );

  const chamberDates = await ChamberDate.find(query)
    .populate("chamberCity", "name")
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Chamber dates fetched successfully",
    data: chamberDates,
  });
});

exports.getChamberDate = catchAsync(async (req, res, next) => {
  const chamberDate = await ChamberDate.findById(req.params.id).populate(
    "chamberCity",
    "name"
  );

  if (!chamberDate) {
    return next(new AppError("Chamber date not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Chamber date fetched successfully",
    data: chamberDate,
  });
});

exports.updateChamberDate = catchAsync(async (req, res, next) => {
  const { date, chamberCity } = req.body;

  console.log(req.body, "body");
  const chamberDate = await ChamberDate.findById(req.params.id);

  if (!chamberDate) {
    return next(new AppError("Chamber date not found", 404));
  }

  // Validate date format if provided
  if (date && isNaN(new Date(date).getTime())) {
    return next(new AppError("Invalid date format", 400));
  }

  // Check if chamberCity exists if provided
  if (chamberCity) {
    const existingCity = await ChamberCity.findById(chamberCity);
    if (!existingCity) {
      return next(new AppError("Chamber city not found", 404));
    }
  }

  // Check for duplicate date for the same chamber city (excluding current record)
  if (date && chamberCity) {
    const existingDate = await ChamberDate.findOne({
      date: new Date(date).setHours(0, 0, 0, 0),
      chamberCity,
      _id: { $ne: req.params.id },
    });
    if (existingDate) {
      return next(
        new AppError("Date already exists for this chamber city", 400)
      );
    }
  } else if (date) {
    const existingDate = await ChamberDate.findOne({
      date: new Date(date).setHours(0, 0, 0, 0),
      chamberCity: chamberDate.chamberCity,
      _id: { $ne: req.params.id },
    });
    if (existingDate) {
      return next(
        new AppError("Date already exists for this chamber city", 400)
      );
    }
  } else if (chamberCity) {
    const existingDate = await ChamberDate.findOne({
      date: chamberDate.date,
      chamberCity,
      _id: { $ne: req.params.id },
    });
    if (existingDate) {
      return next(
        new AppError("Date already exists for this chamber city", 400)
      );
    }
  }

  const chamberDateData = {};

  if (date) chamberDateData.date = new Date(date);
  if (chamberCity) chamberDateData.chamberCity = chamberCity;

  try {
    const updatedChamberDate = await ChamberDate.findByIdAndUpdate(
      req.params.id,
      chamberDateData,
      { new: true, runValidators: true }
    ).populate("chamberCity", "name");

    res.status(200).json({
      status: true,
      message: "Chamber date updated successfully",
      data: updatedChamberDate,
    });
  } catch (error) {
    return next(error);
  }
});

exports.deleteChamberDate = catchAsync(async (req, res, next) => {
  const chamberDate = await ChamberDate.findById(req.params.id);

  if (!chamberDate) {
    return next(new AppError("Chamber date not found", 404));
  }

  await ChamberDate.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Chamber date deleted successfully",
    data: null,
  });
});
