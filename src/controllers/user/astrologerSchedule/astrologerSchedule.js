const moment = require("moment-timezone");
const catchAsync = require("../../../utils/catchAsync");
const AstrologerSchedule = require("../../../models/astrologerSchedule");

moment.tz.setDefault("Asia/Kolkata");

exports.getAllAstrologerSchedules = catchAsync(async (req, res, next) => {
  const { search, consultationPackage, astrologer } = req.query;

  // Get current date and time in Asia/Kolkata
  const now = moment();

  let query = {
    $or: [
      {
        date: { $gt: now.toDate() }, // Future dates
      },
      {
        date: {
          $gte: now.startOf("day").toDate(),
          $lte: now.endOf("day").toDate(),
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
