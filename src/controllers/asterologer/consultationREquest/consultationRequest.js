const mongoose = require("mongoose");
const moment = require("moment-timezone");
const ConsultationRequest = require("../../../models/consultationRequest");
const ConsultationPackage = require("../../../models/consultationPackage");
const AstrologerSchedule = require("../../../models/astrologerSchedule");
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
    const isBooked = await ConsultationRequest.exists({
      astrologer: schedule.astrologer,
      astrologerSchedule: schedule._id,
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

// Get all consultation requests for an astrologer
exports.getAllConsultationRequests = catchAsync(async (req, res, next) => {
  const { status, page: currentPage, limit: currentLimit } = req.query;
  const astrologerId = req.user._id; // Assumes astrologer is authenticated

  let query = { astrologer: astrologerId };

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
    ConsultationRequest,
    null,
    query
  );

  const requests = await ConsultationRequest.find(query)
    .populate("user")
    .populate("astrologer")
    .populate("astrologerSchedule", "date startTime endTime")
    .populate("consultationPackage", "name duration sellPrice")
    .populate(
      "consoutationTransaction",
      "amount gstAmount duration expiryDate customerDetail"
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Consultation requests fetched successfully",
    data: requests,
  });
});

// Get consultation request details with available slots
exports.getConsultationRequestDetails = catchAsync(async (req, res, next) => {
  const requestId = req.params.id;
  const astrologerId = req.user._id; // Assumes astrologer is authenticated

  // Validate ObjectID
  if (!mongoose.isValidObjectId(requestId)) {
    return next(new AppError("Invalid request ID", 400));
  }

  // Fetch request
  const request = await ConsultationRequest.findOne({
    _id: requestId,
    astrologer: astrologerId,
  })
    .populate("user")
    .populate("astrologer")
    .populate("astrologerSchedule", "date startTime endTime")
    .populate("consultationPackage", "name duration sellPrice")
    .populate(
      "consoutationTransaction",
      "amount gstAmount duration expiryDate customerDetail"
    );

  if (!request) {
    return next(
      new AppError("Consultation request not found or not authorized", 404)
    );
  }

  // Generate available slots
  const schedule = await AstrologerSchedule.findById(
    request.astrologerSchedule
  );
  if (!schedule) {
    return next(new AppError("Associated schedule not found", 404));
  }

  const consultationPackageDoc = await ConsultationPackage.findById(
    request.consultationPackage
  );
  if (!consultationPackageDoc) {
    return next(new AppError("Associated package not found", 404));
  }

  const slots = await generateTimeSlots(
    schedule,
    consultationPackageDoc.duration
  );

  res.status(200).json({
    status: true,
    message: "Consultation request details fetched successfully",
    data: {
      request,
      slots,
    },
  });
});

// Select or reschedule slot for consultation request
exports.selectSlotForConsultationRequest = catchAsync(
  async (req, res, next) => {
    const { startTime, endTime, requestId } = req.body;
    const astrologerId = req.user._id; // Assumes astrologer is authenticated

    // Validate inputs
    if (!startTime || !endTime) {
      return next(new AppError("Start time and end time are required", 400));
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
    const request = await ConsultationRequest.findOne({
      _id: requestId,
      astrologer: astrologerId,
    });
    if (!request) {
      return next(
        new AppError("Consultation request not found or not authorized", 404)
      );
    }

    // Fetch schedule and package
    const schedule = await AstrologerSchedule.findById(
      request.astrologerSchedule
    );
    if (!schedule || !schedule.isAvailable) {
      return next(new AppError("Schedule not found or not available", 404));
    }

    const consultationPackageDoc = await ConsultationPackage.findById(
      request.consultationPackage
    );
    if (!consultationPackageDoc) {
      return next(new AppError("Consultation package not found", 404));
    }

    // Validate slot
    const slots = await generateTimeSlots(
      schedule,
      consultationPackageDoc.duration
    );
    const selectedSlot = slots.find(
      (slot) =>
        slot.startTime === startTime &&
        slot.endTime === endTime &&
        slot.available
    );

    if (!selectedSlot) {
      return next(
        new AppError("Selected slot is not available or invalid", 400)
      );
    }

    // Update request
    request.startTime = startTime;
    request.endTime = endTime;
    request.status = "booked";
    request.updatedAt = Date.now();
    await request.save();

    // Populate the updated request
    const populatedRequest = await ConsultationRequest.findById(requestId)
      .populate("user", "name email")
      .populate("astrologer", "name")
      .populate("astrologerSchedule", "date startTime endTime")
      .populate("consultationPackage", "name duration sellPrice")
      .populate(
        "consoutationTransaction",
        "amount gstAmount duration expiryDate"
      );

    res.status(200).json({
      status: true,
      message: "Slot selected successfully for consultation request",
      data: populatedRequest,
    });
  }
);

// Reset slot for consultation request and optionally reschedule
exports.resetSlotForConsultationRequest = catchAsync(async (req, res, next) => {
  const { newStartTime, newEndTime, requestId } = req.body; // Optional for rescheduling
  const astrologerId = req.user._id; // Assumes astrologer is authenticated

  // Validate ObjectID
  if (!mongoose.isValidObjectId(requestId)) {
    return next(new AppError("Invalid request ID", 400));
  }

  // Fetch request
  const request = await ConsultationRequest.findOne({
    _id: requestId,
    astrologer: astrologerId,
  });
  if (!request) {
    return next(
      new AppError("Consultation request not found or not authorized", 404)
    );
  }

  if (request.status !== "booked") {
    return next(new AppError("Only booked requests can be reset", 400));
  }

  // Fetch schedule and package
  const schedule = await AstrologerSchedule.findById(
    request.astrologerSchedule
  );
  if (!schedule || !schedule.isAvailable) {
    return next(new AppError("Schedule not found or not available", 404));
  }

  const consultationPackageDoc = await ConsultationPackage.findById(
    request.consultationPackage
  );
  if (!consultationPackageDoc) {
    return next(new AppError("Consultation package not found", 404));
  }

  // Reset slot
  request.startTime = "";
  request.endTime = "";
  request.status = "pending";
  request.updatedAt = Date.now();

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

    const slots = await generateTimeSlots(
      schedule,
      consultationPackageDoc.duration
    );
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

    request.startTime = newStartTime;
    request.endTime = newEndTime;
    request.status = "booked";
  }

  await request.save();

  // Populate the updated request
  const populatedRequest = await ConsultationRequest.findById(requestId)
    .populate("user", "name email")
    .populate("astrologer", "name")
    .populate("astrologerSchedule", "date startTime endTime")
    .populate("consultationPackage", "name duration sellPrice")
    .populate(
      "consoutationTransaction",
      "amount gstAmount duration expiryDate"
    );

  res.status(200).json({
    status: true,
    message: newStartTime
      ? "Slot reset and rescheduled successfully"
      : "Slot reset successfully",
    data: populatedRequest,
  });
});
