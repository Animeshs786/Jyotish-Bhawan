const mongoose = require("mongoose");
const moment = require("moment-timezone");
const LoveRequest = require("../../../models/loveRequest");
const LoveSchedule = require("../../../models/loveSchedule");
const LoveTransaction = require("../../../models/loveTransaction");
const LovePackage = require("../../../models/lovePackage");
const User = require("../../../models/user");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const pagination = require("../../../utils/pagination");

moment.tz.setDefault("Asia/Kolkata");

// Helper function to generate time slots
const generateTimeSlots = async (schedule, packageDuration) => {
  const slots = [];
  let currentTime = moment(schedule.startTime, "HH:mm");
  const endTime = moment(schedule.endTime, "HH:mm");

  // Generate slots based on package duration
  while (currentTime.isBefore(endTime)) {
    const slotStart = currentTime.format("HH:mm");
    const slotEnd = currentTime.add(packageDuration, "minutes").format("HH:mm");

    // Check if slot is already booked
    const isBooked = await LoveRequest.exists({
      loveSchedule: schedule._id,
      status: "booked",
      startTime: slotStart,
      endTime: slotEnd,
    });

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      available: !isBooked,
    });

    // If slotEnd exceeds endTime, break to avoid invalid slots
    if (moment(slotEnd, "HH:mm").isAfter(endTime)) break;
  }

  return slots;
};

// Get all love requests (admin access)
exports.getAllLoveRequests = catchAsync(async (req, res, next) => {
  const { status, page: currentPage, limit: currentLimit } = req.query;

  let query = {};

  // Filter by status
  if (status) {
    if (!["pending", "booked", "rejected"].includes(status)) {
      return next(new AppError("Invalid status value", 400));
    }
    query.status = status;
  }

  // Pagination
  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    LoveRequest,
    null,
    query
  );

  const requests = await LoveRequest.find(query)
    .populate("user", "name email")
    .populate("loveSchedule", "date startTime endTime")
    .populate("loveTransaction", "amount gstAmount duration expiryDate")
    .populate("loveTransaction.lovePackage", "name duration sellPrice")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Love requests fetched successfully",
    data: requests,
  });
});

// Get love request details with available slots
exports.getLoveRequestDetails = catchAsync(async (req, res, next) => {
  const requestId = req.params.id;

  // Validate ObjectID
  if (!mongoose.isValidObjectId(requestId)) {
    return next(new AppError("Invalid request ID", 400));
  }

  // Fetch request
  const request = await LoveRequest.findById(requestId)
    .populate("user", "name email")
    .populate("loveSchedule", "date startTime endTime")
    .populate("loveTransaction", "amount gstAmount duration expiryDate")
    .populate("loveTransaction.lovePackage", "name duration sellPrice");

  if (!request) {
    return next(new AppError("Love request not found", 404));
  }

  // Generate available slots
  const schedule = await LoveSchedule.findById(request.loveSchedule);
  if (!schedule) {
    return next(new AppError("Associated schedule not found", 404));
  }

  const lovePackage = await LovePackage.findById(
    request.loveTransaction.lovePackage
  );
  if (!lovePackage) {
    return next(new AppError("Associated package not found", 404));
  }

  const slots = await generateTimeSlots(schedule, lovePackage.duration);

  res.status(200).json({
    status: true,
    message: "Love request details fetched successfully",
    data: {
      request,
      slots,
    },
  });
});

// Select or reschedule slot for love request
exports.selectSlotForLoveRequest = catchAsync(async (req, res, next) => {
  const { startTime, endTime, requestId } = req.body;

  // Validate inputs
  if (!startTime || !endTime || !requestId) {
    return next(
      new AppError("startTime, endTime, and requestId are required", 400)
    );
  }
  if (!mongoose.isValidObjectId(requestId)) {
    return next(new AppError("Invalid request ID", 400));
  }

  // Validate time format
  if (
    !moment(startTime, "HH:mm", true).isValid() ||
    !moment(endTime, "HH:mm", true).isValid()
  ) {
    return next(
      new AppError("Invalid time format for startTime or endTime", 400)
    );
  }

  // Fetch request
  const request = await LoveRequest.findById(requestId);
  if (!request) {
    return next(new AppError("Love request not found", 404));
  }

  // Fetch schedule and package
  const schedule = await LoveSchedule.findById(request.loveSchedule);
  if (!schedule || !schedule.isAvailable) {
    return next(new AppError("Schedule not found or not available", 404));
  }

  const lovePackage = await LovePackage.findById(
    request.loveTransaction.lovePackage
  );
  if (!lovePackage) {
    return next(new AppError("Love package not found", 404));
  }

  // Validate slot
  const slots = await generateTimeSlots(schedule, lovePackage.duration);
  const selectedSlot = slots.find(
    (slot) =>
      slot.startTime === startTime && slot.endTime === endTime && slot.available
  );

  if (!selectedSlot) {
    return next(new AppError("Selected slot is not available or invalid", 400));
  }

  // Validate slot is within schedule times
  const scheduleStart = moment.tz(
    `${schedule.date.toISOString().split("T")[0]} ${schedule.startTime}`,
    "YYYY-MM-DD HH:mm",
    "Asia/Kolkata"
  );
  const scheduleEnd = moment.tz(
    `${schedule.date.toISOString().split("T")[0]} ${schedule.endTime}`,
    "YYYY-MM-DD HH:mm",
    "Asia/Kolkata"
  );
  const slotStart = moment.tz(
    `${schedule.date.toISOString().split("T")[0]} ${startTime}`,
    "YYYY-MM-DD HH:mm",
    "Asia/Kolkata"
  );
  const slotEnd = moment.tz(
    `${schedule.date.toISOString().split("T")[0]} ${endTime}`,
    "YYYY-MM-DD HH:mm",
    "Asia/Kolkata"
  );

  if (slotStart.isBefore(scheduleStart) || slotEnd.isAfter(scheduleEnd)) {
    return next(
      new AppError("Selected slot is outside the schedule's time range", 400)
    );
  }

  // Update request
  request.startTime = startTime;
  request.endTime = endTime;
  request.status = "booked";
  await request.save();

  // Populate the updated request
  const populatedRequest = await LoveRequest.findById(requestId)
    .populate("user", "name email")
    .populate("loveSchedule", "date startTime endTime")
    .populate("loveTransaction", "amount gstAmount duration expiryDate")
    .populate("loveTransaction.lovePackage", "name duration sellPrice");

  res.status(200).json({
    status: true,
    message: "Slot selected successfully for love request",
    data: populatedRequest,
  });
});

// Reset slot for love request and optionally reschedule
exports.resetSlotForLoveRequest = catchAsync(async (req, res, next) => {
  const { newStartTime, newEndTime, requestId } = req.body;

  // Validate ObjectID
  if (!mongoose.isValidObjectId(requestId)) {
    return next(new AppError("Invalid request ID", 400));
  }

  // Fetch request
  const request = await LoveRequest.findById(requestId);
  if (!request) {
    return next(new AppError("Love request not found", 404));
  }

  if (request.status !== "booked") {
    return next(new AppError("Only booked requests can be reset", 400));
  }

  // Fetch schedule and package
  const schedule = await LoveSchedule.findById(request.loveSchedule);
  if (!schedule || !schedule.isAvailable) {
    return next(new AppError("Schedule not found or not available", 404));
  }

  const lovePackage = await LovePackage.findById(
    request.loveTransaction.lovePackage
  );
  if (!lovePackage) {
    return next(new AppError("Love package not found", 404));
  }

  // Reset slot
  request.startTime = "";
  request.endTime = "";
  request.status = "pending";

  // Reschedule if new slot provided
  if (newStartTime && newEndTime) {
    if (
      !moment(newStartTime, "HH:mm", true).isValid() ||
      !moment(newEndTime, "HH:mm", true).isValid()
    ) {
      return next(
        new AppError("Invalid time format for newStartTime or newEndTime", 400)
      );
    }

    const slots = await generateTimeSlots(schedule, lovePackage.duration);
    const newSlot = slots.find(
      (slot) =>
        slot.startTime === newStartTime &&
        slot.endTime === newEndTime &&
        slot.available
    );

    if (!newSlot) {
      return next(
        new AppError("Selected new slot is not available or invalid", 400)
      );
    }

    // Validate new slot is within schedule times
    const scheduleStart = moment.tz(
      `${schedule.date.toISOString().split("T")[0]} ${schedule.startTime}`,
      "YYYY-MM-DD HH:mm",
      "Asia/Kolkata"
    );
    const scheduleEnd = moment.tz(
      `${schedule.date.toISOString().split("T")[0]} ${schedule.endTime}`,
      "YYYY-MM-DD HH:mm",
      "Asia/Kolkata"
    );
    const slotStart = moment.tz(
      `${schedule.date.toISOString().split("T")[0]} ${newStartTime}`,
      "YYYY-MM-DD HH:mm",
      "Asia/Kolkata"
    );
    const slotEnd = moment.tz(
      `${schedule.date.toISOString().split("T")[0]} ${newEndTime}`,
      "YYYY-MM-DD HH:mm",
      "Asia/Kolkata"
    );

    if (slotStart.isBefore(scheduleStart) || slotEnd.isAfter(scheduleEnd)) {
      return next(
        new AppError(
          "Selected new slot is outside the schedule's time range",
          400
        )
      );
    }

    request.startTime = newStartTime;
    request.endTime = newEndTime;
    request.status = "booked";
  }

  await request.save();

  // Populate the updated request
  const populatedRequest = await LoveRequest.findById(requestId)
    .populate("user", "name email")
    .populate("loveSchedule", "date startTime endTime")
    .populate("loveTransaction", "amount gstAmount duration expiryDate")
    .populate("loveTransaction.lovePackage", "name duration sellPrice");

  res.status(200).json({
    status: true,
    message: newStartTime
      ? "Slot reset and rescheduled successfully"
      : "Slot reset successfully",
    data: populatedRequest,
  });
});
