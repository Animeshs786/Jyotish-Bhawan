const User = require("../../../models/user");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const generateOtp = require("../../../utils/generateOtp");
const axios = require("axios");

// Utility function to validate and trim mobile number
const validateMobile = (mobile) => {
  if (!mobile) throw new AppError("Mobile number is required.", 400);
  mobile = String(mobile).trim();

  if (
    isNaN(mobile) ||
    mobile.includes("e") ||
    mobile.includes(".") ||
    mobile.length > 10
  ) {
    throw new AppError("Invalid mobile number.", 400);
  }

  return mobile;
};

// const sendOtp = async (mobile, otp) => {
//   const apiUrl = `http://www.commnestsms.com/api/push.json?apikey=67bd782d034d8&route=transactional&sender=MEDEXA&mobileno=${mobile}&text=Your%20OTP%20Verification%20Code%20is%20${otp}.%20Do%20not%20share%20it%20with%20anyone.%0AMED%20EXAMS`;
//   try {
//     await axios.get(apiUrl);
//   } catch (error) {
//     console.error("Error sending OTP:", error);
//   }
// };

const sendOtp = async (mobile, otp) => {
  const apiUrl = "https://unify.smsgateway.center/SMSApi/send"; // Use the base send endpoint

  const data = new URLSearchParams({
    userid: "jyotishbhavan", // Replace with your actual username
    password: "India@7421", // Replace with your actual password
    sendMethod: "quick",
    mobile: "91"+mobile, // Use the provided mobile number
    msg: `Your OTP is ${otp} for authentication at Jyotish Bhawan India`,
    senderid: "JYOBHN", // Replace with your approved Sender ID
    msgType: "text",
    duplicatecheck: "true",
    output: "json",
    template_id: "1207174399055774983" // Replace with your approved DLT Template ID
  });

  try {
    const response = await axios.post(apiUrl, data, {
      headers: {
        "apikey": "1eb54410475227f3699efefde5b6b4a08e8bc1f9", // Replace with your valid API key
        "Content-Type": "application/x-www-form-urlencoded",
        "cache-control": "no-cache"
      }
    });
    console.log("OTP sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending OTP:", error.response?.data || error.message);
    throw error;
  }
};

const processOtpAndUser = async (identifier, field) => {
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
  let newUser = false;

  let query = {};
  query[field] = identifier;

  let user = await User.findOne(query);

  if (!user) {
    const userData = { [field]: identifier };
    user = await User.create(userData);
    newUser = true;
  }

  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save();
  user.otp = undefined;

  if (field === "mobile") {
    await sendOtp(identifier, otp);
  }

  return { user, newUser, otpExpiry };
};

exports.signUp = catchAsync(async (req, res, next) => {
  const { mobile, email } = req.body;
  let type;

  if (!mobile && !email) {
    return next(
      new AppError("Either mobile number or email is required.", 400)
    );
  }

  let identifier, field;

  if (mobile) {
    identifier = validateMobile(mobile);
    field = "mobile";
    type = "mobile";
  }

  if (email) {
    if (!email.includes("@") || !email.includes(".")) {
      return next(new AppError("Invalid email address.", 400));
    }
    identifier = email.trim().toLowerCase();
    field = "email";
    type = "email";
  }

  const { user, newUser, otpExpiry } = await processOtpAndUser(
    identifier,
    field
  );

  return res.status(200).json({
    status: true,
    message: "OTP has been sent",
    data: {
      mobile: user[field] === "mobile" ? user[field] : "",
      email: user[field] === "email" ? user[field] : "",
      otpExpiry,
      user,
      type,
    },
    newUser,
  });
});
