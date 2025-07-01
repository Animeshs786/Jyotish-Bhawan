const mongoose = require("mongoose");
const moment = require("moment-timezone");
const LoveMember = require("../../../models/loveMember");
const LovePackage = require("../../../models/lovePackage");
const User = require("../../../models/user");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

moment.tz.setDefault("Asia/Kolkata");

// Create a new love member
exports.createLoveMember = catchAsync(async (req, res, next) => {
  const { lovePackage, yourName, partnerName, status } = req.body;
  const userId = req.user._id; // From protect middleware
  let yourImagePath;
  let partnerImagePath;

  // Validate required fields
  if (
    !lovePackage ||
    !yourName ||
    !partnerName ||
    !req.files ||
    !req.files.yourImage ||
    !req.files.partnerImage
  ) {
    return next(
      new AppError(
        "LovePackage, yourName, partnerName, yourImage, and partnerImage are required",
        400
      )
    );
  }

  // Validate ObjectID
  if (!mongoose.isValidObjectId(lovePackage)) {
    return next(new AppError("Invalid love package ID", 400));
  }

  // Validate user
  const userExists = await User.findById(userId);
  if (!userExists) {
    return next(new AppError("User not found", 404));
  }

  // Validate love package
  const packageExists = await LovePackage.findById(lovePackage);
  if (!packageExists || !packageExists.status) {
    return next(new AppError("Love package not found or not active", 404));
  }

  // Check for duplicate love member (same user and lovePackage)
  const existingMember = await LoveMember.findOne({
    user: userId,
    lovePackage,
  });
  if (existingMember) {
    return next(
      new AppError(
        "A love member entry already exists for this user and package",
        400
      )
    );
  }

  // Prepare love member data
  const loveMemberData = {
    user: userId,
    lovePackage,
    yourName,
    partnerName,
    status: status !== undefined ? status : true,
  };

  try {
    // Handle yourImage upload
    const yourImage = req.files.yourImage[0];
    const yourImageUrl = `${yourImage.destination}/${yourImage.filename}`;
    loveMemberData.yourImage = yourImageUrl;
    yourImagePath = yourImageUrl;

    // Handle partnerImage upload
    const partnerImage = req.files.partnerImage[0];
    const partnerImageUrl = `${partnerImage.destination}/${partnerImage.filename}`;
    loveMemberData.partnerImage = partnerImageUrl;
    partnerImagePath = partnerImageUrl;

    const newLoveMember = await LoveMember.create(loveMemberData);

    // Populate references for response
    await newLoveMember.populate("user", "name email");
    await newLoveMember.populate("lovePackage", "name price");

    res.status(201).json({
      status: true,
      message: "Love member created successfully",
      data: newLoveMember,
    });
  } catch (error) {
    // Clean up uploaded images
    if (yourImagePath) {
      await deleteOldFiles(yourImagePath).catch((err) => {
        console.error("Failed to delete yourImage:", err);
      });
    }
    if (partnerImagePath) {
      await deleteOldFiles(partnerImagePath).catch((err) => {
        console.error("Failed to delete partnerImage:", err);
      });
    }
    return next(
      new AppError(`Failed to create love member: ${error.message}`, 500)
    );
  }
});

// Get all love members
exports.getAllLoveMembers = catchAsync(async (req, res, next) => {
  const {
    search,
    lovePackage,
    page: currentPage,
    limit: currentLimit,
  } = req.query;
  const userId = req.user._id;

  let query = { user: userId }; // Restrict to authenticated user's love members

  // Filter by status
  if (search) {
    if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
      query.status = search.toLowerCase() === "true";
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
    LoveMember,
    null,
    query
  );

  const loveMembers = await LoveMember.find(query)
    .populate("user", "name email")
    .populate("lovePackage", "name price")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Love members fetched successfully",
    data: loveMembers,
  });
});

// Get a single love member
exports.getLoveMember = catchAsync(async (req, res, next) => {
  const loveMemberId = req.params.id;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(loveMemberId)) {
    return next(new AppError("Invalid love member ID", 400));
  }

  const loveMember = await LoveMember.findOne({
    _id: loveMemberId,
    user: userId,
  })
    .populate("user", "name email")
    .populate("lovePackage", "name price");

  if (!loveMember) {
    return next(new AppError("Love member not found or not authorized", 404));
  }

  res.status(200).json({
    status: true,
    message: "Love member fetched successfully",
    data: loveMember,
  });
});

// Update a love member
exports.updateLoveMember = catchAsync(async (req, res, next) => {
  const { lovePackage, yourName, partnerName, status } = req.body;
  const loveMemberId = req.params.id;
  const userId = req.user._id;
  let yourImagePath;
  let partnerImagePath;

  if (!mongoose.isValidObjectId(loveMemberId)) {
    return next(new AppError("Invalid love member ID", 400));
  }

  const loveMember = await LoveMember.findOne({
    _id: loveMemberId,
    user: userId,
  });

  if (!loveMember) {
    return next(new AppError("Love member not found or not authorized", 404));
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

  // Check for duplicate love member if updating lovePackage
  if (lovePackage && lovePackage !== loveMember.lovePackage.toString()) {
    const existingMember = await LoveMember.findOne({
      user: userId,
      lovePackage,
      _id: { $ne: loveMemberId },
    });
    if (existingMember) {
      return next(
        new AppError(
          "A love member entry already exists for this user and package",
          400
        )
      );
    }
  }

  // Prepare update data
  const updateData = {};
  if (lovePackage) updateData.lovePackage = lovePackage;
  if (yourName) updateData.yourName = yourName;
  if (partnerName) updateData.partnerName = partnerName;
  if (status !== undefined) updateData.status = status;

  try {
    // Handle yourImage upload
    if (req.files && req.files.yourImage) {
      const yourImage = req.files.yourImage[0];
      const yourImageUrl = `${yourImage.destination}/${yourImage.filename}`;
      updateData.yourImage = yourImageUrl;
      yourImagePath = yourImageUrl;

      // Delete old yourImage if exists
      if (loveMember.yourImage) {
        await deleteOldFiles(loveMember.yourImage).catch((err) => {
          console.error("Failed to delete old yourImage:", err);
        });
      }
    }

    // Handle partnerImage upload
    if (req.files && req.files.partnerImage) {
      const partnerImage = req.files.partnerImage[0];
      const partnerImageUrl = `${partnerImage.destination}/${partnerImage.filename}`;
      updateData.partnerImage = partnerImageUrl;
      partnerImagePath = partnerImageUrl;

      // Delete old partnerImage if exists
      if (loveMember.partnerImage) {
        await deleteOldFiles(loveMember.partnerImage).catch((err) => {
          console.error("Failed to delete old partnerImage:", err);
        });
      }
    }

    const updatedLoveMember = await LoveMember.findByIdAndUpdate(
      loveMemberId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("user", "name email")
      .populate("lovePackage", "name price");

    if (!updatedLoveMember) {
      return next(new AppError("Love member not found", 404));
    }

    res.status(200).json({
      status: true,
      message: "Love member updated successfully",
      data: updatedLoveMember,
    });
  } catch (error) {
    // Clean up uploaded images
    if (yourImagePath) {
      await deleteOldFiles(yourImagePath).catch((err) => {
        console.error("Failed to delete yourImage:", err);
      });
    }
    if (partnerImagePath) {
      await deleteOldFiles(partnerImagePath).catch((err) => {
        console.error("Failed to delete partnerImage:", err);
      });
    }
    return next(
      new AppError(`Failed to update love member: ${error.message}`, 500)
    );
  }
});

// Delete a love member
exports.deleteLoveMember = catchAsync(async (req, res, next) => {
  const loveMemberId = req.params.id;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(loveMemberId)) {
    return next(new AppError("Invalid love member ID", 400));
  }

  const loveMember = await LoveMember.findOne({
    _id: loveMemberId,
    user: userId,
  });

  if (!loveMember) {
    return next(new AppError("Love member not found or not authorized", 404));
  }

  // Delete associated images if exist
  if (loveMember.yourImage) {
    await deleteOldFiles(loveMember.yourImage).catch((err) => {
      console.error("Failed to delete yourImage:", err);
    });
  }
  if (loveMember.partnerImage) {
    await deleteOldFiles(loveMember.partnerImage).catch((err) => {
      console.error("Failed to delete partnerImage:", err);
    });
  }

  await LoveMember.findByIdAndDelete(loveMemberId);

  res.status(200).json({
    status: true,
    message: "Love member deleted successfully",
    data: null,
  });
});
