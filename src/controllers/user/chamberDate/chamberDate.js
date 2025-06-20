const ChamberDate = require("../../../models/ChamberDate");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.getAllChamberDates = catchAsync(async (req, res) => {
  const { search, page: currentPage, limit: currentLimit, chamberCityId } = req.query;

  let query = {};

  // Filter by chamberCity if provided
  if (chamberCityId) {
    query.chamberCity = chamberCityId;
  }

  // Filter for present or future dates (greater than or equal to today)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  query.date = { $gte: today };

  // Search by date (partial match on date string)
  if (search) {
    const dateRegex = new RegExp(search, "i");
    query.date = { ...query.date, $regex: dateRegex };
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    ChamberDate,
    null,
    query
  );

  const chamberDates = await ChamberDate.find(query)
    .populate("chamberCity", "name")
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Chamber dates fetched successfully",
    data: chamberDates,
  });
});
