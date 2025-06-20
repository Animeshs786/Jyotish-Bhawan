const Banner = require("../../../models/banner");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.getAllBanners = catchAsync(async (req, res) => {
  const { search, platform, bannerType ,category} = req.query;

  let query = {
    status: true,
  };

  // Add filters based on query parameters
  if (search) {
    query.title = { $regex: search, $options: "i" };
  }
  if (platform) {
    query.platform = {
      $in: [platform, "both"],
    };
  }

  if (bannerType) {
    query.bannerType = bannerType;
  }
  if (category) {
    query.category = category;
  }

  const banners = await Banner.find(query).sort("priority");

  res.status(200).json({
    status: true,
    message: "Banners fetched successfully",
    data: banners,
  });
});

exports.getBanner = catchAsync(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(new AppError("Banner not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Banner fetched successfully",
    data: banner,
  });
});
