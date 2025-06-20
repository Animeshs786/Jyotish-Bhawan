const User = require("../../../models/user");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

exports.createUser = catchAsync(async (req, res, next) => {
  const { name, email, mobile, dob, gender, wallet, status,profession } = req.body;
  let profileImagePath;

  console.log(req.body, "body");

  // Validate required fields
  if (!name || !email || !mobile) {
    return next(new AppError("Name, email, and mobile are required", 400));
  }

  // Check for duplicate email
  const existingEmail = await User.findOne({
    email: { $regex: `^${email}$`, $options: "i" },
  });
  if (existingEmail) {
    return next(new AppError("Email must be unique", 400));
  }

  // Check for duplicate mobile
  const existingMobile = await User.findOne({ mobile });
  if (existingMobile) {
    return next(new AppError("Mobile number must be unique", 400));
  }

  const userData = {
    name,
    email,
    mobile,
    dob,
    gender,
    wallet: wallet ? JSON.parse(wallet) : { balance: 0, lockedBalance: 0 },
    status,
    profession
  };

  try {
    // Handle profile image
    if (req.files && req.files.profileImage) {
      const profileImage = req.files.profileImage[0];
      const imageUrl = `${profileImage.destination}/${profileImage.filename}`;
      userData.profileImage = imageUrl;
      profileImagePath = imageUrl;
    }

    const newUser = await User.create(userData);

    res.status(201).json({
      status: true,
      message: "User created successfully",
      data: newUser,
    });
  } catch (error) {
    // Clean up uploaded profile image if creation fails
    if (profileImagePath) {
      await deleteOldFiles(profileImagePath).catch((err) => {
        console.error("Failed to delete profile image:", err);
      });
    }
    return next(error);
  }
});

exports.getAllUsers = catchAsync(async (req, res) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;

  let query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ];
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    User,
    null,
    query
  );

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Users fetched successfully",
    data: users,
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "User fetched successfully",
    data: user,
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const { name, email, mobile, dob, gender, wallet, status,profession } = req.body;
  let profileImagePath;

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Check for duplicate email (excluding current user)
  if (email && email !== user.email) {
    const existingEmail = await User.findOne({
      email: { $regex: `^${email}$`, $options: "i" },
      _id: { $ne: req.params.id },
    });
    if (existingEmail) {
      return next(new AppError("Email must be unique", 400));
    }
  }

  // Check for duplicate mobile (excluding current user)
  if (mobile && mobile !== user.mobile) {
    const existingMobile = await User.findOne({
      mobile,
      _id: { $ne: req.params.id },
    });
    if (existingMobile) {
      return next(new AppError("Mobile number must be unique", 400));
    }
  }

  const userData = {};

  if (name) userData.name = name;
  if (email) userData.email = email;
  if (mobile) userData.mobile = mobile;
  if (dob) userData.dob = dob;
  if (gender) userData.gender = gender;
  if (wallet) userData.wallet = JSON.parse(wallet);
  if (status !== undefined) userData.status = status;
  if (profession) userData.profession = profession;

  try {
    // Handle profile image
    if (req.files && req.files.profileImage) {
      const profileImage = req.files.profileImage[0];
      const imageUrl = `${profileImage.destination}/${profileImage.filename}`;
      userData.profileImage = imageUrl;
      profileImagePath = imageUrl;

      // Delete old profile image if exists
      if (user.profileImage) {
        await deleteOldFiles(user.profileImage).catch((err) => {
          console.error("Failed to delete old profile image:", err);
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, userData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    // Clean up uploaded profile image if update fails
    if (profileImagePath) {
      await deleteOldFiles(profileImagePath).catch((err) => {
        console.error("Failed to delete profile image:", err);
      });
    }
    return next(error);
  }
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Delete associated profile image if exists
  if (user.profileImage) {
    await deleteOldFiles(user.profileImage).catch((err) => {
      console.error("Failed to delete profile image:", err);
    });
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "User deleted successfully",
    data: null,
  });
});
