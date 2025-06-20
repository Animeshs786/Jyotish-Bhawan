const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trime: true,
  },
  discountType: {
    type: String,
    enum: ["flat", "percentage"],
    default: "flat",
  },
  minAmount: {
    type: Number,
    default: 0, // if set 0 means no minimum amount required
  },
  product: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ], //if empty then coupon valid for all the product if add then valid only for those product
  discountValue: {
    type: Number,
    required: true,
  },
  useCount: {
    type: Number,
    default: 1, //how many time user can use this coupon if only one time if 2 then one user use this coupon two time
  },
  expire: {
    type: Date, //if not set expiry date use life time
  },
  createdAt: { type: Date, default: Date.now },
});

const Coupon = mongoose.model("Coupon", couponSchema);
module.exports = Coupon;
