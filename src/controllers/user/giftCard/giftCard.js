const Astrologer = require("../../../models/asteroLogerSchema");
const GiftCard = require("../../../models/giftCard");
const Transaction = require("../../../models/transaction");
const User = require("../../../models/user");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");

exports.getAllGiftCards = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  let query = {};

  if (search) {
    query.$or = [{ name: { $regex: search, $options: "i" } }];
  }

  const giftCards = await GiftCard.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    status: true,

    message: "Gift cards fetched successfully",
    data: giftCards,
  });
});

exports.sendGiftCard = catchAsync(async (req, res, next) => {
  const { astrologerId, giftCardId } = req.body;

  const userId = req.user._id;
  // Validate required fields
  if (!userId || !astrologerId || !giftCardId) {
    return next(
      new AppError("User ID, astrologer ID, and gift card ID are required", 400)
    );
  }

  // Fetch user, astrologer, and gift card
  const user = await User.findById(userId);
  const astrologer = await Astrologer.findById(astrologerId);
  const giftCard = await GiftCard.findById(giftCardId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }
  if (!astrologer) {
    return next(new AppError("Astrologer not found", 404));
  }
  if (!giftCard) {
    return next(new AppError("Gift card not found", 404));
  }

  // Calculate user's actual balance
  const actualBalance = user.wallet.balance - user.wallet.lockedBalance;

  // Check if user has sufficient balance
  if (actualBalance < giftCard.amount) {
    return next(
      new AppError(
        `Insufficient wallet balance. Please recharge your wallet. Required: ${giftCard.amount}, Available: ${actualBalance}`,
        400
      )
    );
  }

  try {
    // Deduct amount from user's wallet
    user.wallet.balance -= giftCard.amount;
    await user.save();

    // Add amount to astrologer's wallet
    astrologer.wallet.balance += giftCard.amount;
    await astrologer.save();

    // Create transaction record
    const transaction = await Transaction.create({
      amount: giftCard.amount,
      user: userId,
      astrologer: astrologerId,
      description: `Gift card (${giftCard.name}) sent to astrologer ${astrologer.name}`,
      status: "success",
      type: "giftCard",
      isSettled: true,
    });

    // Populate references for response
    await transaction.populate("user astrologer");

    res.status(201).json({
      status: true,
      message: "Gift card sent successfully",
      data: {
        transaction,
        giftCard,
        userWallet: user.wallet,
        astrologerWallet: astrologer.wallet,
      },
    });
  } catch (error) {
    return next(error);
  }
});
