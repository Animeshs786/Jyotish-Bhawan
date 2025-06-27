const PackageAstrologer = require("../../../models/packageAstrologer");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

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
      populate: {
        path: "speciality", // Populates speciality inside astrologer
        model: "Speciality",
      },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Package astrologers fetched successfully",
    data: packageAstrologers,
  });
});
