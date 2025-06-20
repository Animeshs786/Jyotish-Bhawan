const express = require("express");
const { signUp } = require("../controllers/user/authController/signUp");
const { otpVerify } = require("../controllers/user/authController/otpVerify");
const {
  userAuthenticate,
} = require("../controllers/user/authController/userAuthenticate");
const { getProfile } = require("../controllers/user/authController/getProfile");
const {
  updateProfile,
} = require("../controllers/user/authController/updateProfile");
const { getAllBlogs, getBlog } = require("../controllers/user/blog/blog");
const {
  getAllSpecialities,
  getSpeciality,
} = require("../controllers/user/speciality/speciality");
const fileUploader = require("../middleware/fileUploader");
const {
  getAllAstrologers,
  getAstrologer,
  getTrendingAstrologers,
} = require("../controllers/user/asterologer/asterologer");
const {
  getAllRechargePlans,
} = require("../controllers/user/rechargePlan/rechargePlan");
const {
  rechargeWallet,
  getWalletBalance,
} = require("../controllers/user/wallet/wallet");
const {
  getTransactionHistory,
} = require("../controllers/user/transaction/transaction");
const {
  getChatRequests,
  getSessionMessage,
  setNotRespond,
} = require("../controllers/user/chat/chat");
const { getChatSession } = require("../controllers/user/chat/chat");
const { getAllBanners } = require("../controllers/user/banner/banner");
const copyDatabase = require("../controllers/dbBackUp");
const {
  createRating,
  getAllRatings,
  getRating,
  updateRating,
} = require("../controllers/user/rating/rating");
const {
  createMember,
  getAllMembers,
  getMember,
  updateMember,
  deleteMember,
} = require("../controllers/user/member/member");
const {
  getDailyHoroscope,
  getKundliDetails,
  matchKundli,
  getTomorrowHoroscope,
  getYesterdayHoroscope,
  getMonthlyHoroscope,
} = require("../controllers/user/horoscope/horoscope");
const {
  getAllChamberPackages,
} = require("../controllers/user/chamberPackage/chamberPackage");
const {
  getAllChamberCities,
} = require("../controllers/user/chambercity/chamberCity");
const {
  getAllChamberDates,
} = require("../controllers/user/chamberDate/chamberDate");
const {
  createChamberCart,
  getAllChamberCarts,
  getChamberCart,
  updateChamberCart,
  deleteChamberCart,
} = require("../controllers/user/chamberCart/chamberCart");
const {
  createChamberTransaction,
  getAllChamberTransactions,
  getChamberTransaction,
} = require("../controllers/user/transaction/chamberTransaction");
const {
  getAllProductCategories,
  getProductCategory,
} = require("../controllers/user/productCategory/productCategory");
const {
  createShipping,
  getAllShippings,
  getShipping,
  updateShipping,
  deleteShipping,
} = require("../controllers/user/shipping.js/shipping");
const {
  getAllProducts,
  getProduct,
} = require("../controllers/user/product/product");
const {
  createProductCart,
  getAllProductCarts,
  getProductCart,
  updateProductCart,
  deleteProductCart,
} = require("../controllers/user/productCart/productCart");
const {
  createProductTransaction,
  getAllProductTransactions,
  getProductTransaction,
} = require("../controllers/user/productTransaction/productTransaction");
const {
  getAllCoupons,
  applyCoupon,
} = require("../controllers/user/coupon/coupon");
const { createDakshina } = require("../controllers/admin/dakshina/dakshina");
const {
  getAllBookBanners,
  getBookBanner,
} = require("../controllers/user/bookBanner/bookBanner");
const {
  createBannerTransaction,
  getAllBannerTransaction,
  getBannerTransaction,
} = require("../controllers/user/bannerTransaction/bannerTransaction");
const { getAllConsultationPackages, getConsultationPackage } = require("../controllers/user/consultationPackage/consultationPackage");
const { getAllPackageAstrologers } = require("../controllers/user/packageAstrologer/packageAstrologer");
const { getAllGiftCards, sendGiftCard } = require("../controllers/user/giftCard/giftCard");

const router = express.Router();

//Authentication
router.post("/signUp", signUp);
router.post("/verifyOtp", otpVerify);

router.get("/profile", userAuthenticate, getProfile);
router.patch(
  "/profile",
  userAuthenticate,
  fileUploader([{ name: "profileImage", maxCount: 1 }], "User"),
  updateProfile
);

//blog
router.get("/blog", getAllBlogs);
router.get("/blog/:id", getBlog);

//speciality
router.get("/speciality", getAllSpecialities);
router.get("/speciality/:id", getSpeciality);

//asterologer
router.get("/asterologer", getAllAstrologers);
router.get("/trendingAstrologer", getTrendingAstrologers);
router.get("/asterologer/:id", getAstrologer);

//recahreg plan
router.get("/rechargePlan", getAllRechargePlans);

//wallet
router.post("/wallet", userAuthenticate, rechargeWallet);
router.get("/wallet", userAuthenticate, getWalletBalance);

//transaction
router.get("/transaction", userAuthenticate, getTransactionHistory);

//chat
router.get("/chatRequest", userAuthenticate, getChatRequests);
router.get("/chatSession", userAuthenticate, getChatSession);
router.get("/sessionMessage/:id", userAuthenticate, getSessionMessage);
router.get("/notRespond/:id", userAuthenticate, setNotRespond);

//banner
router.get("/banner", getAllBanners);

//rating
//rating
router.route("/rating").post(userAuthenticate, createRating).get(getAllRatings);

router.route("/rating/:id").get(getRating).patch(updateRating);

//member
router
  .route("/member")
  .post(userAuthenticate, createMember)
  .get(userAuthenticate, getAllMembers);
router
  .route("/member/:id")
  .get(userAuthenticate, getMember)
  .patch(userAuthenticate, updateMember)
  .delete(userAuthenticate, deleteMember);

//chamber package
router.get("/chamberPackage", getAllChamberPackages);

//chamber city
router.get("/chamberCity", getAllChamberCities);

//chamber date
router.get("/chamberDate", getAllChamberDates);

//chamber cart
router
  .route("/chamberCart")
  .post(userAuthenticate, createChamberCart)
  .get(userAuthenticate, getAllChamberCarts);

router
  .route("/chamberCart/:id")
  .get(userAuthenticate, getChamberCart)
  .patch(userAuthenticate, updateChamberCart)
  .delete(userAuthenticate, deleteChamberCart);

router
  .route("/chamberTransaction")
  .post(userAuthenticate, createChamberTransaction)
  .get(userAuthenticate, getAllChamberTransactions);
router.patch("/chamberTransaction/:id", getChamberTransaction);

//horoscope
router.post("/dailyHoroscope", getDailyHoroscope);
router.post("/tomorrowHoroscope", getTomorrowHoroscope);
router.post("/yesterdayHoroscope", getYesterdayHoroscope);
router.post("/monthlyHoroscope", getMonthlyHoroscope);
router.post("/kundli", getKundliDetails);
router.post("/matchKundli", matchKundli);

//product category
router.get("/productCategory", getAllProductCategories);
router.get("/productCategory/:id", getProductCategory);

//product
router.get("/product", getAllProducts);
router.get("/product/:id", getProduct);

//shipping
router
  .route("/shipping")
  .post(userAuthenticate, createShipping)
  .get(userAuthenticate, getAllShippings);

router
  .route("/shipping/:id")
  .get(userAuthenticate, getShipping)
  .patch(userAuthenticate, updateShipping)
  .delete(userAuthenticate, deleteShipping);

//product cart
router
  .route("/productCart")
  .post(userAuthenticate, createProductCart)
  .get(userAuthenticate, getAllProductCarts);

router
  .route("/productCart/:id")
  .get(userAuthenticate, getProductCart)
  .patch(userAuthenticate, updateProductCart)
  .delete(userAuthenticate, deleteProductCart);

//Product Transaction
router
  .route("/productTransaction")
  .post(userAuthenticate, createProductTransaction)
  .get(userAuthenticate, getAllProductTransactions);

router.get("/productTransaction/:id", getProductTransaction);

router.post("/coupon", getAllCoupons);
router.post("/applyCoupon", userAuthenticate, applyCoupon);

//dakshina
router.route("/dakshina").post(userAuthenticate, createDakshina);

//bookBanner
router.get("/bookBanner", getAllBookBanners);
router.get("/bookBanner/:id", getBookBanner);

//banner Transaction
router
  .route("/bannerTransaction")
  .post(userAuthenticate, createBannerTransaction)
  .get(userAuthenticate, getAllBannerTransaction);
router
  .route("/bannerTransaction/:id")
  .get(userAuthenticate, getBannerTransaction);


  //consultation package
  router.get("/consultationPackage", getAllConsultationPackages);
  router.get("/consultationPackage/:id", getConsultationPackage);


  //package astrologer
  router.get("/packageAstrologer", getAllPackageAstrologers);

  //gift
  router.get("/giftCard", getAllGiftCards);
  router.post("/sentGiftCard", userAuthenticate,sendGiftCard);

module.exports = router;
