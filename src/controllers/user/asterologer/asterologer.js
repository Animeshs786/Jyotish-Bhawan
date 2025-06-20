const Astrologer = require("../../../models/asteroLogerSchema");
const Transaction = require("../../../models/transaction");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const pagination = require("../../../utils/pagination");

exports.getAllAstrologers = catchAsync(async (req, res) => {
  const {
    search,
    status,
    isChat,
    isCall,
    isVideo,
    speciality,
    isExpert,
    page: currentPage,
    limit: currentLimit,
  } = req.query;

  let query = { isVerify: true };

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ];
  }

  if (speciality) query.speciality = { $in: [speciality] };
  // Status filter
  if (status) {
    query.status = status;
  }

  // Service filters (isChat, isCall, isVideo)
  if (isChat !== undefined) {
    query["services.chat"] = isChat === "true";
  }
  if (isCall !== undefined) {
    query["services.voice"] = isCall === "true";
  }
  if (isVideo !== undefined) {
    query["services.video"] = isVideo === "true";
  }
  if (isExpert) {
    query.isExpert = isExpert;
  }

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Astrologer,
    null,
    query
  );

  const astrologers = await Astrologer.find(query)
    .populate("speciality")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Astrologers fetched successfully",
    data: astrologers,
  });
});

exports.getTrendingAstrologers = catchAsync(async (req, res) => {
  const { page: currentPage, limit: currentLimit } = req.query;

  // Calculate date for transactions within the last 15 days
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  // Aggregate transactions to count per astrologer
  const transactionStats = await Transaction.aggregate([
    {
      $match: {
        createdAt: { $gte: fifteenDaysAgo },
        status: "success",
        type: { $in: ["chat", "voice", "video"] },
      },
    },
    {
      $group: {
        _id: "$astrologer",
        transactionCount: { $sum: 1 },
      },
    },
    {
      $sort: { transactionCount: -1 },
    },
  ]);

  // Get all verified, non-blocked astrologers
  const query = {
    isBlock: false,
    isVerify: true,
  };

  const { limit, skip, totalResult, totalPage } = await pagination(
    currentPage,
    currentLimit,
    Astrologer,
    null,
    query
  );

  const astrologers = await Astrologer.find(query)
    .populate("speciality")
    .skip(skip)
    .limit(limit)
    .lean();

  // Merge transaction stats with astrologers and sort
  const trendingAstrologers = astrologers
    .map((astrologer) => {
      const transactionStat = transactionStats.find(
        (stat) => stat._id.toString() === astrologer._id.toString()
      );
      return {
        ...astrologer,
        transactionCount: transactionStat ? transactionStat.transactionCount : 0,
      };
    })
    .sort((a, b) => {
      // Primary sort: transaction count (descending)
      if (b.transactionCount !== a.transactionCount) {
        return b.transactionCount - a.transactionCount;
      }
      // Secondary sort: online status (online before offline)
      if (a.status !== b.status) {
        return a.status === "online" ? -1 : 1;
      }
      // Tertiary sort: busy status (non-busy before busy)
      if (a.isBusy !== b.isBusy) {
        return a.isBusy ? 1 : -1;
      }
      // Final sort: experience (descending)
      return b.experience - a.experience;
    });

  res.status(200).json({
    status: true,
    totalResult,
    totalPage,
    message: "Trending astrologers fetched successfully",
    data: trendingAstrologers,
  });
});

exports.getAstrologer = catchAsync(async (req, res, next) => {
  const astrologer = await Astrologer.findById(req.params.id).populate(
    "speciality"
  );

  if (!astrologer) {
    return next(new AppError("Astrologer not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Astrologer fetched successfully",
    data: astrologer,
  });
});
