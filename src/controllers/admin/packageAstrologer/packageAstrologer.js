const PackageAstrologer = require("../../../models/packageAstrologer");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.createPackageAstrologer = catchAsync(async (req, res, next) => {
  const { consultationPackage, astrologer } = req.body;

  // Validate required fields
  if (!consultationPackage || !astrologer) {
    return next(
      new AppError("ConsultationPackage and astrologer are required", 400)
    );
  }

  // Check for duplicate assignment
  const existingAssignment = await PackageAstrologer.findOne({
    consultationPackage,
    astrologer,
  });
  if (existingAssignment) {
    return next(
      new AppError("Astrologer is already assigned to this package", 400)
    );
  }

  const packageAstrologerData = {
    consultationPackage,
    astrologer,
  };

  try {
    const newPackageAstrologer = await PackageAstrologer.create(
      packageAstrologerData
    );

    // Populate references for response
    await newPackageAstrologer.populate("consultationPackage astrologer");

    res.status(201).json({
      status: true,
      message: "Package astrologer assignment created successfully",
      data: newPackageAstrologer,
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllPackageAstrologers = catchAsync(async (req, res, next) => {
  const {
    search,
    page: currentPage,
    limit: currentLimit,
    consultationPackage,
  } = req.query;

  let query = {};

  if (consultationPackage) {
    query.consultationPackage = consultationPackage;
  }
  // Search will be handled via populated fields in the response
  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    PackageAstrologer,
    null,
    query
  );

  const packageAstrologers = await PackageAstrologer.find(query)
    .populate({
      path: "consultationPackage",
      match: search ? { name: { $regex: search, $options: "i" } } : {},
    })
    .populate({
      path: "astrologer",
      match: search ? { name: { $regex: search, $options: "i" } } : {},
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Filter out null results from population
  const filteredPackageAstrologers = packageAstrologers.filter(
    (pa) => pa.consultationPackage && pa.astrologer
  );

  res.status(200).json({
    status: true,
    totalResult: filteredPackageAstrologers.length,
    totalPage: Math.ceil(filteredPackageAstrologers.length / limit),
    message: "Package astrologers fetched successfully",
    data: filteredPackageAstrologers,
  });
});

exports.getPackageAstrologer = catchAsync(async (req, res, next) => {
  const packageAstrologer = await PackageAstrologer.findById(
    req.params.id
  ).populate("consultationPackage astrologer");

  if (!packageAstrologer) {
    return next(new AppError("Package astrologer assignment not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Package astrologer assignment fetched successfully",
    data: packageAstrologer,
  });
});

exports.updatePackageAstrologer = catchAsync(async (req, res, next) => {
  const { consultationPackage, astrologer } = req.body;

  const packageAstrologer = await PackageAstrologer.findById(req.params.id);

  if (!packageAstrologer) {
    return next(new AppError("Package astrologer assignment not found", 404));
  }

  const packageAstrologerData = {};

  if (consultationPackage)
    packageAstrologerData.consultationPackage = consultationPackage;
  if (astrologer) packageAstrologerData.astrologer = astrologer;

  // Check for duplicate assignment if updating either field
  if (consultationPackage || astrologer) {
    const checkConsultationPackage =
      consultationPackage || packageAstrologer.consultationPackage;
    const checkAstrologer = astrologer || packageAstrologer.astrologer;

    const existingAssignment = await PackageAstrologer.findOne({
      consultationPackage: checkConsultationPackage,
      astrologer: checkAstrologer,
      _id: { $ne: req.params.id },
    });

    if (existingAssignment) {
      return next(
        new AppError("Astrologer is already assigned to this package", 400)
      );
    }
  }

  try {
    const updatedPackageAstrologer = await PackageAstrologer.findByIdAndUpdate(
      req.params.id,
      packageAstrologerData,
      { new: true, runValidators: true }
    ).populate("consultationPackage astrologer");

    res.status(200).json({
      status: true,
      message: "Package astrologer assignment updated successfully",
      data: updatedPackageAstrologer,
    });
  } catch (error) {
    return next(error);
  }
});

exports.deletePackageAstrologer = catchAsync(async (req, res, next) => {
  const packageAstrologer = await PackageAstrologer.findById(req.params.id);

  if (!packageAstrologer) {
    return next(new AppError("Package astrologer assignment not found", 404));
  }

  await PackageAstrologer.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Package astrologer assignment deleted successfully",
    data: null,
  });
});
