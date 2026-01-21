const mongoose = require("mongoose");

const collectionEntrySchema = new mongoose.Schema(
    {
        //owner of card
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        card: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Card",
            required: true,
            index: true,
        },
        condition: {
            type: String,
            enum: ["NM", "LP", "MP", "HP", "DMG"],
            default: "NM",
        },
        language: {
            type: String,
            default: "en",
            trim: true,
            minlength: 2,
            maxlength: 5,
        },
        isSigned: {
            type: Boolean,
            default: false,
        },
        isAltered: {
            type: Boolean,
            default: false,
        },
        qtyOwned: {
            type: Number,
            min: 0,
            default: 0,
        },
        qtyWanted: {
            type: Number,
            min: 0,
            default: 0,
        },
        finish: {
            type: String,
            enum: ["nonfoil", "foil", "etched"],
            default: "nonfoil",
        },
        //user notes trade? deck? burn on sight etc...
        notes: {
            type: String,
            default: "",
            maxlength: 500,
            trim: true,
        },
    },
    { timestamps: true }
);

//prevent duplicate card entries per user
collectionEntrySchema.index(
    { 
        user: 1,
        card: 1,
        finish: 1,
        condition: 1,
        language: 1,
        isSigned: 1,
        isAltered: 1,
    }, 
    { unique: true }
);

module.exports = mongoose.model("CollectionEntry", collectionEntrySchema);