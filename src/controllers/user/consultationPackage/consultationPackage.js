const ConsultationPackage = require("../../../models/consultationPackage");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");

exports.getAllConsultationPackages = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  let query = {status:true};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { about: { $regex: search, $options: "i" } },
    ];
  }

  const consultationPackages = await ConsultationPackage.find(query).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: true,
    message: "Consultation packages fetched successfully",
    data: consultationPackages,
  });
});

exports.getConsultationPackage = catchAsync(async (req, res, next) => {
  const consultationPackage = await ConsultationPackage.findById(req.params.id);

  if (!consultationPackage) {
    return next(new AppError("Consultation package not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Consultation package fetched successfully",
    data: consultationPackage,
  });
});
