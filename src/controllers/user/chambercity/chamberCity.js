const ChamberCity = require("../../../models/chamberCity");
const catchAsync = require("../../../utils/catchAsync");

exports.getAllChamberCities = catchAsync(async (req, res) => {
  const { search } = req.query;

  let query = { status: true };

  // Search by name
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const chamberCities = await ChamberCity.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    status: true,
    message: "Chamber cities fetched successfully",
    data: chamberCities,
  });
});
