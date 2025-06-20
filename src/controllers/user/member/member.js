const Member = require("../../../models/member"); // Adjust path to your Member model
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");

exports.createMember = catchAsync(async (req, res, next) => {
  const { name, relation, gender, dob, placeBirth, birthTime, language } =
    req.body;

  const user = req.user._id;

  // Validate required fields
  if (!name || !gender || !dob || !placeBirth || !birthTime || !language) {
    return next(
      new AppError(
        "Name, gender, date of birth, place of birth, birth time, and language are required",
        400
      )
    );
  }

  // Validate gender
  if (!["male", "female", "other"].includes(gender)) {
    return next(
      new AppError("Gender must be 'male', 'female', or 'other'", 400)
    );
  }

  // Validate dob format
  if (isNaN(new Date(dob).getTime())) {
    return next(new AppError("Invalid date of birth format", 400));
  }

  const memberData = {
    name,
    relation: relation || "",
    gender,
    dob,
    placeBirth,
    birthTime,
    user,
    language,
  };

  try {
    const newMember = await Member.create(memberData);

    res.status(201).json({
      status: true,
      message: "Member created successfully",
      data: newMember,
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllMembers = catchAsync(async (req, res) => {
  const { search } = req.query;

  const user = req.user._id;
  let query = {};
  if (user) {
    query.user = user;
  }

  // Search by name, relation, placeBirth, or language
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { relation: { $regex: search, $options: "i" } },
      { placeBirth: { $regex: search, $options: "i" } },
      { language: { $regex: search, $options: "i" } },
    ];
  }


  const members = await Member.find(query)
    .sort({ createdAt: -1 })

  res.status(200).json({
    status: true,
    message: "Members fetched successfully",
    data: members,
  });
});

exports.getMember = catchAsync(async (req, res, next) => {
  const member = await Member.findById(req.params.id);

  if (!member) {
    return next(new AppError("Member not found", 404));
  }

  res.status(200).json({
    status: true,
    message: "Member fetched successfully",
    data: member,
  });
});

exports.updateMember = catchAsync(async (req, res, next) => {
  const { name, relation, gender, dob, placeBirth, birthTime, language } =
    req.body;

  console.log(req.body, "body");
  const member = await Member.findById(req.params.id);

  if (!member) {
    return next(new AppError("Member not found", 404));
  }

  // Validate gender if provided
  if (gender && !["male", "female", "other"].includes(gender)) {
    return next(
      new AppError("Gender must be 'male', 'female', or 'other'", 400)
    );
  }

  // Validate dob format if provided
  if (dob && isNaN(new Date(dob).getTime())) {
    return next(new AppError("Invalid date of birth format", 400));
  }

  const memberData = {};

  if (name) memberData.name = name;
  if (relation !== undefined) memberData.relation = relation;
  if (gender) memberData.gender = gender;
  if (dob) memberData.dob = dob;
  if (placeBirth) memberData.placeBirth = placeBirth;
  if (birthTime) memberData.birthTime = birthTime;
  if (language) memberData.language = language;

  try {
    const updatedMember = await Member.findByIdAndUpdate(
      req.params.id,
      memberData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: "Member updated successfully",
      data: updatedMember,
    });
  } catch (error) {
    return next(error);
  }
});

exports.deleteMember = catchAsync(async (req, res, next) => {
  const member = await Member.findById(req.params.id);

  if (!member) {
    return next(new AppError("Member not found", 404));
  }

  await Member.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: true,
    message: "Member deleted successfully",
    data: null,
  });
});
