const ConsultationPackage = require("../../../models/consultationPackage");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const deleteOldFiles = require("../../../utils/deleteOldFiles");
const pagination = require("../../../utils/pagination");

exports.createConsultationPackage = catchAsync(async (req, res, next) => {
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

  const consultationPackageData = {
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
    consultationPackageData.thumbImage = thumbImageUrl;
    thumbImagePath = thumbImageUrl;

    // Handle image upload
    const image = req.files.image[0];
    const imageUrl = `${image.destination}/${image.filename}`;
    consultationPackageData.image = imageUrl;
    imagePath = imageUrl;

    const newConsultationPackage = await ConsultationPackage.create(
      consultationPackageData
    );

    res.status(201).json({
      status: true,
      message: "Consultation package created successfully",
      data: newConsultationPackage,
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

exports.getAllConsultationPackages = catchAsync(async (req, res, next) => {
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
    ConsultationPackage,
    null,
    query
  );

  const consultationPackages = await ConsultationPackage.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Consultation packages fetched successfully",
    data: consultationPackages,
  });
});

exports.getConsultationPackage = catchAsync(async (req, res, next) => {
  const consultationPackage = await ConsultationPackage.findById(req.params.id);

  if (!consultationPackage) {
    return next(new AppError("Consultation package not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Consultation package fetched successfully",
    data: consultationPackage,
  });
});

exports.updateConsultationPackage = catchAsync(async (req, res, next) => {
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

  const consultationPackage = await ConsultationPackage.findById(req.params.id);

  if (!consultationPackage) {
    return next(new AppError("Consultation package not found", 404));
  }

  const consultationPackageData = {};

  if (name) consultationPackageData.name = name;
  if (price !== undefined) consultationPackageData.price = price;
  if (sellPrice !== undefined) consultationPackageData.sellPrice = sellPrice;
  if (duration !== undefined) consultationPackageData.duration = duration;
  if (packageExpiry !== undefined)
    consultationPackageData.packageExpiry = packageExpiry;
  if (about) consultationPackageData.about = about;
  if (rechargeAmount !== undefined)
    consultationPackageData.rechargeAmount = rechargeAmount;
  if (feacture) {
    consultationPackageData.feacture = Array.isArray(feacture)
      ? feacture
      : JSON.parse(feacture);
  }
  if (status !== undefined) consultationPackageData.status = status;

  try {
    // Handle thumbImage upload
    if (req.files && req.files.thumbImage) {
      const thumbImage = req.files.thumbImage[0];
      const thumbImageUrl = `${thumbImage.destination}/${thumbImage.filename}`;
      consultationPackageData.thumbImage = thumbImageUrl;
      thumbImagePath = thumbImageUrl;

      // Delete old thumbImage if exists
      if (consultationPackage.thumbImage) {
        await deleteOldFiles(consultationPackage.thumbImage).catch((err) => {
          console.error("Failed to delete old thumbImage:", err);
        });
      }
    }

    // Handle image upload
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imageUrl = `${image.destination}/${image.filename}`;
      consultationPackageData.image = imageUrl;
      imagePath = imageUrl;

      // Delete old image if exists
      if (consultationPackage.image) {
        await deleteOldFiles(consultationPackage.image).catch((err) => {
          console.error("Failed to delete old image:", err);
        });
      }
    }

    const updatedConsultationPackage =
      await ConsultationPackage.findByIdAndUpdate(
        req.params.id,
        consultationPackageData,
        { new: true, runValidators: true }
      );

    res.status(200).json({
      status: true,
      message: "Consultation package updated successfully",
      data: updatedConsultationPackage,
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

exports.deleteConsultationPackage = catchAsync(async (req, res, next) => {
  const consultationPackage = await ConsultationPackage.findById(req.params.id);

  if (!consultationPackage) {
    return next(new AppError("Consultation package not found", 404));
  }

  // Delete associated images if exist
  if (consultationPackage.thumbImage) {
    await deleteOldFiles(consultationPackage.thumbImage).catch((err) => {
      console.error("Failed to delete thumbImage:", err);
    });
  }
  if (consultationPackage.image) {
    await deleteOldFiles(consultationPackage.image).catch((err) => {
      console.error("Failed to delete image:", err);
    });
  }

  await ConsultationPackage.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Consultation package deleted successfully",
    data: null,
  });
});
