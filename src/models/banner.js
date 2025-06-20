const mongoose = require("mongoose");
const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "",
  },
  image: String,
  priority: {
    type: Number,
    default: 1,
  },
  platform: {
    type: String,
    enum: ["web", "mobile", "both"],
    default: "both",
  },
  redirect: {
    type: String,
    enum: ["internal", "external", "none"],
    default: "none",
  },
  type: {
    type: String,
    enum: ["image", "video"],
    default: "image",
  },
  bannerType: {
    type: String,
    enum: ["platform", "advertise", "refer", "marketing","category"],
    default: "platform",
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  redirectUrl: {
    type: String,
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Banner = new mongoose.model("Banner", bannerSchema);
module.exports = Banner;
