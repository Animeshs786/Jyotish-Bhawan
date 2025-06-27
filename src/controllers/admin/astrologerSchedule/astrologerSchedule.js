const AstrologerSchedule = require("../../../models/astrologerSchedule");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

const validateTimeFormat = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

const isEndTimeAfterStartTime = (startTime, endTime, date) => {
  const start = new Date(`${date.toISOString().split("T")[0]}T${startTime}:00`);
  const end = new Date(`${date.toISOString().split("T")[0]}T${endTime}:00`);
  return end > start;
};

exports.createAstrologerSchedule = catchAsync(async (req, res, next) => {
  const {
    consultationPackage,
    astrologer,
    date,
    startTime,
    endTime,
    isAvailable,
  } = req.body;

  // Validate required fields
  if (!consultationPackage || !astrologer || !date || !startTime || !endTime) {
    return next(
      new AppError(
        "ConsultationPackage, astrologer, date, startTime, and endTime are required",
        400
      )
    );
  }

  // Validate time formats
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    return next(
      new AppError(
        "startTime and endTime must be in HH:MM format (e.g., 14:30)",
        400
      )
    );
  }

  // Validate endTime is after startTime
  if (!isEndTimeAfterStartTime(startTime, endTime, new Date(date))) {
    return next(new AppError("endTime must be after startTime", 400));
  }

  // Check for duplicate schedule
  const existingSchedule = await AstrologerSchedule.findOne({
    consultationPackage,
    astrologer,
    date: new Date(date).setHours(0, 0, 0, 0),
    startTime,
    endTime,
  });
  if (existingSchedule) {
    return next(
      new AppError(
        "A schedule already exists for this astrologer, package, date, and time",
        400
      )
    );
  }

  const scheduleData = {
    consultationPackage,
    astrologer,
    date: new Date(date),
    startTime,
    endTime,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
  };

  try {
    const newSchedule = await AstrologerSchedule.create(scheduleData);

    // Populate references for response
    await newSchedule.populate("consultationPackage astrologer");

    res.status(201).json({
      status: true,
      message: "Astrologer schedule created successfully",
      data: newSchedule,
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllAstrologerSchedules = catchAsync(async (req, res, next) => {
  const {
    search,
    page: currentPage,
    limit: currentLimit,
    consultationPackage,
    astrologer,
  } = req.query;

  let query = {};

  if (search) {
    query.$or = [
      {
        isAvailable:
          search.toLowerCase() === "true" || search.toLowerCase() === "false"
            ? search.toLowerCase() === "true"
            : undefined,
      },
    ].filter(Boolean);
  }

  if (astrologer) query.astrologer = astrologer;
  if (consultationPackage) query.consultationPackage = consultationPackage;

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    AstrologerSchedule,
    null,
    query
  );

  const schedules = await AstrologerSchedule.find(query)
    .sort({ date: 1, startTime: 1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Astrologer schedules fetched successfully",
    data: schedules,
  });
});

exports.getAstrologerSchedule = catchAsync(async (req, res, next) => {
  const schedule = await AstrologerSchedule.findById(req.params.id).populate(
    "consultationPackage astrologer"
  );

  if (!schedule) {
    return next(new AppError("Astrologer schedule not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Astrologer schedule fetched successfully",
    data: schedule,
  });
});

exports.updateAstrologerSchedule = catchAsync(async (req, res, next) => {
  const {
    consultationPackage,
    astrologer,
    date,
    startTime,
    endTime,
    isAvailable,
  } = req.body;

  const schedule = await AstrologerSchedule.findById(req.params.id);

  if (!schedule) {
    return next(new AppError("Astrologer schedule not found", 404));
  }

  // Validate time formats if provided
  if (startTime && !validateTimeFormat(startTime)) {
    return next(
      new AppError("startTime must be in HH:MM format (e.g., 14:30)", 400)
    );
  }
  if (endTime && !validateTimeFormat(endTime)) {
    return next(
      new AppError("endTime must be in HH:MM format (e.g., 14:30)", 400)
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
  if (consultationPackage || astrologer || date || startTime || endTime) {
    const checkConsultationPackage =
      consultationPackage || schedule.consultationPackage;
    const checkAstrologer = astrologer || schedule.astrologer;
    const checkDate = date
      ? new Date(date).setHours(0, 0, 0, 0)
      : schedule.date.setHours(0, 0, 0, 0);
    const checkStartTime = startTime || schedule.startTime;
    const checkEndTime = endTime || schedule.endTime;

    const existingSchedule = await AstrologerSchedule.findOne({
      consultationPackage: checkConsultationPackage,
      astrologer: checkAstrologer,
      date: checkDate,
      startTime: checkStartTime,
      endTime: checkEndTime,
      _id: { $ne: req.params.id },
    });

    if (existingSchedule) {
      return next(
        new AppError(
          "A schedule already exists for this astrologer, package, date, and time",
          400
        )
      );
    }
  }

  const scheduleData = {};

  if (consultationPackage)
    scheduleData.consultationPackage = consultationPackage;
  if (astrologer) scheduleData.astrologer = astrologer;
  if (date) scheduleData.date = new Date(date);
  if (startTime) scheduleData.startTime = startTime;
  if (endTime) scheduleData.endTime = endTime;
  if (isAvailable !== undefined) scheduleData.isAvailable = isAvailable;

  try {
    const updatedSchedule = await AstrologerSchedule.findByIdAndUpdate(
      req.params.id,
      scheduleData,
      { new: true, runValidators: true }
    ).populate("consultationPackage astrologer");

    res.status(200).json({
      status: true,
      message: "Astrologer schedule updated successfully",
      data: updatedSchedule,
    });
  } catch (error) {
    return next(error);
  }
});

exports.deleteAstrologerSchedule = catchAsync(async (req, res, next) => {
  const schedule = await AstrologerSchedule.findById(req.params.id);

  if (!schedule) {
    return next(new AppError("Astrologer schedule not found", 404));
  }

  await AstrologerSchedule.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Astrologer schedule deleted successfully",
    data: null,
  });
});
