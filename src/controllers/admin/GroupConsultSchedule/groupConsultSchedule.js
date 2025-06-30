const mongoose = require("mongoose");
const moment = require("moment-timezone");
const GroupConsultSchedule = require("../../../models/groupConsultSchedule");
const ConsultationPackage = require("../../../models/consultationPackage");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

moment.tz.setDefault("Asia/Kolkata");

// Create a new group consultation schedule
exports.createGroupConsultSchedule = catchAsync(async (req, res, next) => {
  const { consultationPackage, date, cityName, isAvailable } = req.body;

  // Validate required fields
  if (!consultationPackage || !date || !cityName) {
    return next(
      new AppError("ConsultationPackage, date, and cityName are required", 400)
    );
  }

  // Validate ObjectID
  if (!mongoose.isValidObjectId(consultationPackage)) {
    return next(new AppError("Invalid consultation package ID", 400));
  }

  // Validate consultation package
  const packageExists = await ConsultationPackage.findById(consultationPackage);
  if (!packageExists || !packageExists.status) {
    return next(
      new AppError("Consultation package not found or not active", 404)
    );
  }

  // Validate date format
  const parsedDate = moment(date, moment.ISO_8601, true);
  if (!parsedDate.isValid()) {
    return next(new AppError("Invalid date format", 400));
  }

  // Check for duplicate schedule
  const checkDate = parsedDate.startOf("day").toDate(); // Normalize to start of day
  const existingSchedule = await GroupConsultSchedule.findOne({
    consultationPackage,
    date: checkDate,
    cityName,
  });
  if (existingSchedule) {
    return next(
      new AppError(
        "A schedule already exists for this package, date, and city",
        400
      )
    );
  }

  // Prepare schedule data
  const scheduleData = {
    consultationPackage,
    date: parsedDate.toDate(),
    cityName,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
  };

  try {
    const newSchedule = await GroupConsultSchedule.create(scheduleData);

    // Populate references for response
    await newSchedule.populate(
      "consultationPackage",
      "name duration sellPrice"
    );

    res.status(201).json({
      status: true,
      message: "Group consultation schedule created successfully",
      data: newSchedule,
    });
  } catch (error) {
    return next(
      new AppError(`Failed to create schedule: ${error.message}`, 500)
    );
  }
});

// Get all group consultation schedules
exports.getAllGroupConsultSchedules = catchAsync(async (req, res, next) => {
  const {
    search,
    page: currentPage,
    limit: currentLimit,
    consultationPackage,
  } = req.query;

  let query = {};

  // Filter by isAvailable
  if (search) {
    if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
      query.isAvailable = search.toLowerCase() === "true";
    }
  }

  // Filter by consultationPackage
  if (consultationPackage) {
    if (!mongoose.isValidObjectId(consultationPackage)) {
      return next(new AppError("Invalid consultation package ID", 400));
    }
    query.consultationPackage = consultationPackage;
  }

  // Pagination
  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    GroupConsultSchedule,
    null,
    query
  );

  const schedules = await GroupConsultSchedule.find(query)
    .populate("consultationPackage", "name duration sellPrice")
    .sort({ date: 1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Group consultation schedules fetched successfully",
    data: schedules,
  });
});

// Get a single group consultation schedule
exports.getGroupConsultSchedule = catchAsync(async (req, res, next) => {
  const scheduleId = req.params.id;

  if (!mongoose.isValidObjectId(scheduleId)) {
    return next(new AppError("Invalid schedule ID", 400));
  }

  const schedule = await GroupConsultSchedule.findById(scheduleId).populate(
    "consultationPackage",
    "name duration sellPrice"
  );

  if (!schedule) {
    return next(new AppError("Group consultation schedule not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Group consultation schedule fetched successfully",
    data: schedule,
  });
});

// Update a group consultation schedule
exports.updateGroupConsultSchedule = catchAsync(async (req, res, next) => {
  const { consultationPackage, date, cityName, isAvailable } = req.body;
  const scheduleId = req.params.id;

  if (!mongoose.isValidObjectId(scheduleId)) {
    return next(new AppError("Invalid schedule ID", 400));
  }

  const schedule = await GroupConsultSchedule.findById(scheduleId);
  if (!schedule) {
    return next(new AppError("Group consultation schedule not found", 404));
  }

  // Validate consultation package if provided
  if (consultationPackage) {
    if (!mongoose.isValidObjectId(consultationPackage)) {
      return next(new AppError("Invalid consultation package ID", 400));
    }
    const packageExists = await ConsultationPackage.findById(
      consultationPackage
    );
    if (!packageExists || !packageExists.status) {
      return next(
        new AppError("Consultation package not found or not active", 404)
      );
    }
  }

  // Validate date format if provided
  let checkDate;
  if (date) {
    const parsedDate = moment(date, moment.ISO_8601, true);
    if (!parsedDate.isValid()) {
      return next(new AppError("Invalid date format", 400));
    }
    checkDate = parsedDate.startOf("day").toDate();
  }

  // Check for duplicate schedule if updating relevant fields
  if (consultationPackage || date || cityName) {
    const checkConsultationPackage =
      consultationPackage || schedule.consultationPackage;
    const checkDateValue = date
      ? checkDate
      : moment(schedule.date).startOf("day").toDate();
    const checkCityName = cityName || schedule.cityName;

    const existingSchedule = await GroupConsultSchedule.findOne({
      consultationPackage: checkConsultationPackage,
      date: checkDateValue,
      cityName: checkCityName,
      _id: { $ne: scheduleId },
    });

    if (existingSchedule) {
      return next(
        new AppError(
          "A schedule already exists for this package, date, and city",
          400
        )
      );
    }
  }

  // Prepare update data
  const scheduleData = {};
  if (consultationPackage)
    scheduleData.consultationPackage = consultationPackage;
  if (date) scheduleData.date = checkDate;
  if (cityName) scheduleData.cityName = cityName;
  if (isAvailable !== undefined) scheduleData.isAvailable = isAvailable;

  try {
    const updatedSchedule = await GroupConsultSchedule.findByIdAndUpdate(
      scheduleId,
      scheduleData,
      { new: true, runValidators: true }
    ).populate("consultationPackage", "name duration sellPrice");

    if (!updatedSchedule) {
      return next(new AppError("Group consultation schedule not found", 404));
    }

    res.status(200).json({
      status: true,
      message: "Group consultation schedule updated successfully",
      data: updatedSchedule,
    });
  } catch (error) {
    return next(
      new AppError(`Failed to update schedule: ${error.message}`, 500)
    );
  }
});

// Delete a group consultation schedule
exports.deleteGroupConsultSchedule = catchAsync(async (req, res, next) => {
  const scheduleId = req.params.id;

  if (!mongoose.isValidObjectId(scheduleId)) {
    return next(new AppError("Invalid schedule ID", 400));
  }

  const schedule = await GroupConsultSchedule.findById(scheduleId);
  if (!schedule) {
    return next(new AppError("Group consultation schedule not found", 404));
  }

  await GroupConsultSchedule.findByIdAndDelete(scheduleId);

  res.status(200).json({
    status: true,
    message: "Group consultation schedule deleted successfully",
    data: null,
  });
});
