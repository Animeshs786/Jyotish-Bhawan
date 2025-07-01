const mongoose = require("mongoose");
const moment = require("moment-timezone");
const LoveSchedule = require("../../../models/loveSchedule");
const LovePackage = require("../../../models/lovePackage");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const pagination = require("../../../utils/pagination");

moment.tz.setDefault("Asia/Kolkata");

// Validate time format (HH:mm)
const validateTimeFormat = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Validate endTime is after startTime
const isEndTimeAfterStartTime = (startTime, endTime, date) => {
  const start = moment.tz(
    `${date.toISOString().split("T")[0]} ${startTime}`,
    "YYYY-MM-DD HH:mm",
    "Asia/Kolkata"
  );
  const end = moment.tz(
    `${date.toISOString().split("T")[0]} ${endTime}`,
    "YYYY-MM-DD HH:mm",
    "Asia/Kolkata"
  );
  return end.isAfter(start);
};

// Create a new love schedule
exports.createLoveSchedule = catchAsync(async (req, res, next) => {
  const { lovePackage, date, startTime, endTime, isAvailable } = req.body;

  // Validate required fields
  if (!lovePackage || !date || !startTime || !endTime) {
    return next(
      new AppError(
        "LovePackage, date, startTime, and endTime are required",
        400
      )
    );
  }

  // Validate ObjectID
  if (!mongoose.isValidObjectId(lovePackage)) {
    return next(new AppError("Invalid love package ID", 400));
  }

  // Validate love package
  const packageExists = await LovePackage.findById(lovePackage);
  if (!packageExists || !packageExists.status) {
    return next(new AppError("Love package not found or not active", 404));
  }

  // Validate date format
  const parsedDate = moment(date, moment.ISO_8601, true);
  if (!parsedDate.isValid()) {
    return next(new AppError("Invalid date format", 400));
  }

  // Validate time formats
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    return next(
      new AppError(
        "startTime and endTime must be in HH:mm format (e.g., 14:30)",
        400
      )
    );
  }

  // Validate endTime is after startTime
  if (!isEndTimeAfterStartTime(startTime, endTime, parsedDate)) {
    return next(new AppError("endTime must be after startTime", 400));
  }

  // Check for duplicate schedule
  const checkDate = parsedDate.startOf("day").utc().toDate();
  const existingSchedule = await LoveSchedule.findOne({
    lovePackage,
    date: checkDate,
    startTime,
    endTime,
  });
  if (existingSchedule) {
    return next(
      new AppError(
        "A schedule already exists for this package, date, and time",
        400
      )
    );
  }

  // Prepare schedule data
  const scheduleData = {
    lovePackage,
    date: parsedDate.toDate(),
    startTime,
    endTime,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
  };

  try {
    const newSchedule = await LoveSchedule.create(scheduleData);

    // Populate references for response
    await newSchedule.populate("lovePackage", "name price");

    res.status(201).json({
      status: true,
      message: "Love schedule created successfully",
      data: newSchedule,
    });
  } catch (error) {
    return next(
      new AppError(`Failed to create schedule: ${error.message}`, 500)
    );
  }
});

// Get all love schedules
exports.getAllLoveSchedules = catchAsync(async (req, res, next) => {
  const {
    search,
    lovePackage,
    page: currentPage,
    limit: currentLimit,
  } = req.query;

  // Get current date and time in Asia/Kolkata
  const now = moment().tz("Asia/Kolkata");

  // Filter schedules to exclude past dates and times
  const startOfTodayUTC = now.clone().startOf("day").utc().toDate();
  const currentTime = now.format("HH:mm");

  let query = {
    $or: [
      { date: { $gt: startOfTodayUTC } }, // Future dates
      {
        date: startOfTodayUTC,
        endTime: { $gt: currentTime }, // Today, with endTime after current time
      },
    ],
  };

  // Filter by isAvailable
  if (search) {
    if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
      query.isAvailable = search.toLowerCase() === "true";
    } else {
      return next(
        new AppError("Search parameter must be 'true' or 'false'", 400)
      );
    }
  }

  // Filter by lovePackage
  if (lovePackage) {
    if (!mongoose.isValidObjectId(lovePackage)) {
      return next(new AppError("Invalid love package ID", 400));
    }
    query.lovePackage = lovePackage;
  }

  // Pagination
  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    LoveSchedule,
    null,
    query
  );

  const schedules = await LoveSchedule.find(query)
    .populate("lovePackage", "name price")
    .sort({ date: 1, startTime: 1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Love schedules fetched successfully",
    data: schedules,
  });
});

// Get a single love schedule
exports.getLoveSchedule = catchAsync(async (req, res, next) => {
  const scheduleId = req.params.id;

  if (!mongoose.isValidObjectId(scheduleId)) {
    return next(new AppError("Invalid schedule ID", 400));
  }

  const schedule = await LoveSchedule.findById(scheduleId).populate(
    "lovePackage",
    "name price"
  );

  if (!schedule) {
    return next(new AppError("Love schedule not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Love schedule fetched successfully",
    data: schedule,
  });
});

// Update a love schedule
exports.updateLoveSchedule = catchAsync(async (req, res, next) => {
  const { lovePackage, date, startTime, endTime, isAvailable } = req.body;
  const scheduleId = req.params.id;

  if (!mongoose.isValidObjectId(scheduleId)) {
    return next(new AppError("Invalid schedule ID", 400));
  }

  const schedule = await LoveSchedule.findById(scheduleId);
  if (!schedule) {
    return next(new AppError("Love schedule not found", 404));
  }

  // Validate love package if provided
  if (lovePackage) {
    if (!mongoose.isValidObjectId(lovePackage)) {
      return next(new AppError("Invalid love package ID", 400));
    }
    const packageExists = await LovePackage.findById(lovePackage);
    if (!packageExists || !packageExists.status) {
      return next(new AppError("Love package not found or not active", 404));
    }
  }

  // Validate date format if provided
  let checkDate;
  if (date) {
    const parsedDate = moment(date, moment.ISO_8601, true);
    if (!parsedDate.isValid()) {
      return next(new AppError("Invalid date format", 400));
    }
    checkDate = parsedDate.startOf("day").utc().toDate();
  }

  // Validate time formats if provided
  if (startTime && !validateTimeFormat(startTime)) {
    return next(
      new AppError("startTime must be in HH:mm format (e.g., 14:30)", 400)
    );
  }
  if (endTime && !validateTimeFormat(endTime)) {
    return next(
      new AppError("endTime must be in HH:mm format (e.g., 14:30)", 400)
    );
  }

  // Validate endTime is after startTime if both are provided
  if (startTime && endTime && date) {
    if (!isEndTimeAfterStartTime(startTime, endTime, new Date(date))) {
      return next(new AppError("endTime must be after startTime", 400));
    }
  } else if (startTime && endTime && !date) {
    if (!isEndTimeAfterStartTime(startTime, endTime, schedule.date)) {
      return next(new AppError("endTime must be after startTime", 400));
    }
  }

  // Check for duplicate schedule if updating relevant fields
  if (lovePackage || date || startTime || endTime) {
    const checkLovePackage = lovePackage || schedule.lovePackage;
    const checkDateValue = date
      ? checkDate
      : moment(schedule.date).startOf("day").utc().toDate();
    const checkStartTime = startTime || schedule.startTime;
    const checkEndTime = endTime || schedule.endTime;

    const existingSchedule = await LoveSchedule.findOne({
      lovePackage: checkLovePackage,
      date: checkDateValue,
      startTime: checkStartTime,
      endTime: checkEndTime,
      _id: { $ne: scheduleId },
    });

    if (existingSchedule) {
      return next(
        new AppError(
          "A schedule already exists for this package, date, and time",
          400
        )
      );
    }
  }

  // Prepare update data
  const scheduleData = {};
  if (lovePackage) scheduleData.lovePackage = lovePackage;
  if (date) scheduleData.date = checkDate;
  if (startTime) scheduleData.startTime = startTime;
  if (endTime) scheduleData.endTime = endTime;
  if (isAvailable !== undefined) scheduleData.isAvailable = isAvailable;

  try {
    const updatedSchedule = await LoveSchedule.findByIdAndUpdate(
      scheduleId,
      scheduleData,
      { new: true, runValidators: true }
    ).populate("lovePackage", "name price");

    if (!updatedSchedule) {
      return next(new AppError("Love schedule not found", 404));
    }

    res.status(200).json({
      status: true,
      message: "Love schedule updated successfully",
      data: updatedSchedule,
    });
  } catch (error) {
    return next(
      new AppError(`Failed to update schedule: ${error.message}`, 500)
    );
  }
});

// Delete a love schedule
exports.deleteLoveSchedule = catchAsync(async (req, res, next) => {
  const scheduleId = req.params.id;

  if (!mongoose.isValidObjectId(scheduleId)) {
    return next(new AppError("Invalid schedule ID", 400));
  }

  const schedule = await LoveSchedule.findById(scheduleId);
  if (!schedule) {
    return next(new AppError("Love schedule not found", 404));
  }

  await LoveSchedule.findByIdAndDelete(scheduleId);

  res.status(200).json({
    status: true,
    message: "Love schedule deleted successfully",
    data: null,
  });
});
