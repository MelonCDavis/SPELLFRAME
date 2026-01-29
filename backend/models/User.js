const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    /* =========================
       AUTH / IDENTITY
       ========================= */

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false, //
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: String,
    emailVerificationExpires: Date,

    passwordResetToken: String,
    passwordResetExpires: Date,

    /* =========================
       PROFILE / AVATAR
       ========================= */

    avatar: {
      source: {
        type: String,
        enum: ["default", "card"],
        default: "default",
      },

      // Used when source === "card"
      cardId: {
        type: String,
      },
      image: {
        type: String,
      },
      // Presentation-only zoom (clamped in UI + schema)
      zoom: {
        type: Number,
        default: 1,
        min: 1,
        max: 2.5,
      },

      // Normalized focal point (0 → 1 range)
      x: {
        type: Number,
        default: 0.5,
        min: 0,
        max: 1,
      },

      y: {
        type: Number,
        default: 0.5,
        min: 0,
        max: 1,
      },
    },

    // Founder / privileged user flag
    isFounder: {
      type: Boolean,
      default: false,
    },

  /* =========================
   DECK LIKES
   ========================= */

    likedDecks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deck",
      },
    ],

  },
  { timestamps: true }
);

//
// 🔐 INSTANCE METHODS
//

// Compare plaintext password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Create email verification token
userSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  this.emailVerificationExpires = Date.now() + 1000 * 60 * 60; // 1 hour

  return rawToken;
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 1000 * 60 * 60; // 1 hour

  return rawToken;
};

module.exports = mongoose.model("User", userSchema);
