const MarriagePackage = require("../../../models/marriagePackage");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

exports.createMarriagePackage = catchAsync(async (req, res, next) => {
  const {
    name,
    price,
    sellPrice,
    duration,
    packageExpiry,
    about,
    feacture,
    status,
    rechargeAmount,
  } = req.body;
  let thumbImagePath;
  let imagePath;

  // Validate required fields
  if (
    !name ||
    !price ||
    !sellPrice ||
    !duration ||
    !packageExpiry ||
    !req.files ||
    !req.files.thumbImage ||
    !req.files.image
  ) {
    return next(
      new AppError(
        "Name, price, sellPrice, duration, packageExpiry, thumbImage, and image are required",
        400
      )
    );
  }

  const MarriagePackageData = {
    name,
    price,
    sellPrice,
    duration,
    packageExpiry,
    about,
    feacture: feacture
      ? Array.isArray(feacture)
        ? feacture
        : JSON.parse(feacture)
      : [],
    status: status !== undefined ? status : true,
    rechargeAmount: rechargeAmount ? rechargeAmount : 0,
  };

  try {
    // Handle thumbImage upload
    const thumbImage = req.files.thumbImage[0];
    const thumbImageUrl = `${thumbImage.destination}/${thumbImage.filename}`;
    MarriagePackageData.thumbImage = thumbImageUrl;
    thumbImagePath = thumbImageUrl;

    // Handle image upload
    const image = req.files.image[0];
    const imageUrl = `${image.destination}/${image.filename}`;
    MarriagePackageData.image = imageUrl;
    imagePath = imageUrl;

    const newMarriagePackage = await MarriagePackage.create(
      MarriagePackageData
    );

    res.status(201).json({
      status: true,
      message: "Consultation package created successfully",
      data: newMarriagePackage,
    });
  } catch (error) {
    // Clean up uploaded images
    if (thumbImagePath) {
      await deleteOldFiles(thumbImagePath).catch((err) => {
        console.error("Failed to delete thumbImage:", err);
      });
    }
    if (imagePath) {
      await deleteOldFiles(imagePath).catch((err) => {
        console.error("Failed to delete image:", err);
      });
    }
    return next(error);
  }
});

exports.getAllMarriagePackages = catchAsync(async (req, res, next) => {
  const { search, page: currentPage, limit: currentLimit } = req.query;

  let query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { about: { $regex: search, $options: "i" } },
    ];
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    MarriagePackage,
    null,
    query
  );

  const MarriagePackages = await MarriagePackage.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Consultation packages fetched successfully",
    data: MarriagePackages,
  });
});

exports.getMarriagePackage = catchAsync(async (req, res, next) => {
  const MarriagePackage = await MarriagePackage.findById(req.params.id);

  if (!MarriagePackage) {
    return next(new AppError("Consultation package not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Consultation package fetched successfully",
    data: MarriagePackage,
  });
});

exports.updateMarriagePackage = catchAsync(async (req, res, next) => {
  const {
    name,
    price,
    sellPrice,
    duration,
    packageExpiry,
    about,
    feacture,
    status,
    rechargeAmount,
  } = req.body;
  let thumbImagePath;
  let imagePath;

  const MarriagePackage = await MarriagePackage.findById(req.params.id);

  if (!MarriagePackage) {
    return next(new AppError("Consultation package not found", 404));
  }

  const MarriagePackageData = {};

  if (name) MarriagePackageData.name = name;
  if (price !== undefined) MarriagePackageData.price = price;
  if (sellPrice !== undefined) MarriagePackageData.sellPrice = sellPrice;
  if (duration !== undefined) MarriagePackageData.duration = duration;
  if (packageExpiry !== undefined)
    MarriagePackageData.packageExpiry = packageExpiry;
  if (about) MarriagePackageData.about = about;
  if (rechargeAmount !== undefined)
    MarriagePackageData.rechargeAmount = rechargeAmount;
  if (feacture) {
    MarriagePackageData.feacture = Array.isArray(feacture)
      ? feacture
      : JSON.parse(feacture);
  }
  if (status !== undefined) MarriagePackageData.status = status;

  try {
    // Handle thumbImage upload
    if (req.files && req.files.thumbImage) {
      const thumbImage = req.files.thumbImage[0];
      const thumbImageUrl = `${thumbImage.destination}/${thumbImage.filename}`;
      MarriagePackageData.thumbImage = thumbImageUrl;
      thumbImagePath = thumbImageUrl;

      // Delete old thumbImage if exists
      if (MarriagePackage.thumbImage) {
        await deleteOldFiles(MarriagePackage.thumbImage).catch((err) => {
          console.error("Failed to delete old thumbImage:", err);
        });
      }
    }

    // Handle image upload
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imageUrl = `${image.destination}/${image.filename}`;
      MarriagePackageData.image = imageUrl;
      imagePath = imageUrl;

      // Delete old image if exists
      if (MarriagePackage.image) {
        await deleteOldFiles(MarriagePackage.image).catch((err) => {
          console.error("Failed to delete old image:", err);
        });
      }
    }

    const updatedMarriagePackage = await MarriagePackage.findByIdAndUpdate(
      req.params.id,
      MarriagePackageData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: "Consultation package updated successfully",
      data: updatedMarriagePackage,
    });
  } catch (error) {
    // Clean up uploaded images
    if (thumbImagePath) {
      await deleteOldFiles(thumbImagePath).catch((err) => {
        console.error("Failed to delete thumbImage:", err);
      });
    }
    if (imagePath) {
      await deleteOldFiles(imagePath).catch((err) => {
        console.error("Failed to delete image:", err);
      });
    }
    return next(error);
  }
});

exports.deleteMarriagePackage = catchAsync(async (req, res, next) => {
  const MarriagePackage = await MarriagePackage.findById(req.params.id);

  if (!MarriagePackage) {
    return next(new AppError("Consultation package not found", 404));
  }

  // Delete associated images if exist
  if (MarriagePackage.thumbImage) {
    await deleteOldFiles(MarriagePackage.thumbImage).catch((err) => {
      console.error("Failed to delete thumbImage:", err);
    });
  }
  if (MarriagePackage.image) {
    await deleteOldFiles(MarriagePackage.image).catch((err) => {
      console.error("Failed to delete image:", err);
    });
  }

  await MarriagePackage.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Consultation package deleted successfully",
    data: null,
  });
});
