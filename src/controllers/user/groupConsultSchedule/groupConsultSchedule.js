const mongoose = require("mongoose");
const moment = require("moment-timezone");
const GroupConsultSchedule = require("../../../models/groupConsultSchedule");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const pagination = require("../../../utils/pagination");

moment.tz.setDefault("Asia/Kolkata");

// Get all group consultation schedules
exports.getAllGroupSchedules = catchAsync(async (req, res, next) => {
  const {
    search,
    consultationPackage,
    page: currentPage,
    limit: currentLimit,
  } = req.query;

  // Get current date in Asia/Kolkata
  const now = moment().tz("Asia/Kolkata");

  // Filter schedules to exclude past dates
  const startOfTodayUTC = now.clone().startOf("day").utc().toDate();

  let query = {
    date: { $gte: startOfTodayUTC }, // Only include today or future dates
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
