const BookBanner = require("../../../models/bookBanner");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

exports.createBookBanner = catchAsync(async (req, res, next) => {
  const { price, sellPrice, type } = req.body;
  let imagePath;

  if (!req.files || !req.files.image) {
    return next(new AppError("Image is required", 400));
  }

  if (!type) {
    return next(new AppError("Type is required", 400));
  }

  const bookBannerData = {
    price,
    sellPrice,
    type,
  };

  try {
    // Handle image upload
    const image = req.files.image[0];
    const imageUrl = `${image.destination}/${image.filename}`;
    bookBannerData.image = imageUrl;
    imagePath = imageUrl;

    const newBookBanner = await BookBanner.create(bookBannerData);

    res.status(201).json({
      status: true,
      message: "Book banner created successfully",
      data: newBookBanner,
    });
  } catch (error) {
    // Clean up uploaded image
    if (imagePath) {
      await deleteOldFiles(imagePath).catch((err) => {
        console.error("Failed to delete image:", err);
      });
    }
    return next(error);
  }
});

exports.getAllBookBanners = catchAsync(async (req, res) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;

  let query = {};

  if (search) {
    query.$or = [{ type: { $regex: search, $options: "i" } }];
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    BookBanner,
    null,
    query
  );

  const bookBanners = await BookBanner.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Book banners fetched successfully",
    data: bookBanners,
  });
});

exports.getBookBanner = catchAsync(async (req, res, next) => {
  const bookBanner = await BookBanner.findById(req.params.id);

  if (!bookBanner) {
    return next(new AppError("Book banner not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Book banner fetched successfully",
    data: bookBanner,
  });
});

exports.updateBookBanner = catchAsync(async (req, res, next) => {
  const { price, sellPrice, type } = req.body;
  let imagePath;

  const bookBanner = await BookBanner.findById(req.params.id);

  if (!bookBanner) {
    return next(new AppError("Book banner not found", 404));
  }

  const bookBannerData = {};

  if (price !== undefined) bookBannerData.price = price;
  if (sellPrice !== undefined) bookBannerData.sellPrice = sellPrice;
  if (type) bookBannerData.type = type;

  try {
    // Handle image upload
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imageUrl = `${image.destination}/${image.filename}`;
      bookBannerData.image = imageUrl;
      imagePath = imageUrl;

      // Delete old image if exists
      if (bookBanner.image) {
        await deleteOldFiles(bookBanner.image).catch((err) => {
          console.error("Failed to delete old image:", err);
        });
      }
    }

    const updatedBookBanner = await BookBanner.findByIdAndUpdate(
      req.params.id,
      bookBannerData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: "Book banner updated successfully",
      data: updatedBookBanner,
    });
  } catch (error) {
    // Clean up uploaded image
    if (imagePath) {
      await deleteOldFiles(imagePath).catch((err) => {
        console.error("Failed to delete image:", err);
      });
    }
    return next(error);
  }
});

exports.deleteBookBanner = catchAsync(async (req, res, next) => {
  const bookBanner = await BookBanner.findById(req.params.id);

  if (!bookBanner) {
    return next(new AppError("Book banner not found", 404));
  }

  // Delete associated image if exists
  if (bookBanner.image) {
    await deleteOldFiles(bookBanner.image).catch((err) => {
      console.error("Failed to delete image:", err);
    });
  }

  await BookBanner.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Book banner deleted successfully",
    data: null,
  });
});
