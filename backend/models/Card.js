const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
    {
        //Scryfall identifiers
        scryfallId:  {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        oracleId: {
            type: String,
            index: true,  //same card across multiple printings
        },
        //core display info
        name: {
            type: String,
            required: true,
            index: true,
        },
        manaCost: String,
        cmc: Number,
        typeLine: String,
        colors: [String],
        colorIdentity: [String],
        imageSmall: String,
        imageNormal: String,
        setCode: String,
        setName: String,
        collectorNumber: String,
        rarity: {
            type: String,
            enum: ["common", "uncommon", "rare", "mythic"],
        },
        legalities: {
            commander: String,
            modern: String,
            legacy: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Card", cardSchema);