const MarriagePackageAstrologer = require("../../../models/marriagePackageAstrologer");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.createMarriagePackageAstrologer = catchAsync(async (req, res, next) => {
  const { marriagePackage, astrologer } = req.body;

  // Validate required fields
  if (!marriagePackage || !astrologer) {
    return next(
      new AppError("marriagePackage and astrologer are required", 400)
    );
  }

  // Check for duplicate assignment
  const existingAssignment = await MarriagePackageAstrologer.findOne({
    marriagePackage,
    astrologer,
  });
  if (existingAssignment) {
    return next(
      new AppError("Astrologer is already assigned to this package", 400)
    );
  }

  const MarriagePackageAstrologerData = {
    marriagePackage,
    astrologer,
  };

  try {
    const newMarriagePackageAstrologer = await MarriagePackageAstrologer.create(
      MarriagePackageAstrologerData
    );

    // Populate references for response
    await newMarriagePackageAstrologer.populate("marriagePackage astrologer");

    res.status(201).json({
      status: true,
      message: "Package astrologer assignment created successfully",
      data: newMarriagePackageAstrologer,
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllMarriagePackageAstrologers = catchAsync(
  async (req, res, next) => {
    const {
      search,
      page: currentPage,
      limit: currentLimit,
      marriagePackage,
    } = req.query;

    let query = {};

    if (marriagePackage) {
      query.marriagePackage = marriagePackage;
    }
    // Search will be handled via populated fields in the response
    const { limit, skip, totalResult, totalPage } = await pagination(
      currentPage,
      currentLimit,
      MarriagePackageAstrologer,
      null,
      query
    );

    const MarriagePackageAstrologers = await MarriagePackageAstrologer.find(
      query
    )
      .populate({
        path: "marriagePackage",
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
    const filteredMarriagePackageAstrologers =
      MarriagePackageAstrologers.filter(
        (pa) => pa.marriagePackage && pa.astrologer
      );

    res.status(200).json({
      status: true,
      totalResult: filteredMarriagePackageAstrologers.length,
      totalPage: Math.ceil(filteredMarriagePackageAstrologers.length / limit),
      message: "Package astrologers fetched successfully",
      data: filteredMarriagePackageAstrologers,
    });
  }
);

exports.getMarriagePackageAstrologer = catchAsync(async (req, res, next) => {
  const MarriagePackageAstrologer = await MarriagePackageAstrologer.findById(
    req.params.id
  ).populate("marriagePackage astrologer");

  if (!MarriagePackageAstrologer) {
    return next(new AppError("Package astrologer assignment not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Package astrologer assignment fetched successfully",
    data: MarriagePackageAstrologer,
  });
});

exports.updateMarriagePackageAstrologer = catchAsync(async (req, res, next) => {
  const { marriagePackage, astrologer } = req.body;

  const MarriagePackageAstrologer = await MarriagePackageAstrologer.findById(
    req.params.id
  );

  if (!MarriagePackageAstrologer) {
    return next(new AppError("Package astrologer assignment not found", 404));
  }

  const MarriagePackageAstrologerData = {};

  if (marriagePackage)
    MarriagePackageAstrologerData.marriagePackage = marriagePackage;
  if (astrologer) MarriagePackageAstrologerData.astrologer = astrologer;

  // Check for duplicate assignment if updating either field
  if (marriagePackage || astrologer) {
    const checkmarriagePackage =
      marriagePackage || MarriagePackageAstrologer.marriagePackage;
    const checkAstrologer = astrologer || MarriagePackageAstrologer.astrologer;

    const existingAssignment = await MarriagePackageAstrologer.findOne({
      marriagePackage: checkmarriagePackage,
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
    const updatedMarriagePackageAstrologer =
      await MarriagePackageAstrologer.findByIdAndUpdate(
        req.params.id,
        MarriagePackageAstrologerData,
        { new: true, runValidators: true }
      ).populate("marriagePackage astrologer");

    res.status(200).json({
      status: true,
      message: "Package astrologer assignment updated successfully",
      data: updatedMarriagePackageAstrologer,
    });
  } catch (error) {
    return next(error);
  }
});

exports.deleteMarriagePackageAstrologer = catchAsync(async (req, res, next) => {
  const MarriagePackageAstrologer = await MarriagePackageAstrologer.findById(
    req.params.id
  );

  if (!MarriagePackageAstrologer) {
    return next(new AppError("Package astrologer assignment not found", 404));
  }

  await MarriagePackageAstrologer.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Package astrologer assignment deleted successfully",
    data: null,
  });
});
