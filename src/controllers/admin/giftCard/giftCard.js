const GiftCard = require("../../../models/giftCard");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

exports.createGiftCard = catchAsync(async (req, res, next) => {
  const { name, amount } = req.body;
  let imagePath;

  // Validate required fields
  if (!name || !amount || !req.files || !req.files.image) {
    return next(new AppError("Name, amount, and image are required", 400));
  }

  // Check for duplicate name
  const existingName = await GiftCard.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
  });
  if (existingName) {
    return next(new AppError("Gift card name must be unique", 400));
  }

  const giftCardData = {
    name,
    amount,
  };

  try {
    // Handle image upload
    const image = req.files.image[0];
    const imageUrl = `${image.destination}/${image.filename}`;
    giftCardData.image = imageUrl;
    imagePath = imageUrl;

    const newGiftCard = await GiftCard.create(giftCardData);

    res.status(201).json({
      status: true,
      message: "Gift card created successfully",
      data: newGiftCard,
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

exports.getAllGiftCards = catchAsync(async (req, res, next) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;

  let query = {};

  if (search) {
    query.$or = [{ name: { $regex: search, $options: "i" } }];
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    GiftCard,
    null,
    query
  );

  const giftCards = await GiftCard.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Gift cards fetched successfully",
    data: giftCards,
  });
});

exports.getGiftCard = catchAsync(async (req, res, next) => {
  const giftCard = await GiftCard.findById(req.params.id);

  if (!giftCard) {
    return next(new AppError("Gift card not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Gift card fetched successfully",
    data: giftCard,
  });
});

exports.updateGiftCard = catchAsync(async (req, res, next) => {
  const { name, amount } = req.body;
  let imagePath;

  const giftCard = await GiftCard.findById(req.params.id);

  if (!giftCard) {
    return next(new AppError("Gift card not found", 404));
  }

  // Check for duplicate name (excluding current gift card)
  if (name && name !== giftCard.name) {
    const existingName = await GiftCard.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      _id: { $ne: req.params.id },
    });
    if (existingName) {
      return next(new AppError("Gift card name must be unique", 400));
    }
  }

  const giftCardData = {};

  if (name) giftCardData.name = name;
  if (amount !== undefined) giftCardData.amount = amount;

  try {
    // Handle image upload
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imageUrl = `${image.destination}/${image.filename}`;
      giftCardData.image = imageUrl;
      imagePath = imageUrl;

      // Delete old image if exists
      if (giftCard.image) {
        await deleteOldFiles(giftCard.image).catch((err) => {
          console.error("Failed to delete old image:", err);
        });
      }
    }

    const updatedGiftCard = await GiftCard.findByIdAndUpdate(
      req.params.id,
      giftCardData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: "Gift card updated successfully",
      data: updatedGiftCard,
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

exports.deleteGiftCard = catchAsync(async (req, res, next) => {
  const giftCard = await GiftCard.findById(req.params.id);

  if (!giftCard) {
    return next(new AppError("Gift card not found", 404));
  }

  // Delete associated image if exists
  if (giftCard.image) {
    await deleteOldFiles(giftCard.image).catch((err) => {
      console.error("Failed to delete image:", err);
    });
  }

  await GiftCard.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Gift card deleted successfully",
    data: null,
  });
});
