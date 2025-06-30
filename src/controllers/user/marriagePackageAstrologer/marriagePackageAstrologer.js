const MarriagePackageAstrologer = require("../../../models/marriagePackageAstrologer");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

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
      data: MarriagePackageAstrologers,
    });
  }
);
