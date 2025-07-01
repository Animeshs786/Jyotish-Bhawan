// const ChamberCity = require("../../../models/chamberCity");
// const catchAsync = require("../../../utils/catchAsync");

// exports.getAllChamberCities = catchAsync(async (req, res) => {
//   const { search } = req.query;

//   let query = { status: true };

//   // Search by name
//   if (search) {
//     query.name = { $regex: search, $options: "i" };
//   }

//   const chamberCities = await ChamberCity.find(query).sort({ createdAt: -1 });

//   res.status(200).json({
//     status: true,
//     message: "Chamber cities fetched successfully",
//     data: chamberCities,
//   });
// });

const ChamberCity = require("../../../models/chamberCity");
const ChamberDate = require("../../../models/ChamberDate");
const catchAsync = require("../../../utils/catchAsync");

exports.getAllChamberCities = catchAsync(async (req, res) => {
  const { search, dateSearch } = req.query;

  // Build query for chamber cities
  let cityQuery = { status: true };

  // Search by chamber city name
  if (search) {
    cityQuery.name = { $regex: search, $options: "i" };
  }

  // Fetch all chamber cities
  const chamberCities = await ChamberCity.find(cityQuery).sort({
    createdAt: -1,
  });

  // Build query for chamber dates
  let dateQuery = {
    chamberCity: { $in: chamberCities.map((city) => city._id) }, // Match dates for fetched cities
    date: { $gte: new Date().setHours(0, 0, 0, 0) }, // Present or future dates
  };

  // Search by date (exact or partial match)
  if (dateSearch) {
    try {
      const searchDate = new Date(dateSearch);
      if (!isNaN(searchDate)) {
        // Normalize to start and end of day for exact date match
        const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
        dateQuery.date = { $gte: startOfDay, $lte: endOfDay };
      } else {
        console.warn(`Invalid date format in dateSearch: ${dateSearch}`);
      }
    } catch (error) {
      console.warn(`Error parsing dateSearch: ${error.message}`);
    }
  }

  // Fetch chamber dates for all cities
  const chamberDates = await ChamberDate.find(dateQuery)
    .select("chamberCity date") // Select only necessary fields
    .sort({ date: -1 });

  // Map chamber cities with their associated dates
  const result = chamberCities.map((city) => ({
    ...city._doc, // Spread city document
    dates: chamberDates
      .filter((date) => date.chamberCity.toString() === city._id.toString())
      .map((date) => date.date), // Include only the date field
  }));

  res.status(200).json({
    status: true,
    message: "Chamber cities and their dates fetched successfully",
    data: result,
  });
});
