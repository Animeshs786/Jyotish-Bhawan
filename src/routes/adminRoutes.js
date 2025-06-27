const express = require("express");

const { register } = require("../controllers/admin/authController/register");
const { login } = require("../controllers/admin/authController/login");
const {
  adminAuthenticate,
} = require("../controllers/admin/authController/adminAuthenticate");
const fileUploader = require("../middleware/fileUploader");
const {
  createBanner,
  getAllBanners,
  getBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/admin/banner/banner");
const {
  createBlog,
  getAllBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
} = require("../controllers/admin/blog/blog");
const {
  createAstrologer,
  getAllAstrologers,
  getAstrologer,
  updateAstrologer,
  deleteAstrologer,
} = require("../controllers/admin/asterologer/asterologer");
const {
  createSpeciality,
  getAllSpecialities,
  getSpeciality,
  updateSpeciality,
  deleteSpeciality,
} = require("../controllers/admin/speciality/speciality");
const { profile } = require("../controllers/admin/authController/profile");
const {
  updatePassword,
} = require("../controllers/admin/authController/updatePassword");
const {
  updateAdminProfile,
} = require("../controllers/admin/authController/updateProfile");
const { createRole } = require("../controllers/admin/role/createRole");
const { getAllRoles } = require("../controllers/admin/role/getAllRole");
const { getRoleById } = require("../controllers/admin/role/getRole");
const { updateRole } = require("../controllers/admin/role/updateRole");
const { deleteRole } = require("../controllers/admin/role/deleteRole");
const {
  getAllMember,
} = require("../controllers/admin/authController/getAllMember");
const {
  createRechargePlan,
  getAllRechargePlans,
  getRechargePlan,
  updateRechargePlan,
  deleteRechargePlan,
} = require("../controllers/admin/rechargePlan/rechargePlan");
const {
  getTransactionHistory,
  getTransation,
} = require("../controllers/admin/transaction/transaction");
const {
  createImage,
  getAllImages,
  updateImage,
  getImage,
  deleteImage,
} = require("../controllers/admin/imageUploader/imageUploader");
const {
  createSettlement,
  getAllSettlements,
  getSettlementDetail,
  completeSettlement,
} = require("../controllers/admin/settlement/settlement");
const {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/admin/user/user");
const {
  createRating,
  getAllRatings,
  getRating,
  updateRating,
  deleteRating,
} = require("../controllers/admin/rating/rating");
const {
  createChamberPackage,
  getAllChamberPackages,
  getChamberPackage,
  updateChamberPackage,
  deleteChamberPackage,
} = require("../controllers/admin/chamberPackage/chamberPackage");
const {
  createChamberCity,
  getAllChamberCities,
  getChamberCity,
  updateChamberCity,
  deleteChamberCity,
} = require("../controllers/admin/chamberCity/chamberCity");
const {
  createChamberDate,
  getAllChamberDates,
  getChamberDate,
  updateChamberDate,
  deleteChamberDate,
} = require("../controllers/admin/chamberDate/chamberDate");
const {
  createProductCategory,
  getAllProductCategories,
  getProductCategory,
  updateProductCategory,
  deleteProductCategory,
} = require("../controllers/admin/productCategory/productCategory");
const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/admin/product/product");
const {
  createProductVariant,
  getAllProductVariants,
  getProductVariant,
  updateProductVariant,
  deleteProductVariant,
} = require("../controllers/admin/productVariant/productVariant");
const {
  createCoupon,
  getAllCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/admin/coupon/coupon");
const {
  getAllProductTransactions,
  getProductTransaction,
} = require("../controllers/admin/productTransaction/productTransaction");
const {
  createDakshina,
  getAllDakshinas,
  getDakshina,
  updateDakshina,
  deleteDakshina,
} = require("../controllers/admin/dakshina/dakshina");
const {
  createBookBanner,
  getAllBookBanners,
  getBookBanner,
  updateBookBanner,
  deleteBookBanner,
} = require("../controllers/admin/bookBanner/bookBanner");
const {
  getAllBannerTransaction,
  getBannerTransaction,
} = require("../controllers/admin/bannerTransaction/bannerTransaction");
const {
  createConsultationPackage,
  getAllConsultationPackages,
  getConsultationPackage,
  updateConsultationPackage,
  deleteConsultationPackage,
} = require("../controllers/admin/consultationPackage/consultationPackage");
const {
  createPackageAstrologer,
  getAllPackageAstrologers,
  getPackageAstrologer,
  updatePackageAstrologer,
  deletePackageAstrologer,
} = require("../controllers/admin/packageAstrologer/packageAstrologer");
const {
  createGiftCard,
  getAllGiftCards,
  getGiftCard,
  updateGiftCard,
  deleteGiftCard,
} = require("../controllers/admin/giftCard/giftCard");
const { createAstrologerSchedule, getAllAstrologerSchedules, getAstrologerSchedule, updateAstrologerSchedule, deleteAstrologerSchedule } = require("../controllers/admin/astrologerSchedule/astrologerSchedule");

const router = express.Router();

//Authentication
router.post(
  "/register",
  fileUploader([{ name: "profileImage", maxCount: 1 }], "admin"),
  register
);
router.post("/login", login);

router.use(adminAuthenticate);

router.get("/profile", profile);
router.patch(
  "/profile",
  fileUploader([{ name: "profileImage", maxCount: 1 }], "admin"),
  updateAdminProfile
);
router.patch("/passwordUpdate", updatePassword);
router.get("/member", getAllMember);

//Banner
router
  .route("/banner")
  .post(fileUploader([{ name: "image", maxCount: 1 }], "Banner"), createBanner)
  .get(getAllBanners);
router
  .route("/banner/:id")
  .get(getBanner)
  .patch(fileUploader([{ name: "image", maxCount: 1 }], "Banner"), updateBanner)
  .delete(deleteBanner);

//blog
router
  .route("/blog")
  .post(
    fileUploader(
      [
        { name: "thumbImage", maxCount: 1 },
        { name: "image", maxCount: 10 },
      ],
      "Blog"
    ),
    createBlog
  )
  .get(getAllBlogs);

router
  .route("/blog/:id")
  .get(getBlog)
  .patch(
    fileUploader(
      [
        { name: "thumbImage", maxCount: 1 },
        { name: "image", maxCount: 10 },
      ],
      "Blog"
    ),
    updateBlog
  )
  .delete(deleteBlog);

//astorloger
router
  .route("/astrologer")
  .post(
    fileUploader(
      [
        { name: "profileImage", maxCount: 1 },
        { name: "documentImage", maxCount: 5 },
      ],
      "Astrologer"
    ),
    createAstrologer
  )
  .get(getAllAstrologers);

router
  .route("/astrologer/:id")
  .get(getAstrologer)
  .patch(
    fileUploader(
      [
        { name: "profileImage", maxCount: 1 },
        { name: "documentImage", maxCount: 5 },
      ],
      "Astrologer"
    ),
    updateAstrologer
  )
  .delete(deleteAstrologer);

//specialty
router.route("/speciality").post(createSpeciality).get(getAllSpecialities);

router
  .route("/speciality/:id")
  .get(getSpeciality)
  .patch(updateSpeciality)
  .delete(deleteSpeciality);

//role
router.route("/role").post(createRole).get(getAllRoles);
router.route("/role/:id").get(getRoleById).patch(updateRole).delete(deleteRole);

//rechargePlan
router.route("/rechargePlan").post(createRechargePlan).get(getAllRechargePlans);

router
  .route("/rechargePlan/:id")
  .get(getRechargePlan)
  .patch(updateRechargePlan)
  .delete(deleteRechargePlan);

//transaction
router.get("/transaction", getTransactionHistory);
router.get("/transaction/:id", getTransation);

//image uploader
router
  .route("/image")
  .post(
    fileUploader([{ name: "image", maxCount: 1 }], "imageBulk"),
    createImage
  )
  .get(getAllImages);

router
  .route("/image/:id")
  .patch(
    fileUploader([{ name: "image", maxCount: 1 }], "imageBulk"),
    updateImage
  )
  .get(getImage)
  .delete(deleteImage);

//settlement
router.route("/settlement").post(createSettlement).get(getAllSettlements);
router
  .route("/settlement/:id")
  .get(getSettlementDetail)
  .patch(
    fileUploader([{ name: "receiptImage", maxCount: 1 }], "Settlement"),
    completeSettlement
  );

//user
router
  .route("/user")
  .post(
    fileUploader([{ name: "profileImage", maxCount: 1 }], "User"),
    createUser
  )
  .get(getAllUsers);

router
  .route("/user/:id")
  .get(getUser)
  .patch(
    fileUploader([{ name: "profileImage", maxCount: 1 }], "User"),
    updateUser
  )
  .delete(deleteUser);

//rating
router.route("/rating").post(createRating).get(getAllRatings);

router
  .route("/rating/:id")
  .get(getRating)
  .patch(updateRating)
  .delete(deleteRating);

//Chamber  City
router
  .route("/chamberCity")
  .post(
    fileUploader([{ name: "image", maxCount: 1 }], "ChamberCity"),
    createChamberCity
  )
  .get(getAllChamberCities);

router
  .route("/chamberCity/:id")
  .get(getChamberCity)
  .patch(
    fileUploader([{ name: "image", maxCount: 1 }], "ChamberCity"),
    updateChamberCity
  )
  .delete(deleteChamberCity);

//chamber Package
router
  .route("/chamberPackage")
  .post(
    fileUploader([{ name: "image", maxCount: 1 }], "ChamberPackage"),
    createChamberPackage
  )
  .get(getAllChamberPackages);

router
  .route("/chamberPackage/:id")
  .get(getChamberPackage)
  .patch(
    fileUploader([{ name: "image", maxCount: 1 }], "ChamberPackage"),
    updateChamberPackage
  )
  .delete(deleteChamberPackage);

//chamber date
router.route("/chamberDate").post(createChamberDate).get(getAllChamberDates);

router
  .route("/chamberDate/:id")
  .get(getChamberDate)
  .patch(updateChamberDate)
  .delete(deleteChamberDate);

//product category
router
  .route("/productCategory")
  .post(
    fileUploader([{ name: "image", maxCount: 1 }], "ProductCategory"),
    createProductCategory
  )
  .get(getAllProductCategories);

router
  .route("/productCategory/:id")
  .get(getProductCategory)
  .patch(
    fileUploader([{ name: "image", maxCount: 1 }], "ProductCategory"),
    updateProductCategory
  )
  .delete(deleteProductCategory);

//product
router
  .route("/product")
  .post(
    fileUploader(
      [
        { name: "thumbImage", maxCount: 1 },
        { name: "images", maxCount: 5 },
      ],
      "Product"
    ),
    createProduct
  )
  .get(getAllProducts);

router
  .route("/product/:id")
  .get(getProduct)
  .patch(
    fileUploader(
      [
        { name: "thumbImage", maxCount: 1 },
        { name: "images", maxCount: 5 },
      ],
      "Product"
    ),
    updateProduct
  )
  .delete(deleteProduct);

router
  .route("/productVariant")
  .post(createProductVariant)
  .get(getAllProductVariants);

router
  .route("/productVariant/:id")
  .get(getProductVariant)
  .patch(updateProductVariant)
  .delete(deleteProductVariant);

//coupon
router.route("/coupon").post(createCoupon).get(getAllCoupons);

router
  .route("/coupon/:id")
  .get(getCoupon)
  .patch(updateCoupon)
  .delete(deleteCoupon);

//product transa
router.get("/productTransaction", getAllProductTransactions);
router.get("/productTransaction/:id", getProductTransaction);

//dakshina
router.route("/dakshina").post(createDakshina).get(getAllDakshinas);

router
  .route("/dakshina/:id")
  .get(getDakshina)
  .patch(updateDakshina)
  .delete(deleteDakshina);

//book banner
router
  .route("/bookBanner")
  .post(
    fileUploader([{ name: "image", maxCount: 1 }], "BookBanner"),
    createBookBanner
  )
  .get(getAllBookBanners);

router
  .route("/bookBanner/:id")
  .get(getBookBanner)
  .patch(
    fileUploader([{ name: "image", maxCount: 1 }], "BookBanner"),
    updateBookBanner
  )
  .delete(deleteBookBanner);

//banner transaction
router.route("/bannerTransaction").get(getAllBannerTransaction);
router.route("/bannerTransaction/:id").get(getBannerTransaction);

//consultation Package
router
  .route("/consultationPackage")
  .post(
    fileUploader(
      [
        { name: "thumbImage", maxCount: 1 },
        { name: "image", maxCount: 1 },
      ],
      "ConsultationPackage"
    ),
    createConsultationPackage
  )
  .get(getAllConsultationPackages);

router
  .route("/consultationPackage/:id")
  .get(getConsultationPackage)
  .patch(
    fileUploader(
      [
        { name: "thumbImage", maxCount: 1 },
        { name: "image", maxCount: 1 },
      ],
      "ConsultationPackage"
    ),
    updateConsultationPackage
  )
  .delete(deleteConsultationPackage);

//package astrologer
router
  .route("/packageAstrologer")
  .post(createPackageAstrologer)
  .get(getAllPackageAstrologers);

router
  .route("/packageAstrologer/:id")
  .get(getPackageAstrologer)
  .patch(updatePackageAstrologer)
  .delete(deletePackageAstrologer);

//gift card
router
  .route("/giftCard")
  .post(
    fileUploader([{ name: "image", maxCount: 1 }], "GiftCard"),
    createGiftCard
  )
  .get(getAllGiftCards);

router
  .route("/giftCard/:id")
  .get(getGiftCard)
  .patch(
    fileUploader([{ name: "image", maxCount: 1 }], "GiftCard"),
    updateGiftCard
  )
  .delete(deleteGiftCard);

//astrologer Schedule
router
  .route("/astrologerSchedule")
  .post(createAstrologerSchedule)
  .get(getAllAstrologerSchedules);

router
  .route("/astrologerSchedule/:id")
  .get(getAstrologerSchedule)
  .patch(updateAstrologerSchedule)
  .delete(deleteAstrologerSchedule);

module.exports = router;
