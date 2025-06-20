const ChamberPackage = require("../../../models/chamberPackage");
const catchAsync = require("../../../utils/catchAsync");

exports.getAllChamberPackages = catchAsync(async (req, res) => {
  const { search, chamberCity } = req.query;

  let query = { status: true };

  // Search by name or status
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
    ];
  }

  if (chamberCity) {
    query.chamberCity = { $in: [chamberCity] };
  }

  const chamberPackages = await ChamberPackage.find(query).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: true,
    message: "Chamber packages fetched successfully",
    data: chamberPackages,
  });
});
