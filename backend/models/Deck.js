const mongoose = require("mongoose");

const deckSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: { type: String, required: true },

    commanderLocked: {
      type: Boolean,
      default: false,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    visibilityPrompted: {
      type: Boolean,
      default: false,
    },

    commanders: [
      {
        type: Object, // full card snapshot
        required: true,
      },
    ],

    deckCards: [
      {
        card: {
          type: Object, // full card snapshot
          required: true,
        },
        quantity: { type: Number, default: 1 },
        role: { type: String, default: "mainboard" },
      },
    ],

    bannerSettings: {
      y: { type: Number, default: 25 },
      leftFade: { type: Number, default: 0.7 },
      rightFade: { type: Number, default: 0.2 },
      color: { type: String, default: "black" },
    },

    bannerRGB: { type: [Number], default: [168, 85, 247] },
    cardHeight: { type: String, default: "normal" },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deck", deckSchema);
