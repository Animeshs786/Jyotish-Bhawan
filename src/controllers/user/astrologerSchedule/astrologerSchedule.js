const moment = require("moment-timezone");
const catchAsync = require("../../../utils/catchAsync");
const AstrologerSchedule = require("../../../models/astrologerSchedule");

moment.tz.setDefault("Asia/Kolkata");

exports.getAllAstrologerSchedules = catchAsync(async (req, res, next) => {
  const { search, consultationPackage, astrologer, marriagePackage } = req.query;

  // Get current date and time in Asia/Kolkata
  const now = moment().tz("Asia/Kolkata");

  // Convert to UTC for MongoDB date comparison
  const startOfDayUTC = now.clone().startOf("day").utc().toDate();
  const endOfDayUTC = now.clone().endOf("day").utc().toDate();

  let query = {
    $or: [
      {
        date: { $gt: now.toDate() }, // Future dates
      },
      {
        date: {
          $gte: startOfDayUTC,
          $lte: endOfDayUTC,
        },
        endTime: {
          $gte: now.format("HH:mm"),
        },
      },
    ],
  };

  if (search) {
    query.$and = [
      query.$or,
      {
        $or: [
          {
            isAvailable:
              search.toLowerCase() === "true" ||
              search.toLowerCase() === "false"
                ? search.toLowerCase() === "true"
                : undefined,
          },
        ].filter(Boolean),
      },
    ];
    delete query.$or;
  }

  if (astrologer) query.astrologer = astrologer;
  if (consultationPackage) query.consultationPackage = consultationPackage;
  if (marriagePackage) query.marriagePackage = marriagePackage;

  console.log("Query:", JSON.stringify(query, null, 2)); // Debug the query

  const schedules = await AstrologerSchedule.find(query).sort({
    date: 1,
    startTime: 1,
  });

  res.status(200).json({
    status: true,
    message: "Astrologer schedules fetched successfully",
    data: schedules,
  });
});
