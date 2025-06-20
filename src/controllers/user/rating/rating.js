const Rating = require("../../../models/rating");
const User = require("../../../models/user");
const Astrologer = require("../../../models/asteroLogerSchema");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.createRating = catchAsync(async (req, res, next) => {
  const { rating, astrologer, review, isVerify } = req.body;

  console.log(req.body, "body");

  const user = req.user._id;

  // Validate required fields
  if (!rating || !user || !astrologer) {
    return next(new AppError("Rating, user, and astrologer are required", 400));
  }

  // Validate rating value (assuming rating is between 1 and 5)
  if (rating < 1 || rating > 5) {
    return next(new AppError("Rating must be between 1 and 5", 400));
  }

  // Check if user exists
  const existingUser = await User.findById(user);
  if (!existingUser) {
    return next(new AppError("User not found", 404));
  }

  // Check if astrologer exists
  const existingAstrologer = await Astrologer.findById(astrologer);
  if (!existingAstrologer) {
    return next(new AppError("Astrologer not found", 404));
  }

  // Check for duplicate rating (one rating per user per astrologer)
  const existingRating = await Rating.findOne({ user, astrologer });
  if (existingRating) {
    return next(new AppError("User has already rated this astrologer", 400));
  }

  const ratingData = {
    rating,
    user,
    astrologer,
    review: review || "",
    isVerify: isVerify || false,
  };

  try {
    const newRating = await Rating.create(ratingData);

    res.status(201).json({
      status: true,
      message: "Rating created successfully",
      data: newRating,
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllRatings = catchAsync(async (req, res) => {
  const {
    search,
    page: currentPage,
    limit: currentLimit,
    astrologerId,
    userId,
  } = req.query;

  let query = {isVerify:true};

  // Filter by astrologer if provided
  if (astrologerId) {
    query.astrologer = astrologerId;
  }
  if (userId) {
    query.user = userId;
  }

  // Search by review text if provided
  if (search) {
    query.review = { $regex: search, $options: "i" };
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Rating,
    null,
    query
  );

  const ratings = await Rating.find(query)
    .populate("user", "name email profileImage profession")
    .populate("astrologer", "name email profileImage profession")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Ratings fetched successfully",
    data: ratings,
  });
});

exports.getRating = catchAsync(async (req, res, next) => {
  const rating = await Rating.findById(req.params.id)
    .populate("user", "name email profileImage profession")
    .populate("astrologer", "name email profileImage profession");

  if (!rating) {
    return next(new AppError("Rating not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Rating fetched successfully",
    data: rating,
  });
});

exports.updateRating = catchAsync(async (req, res, next) => {
  const { rating, review, isVerify } = req.body;

  console.log(req.body, "body");
  const existingRating = await Rating.findById(req.params.id);

  if (!existingRating) {
    return next(new AppError("Rating not found", 404));
  }

  // Validate rating value if provided
  if (rating && (rating < 1 || rating > 5)) {
    return next(new AppError("Rating must be between 1 and 5", 400));
  }

  const ratingData = {};

  if (rating) ratingData.rating = rating;
  if (review !== undefined) ratingData.review = review;
  if (isVerify !== undefined) ratingData.isVerify = isVerify;

  try {
    const updatedRating = await Rating.findByIdAndUpdate(
      req.params.id,
      ratingData,
      { new: true, runValidators: true }
    )
      .populate("user", "name email")
      .populate("astrologer", "name");

    res.status(200).json({
      status: true,
      message: "Rating updated successfully",
      data: updatedRating,
    });
  } catch (error) {
    return next(error);
  }
});
