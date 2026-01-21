const mongoose = require("mongoose");
const CollectionEntry = require("../models/CollectionEntry");
const Card = require("../models/Card");

/**
 * Resolve a card reference.
 * Accepts:
 *  - Mongo ObjectId
 *  - Scryfall UUID
 *
 * If the card does not exist, it is auto-imported from Scryfall.
 */
async function resolveCard(cardId) {
  // 1️⃣ Mongo ObjectId
  if (mongoose.Types.ObjectId.isValid(cardId)) {
    const card = await Card.findById(cardId);
    if (card) return card;
  }

  // 2️⃣ Existing Scryfall card
  let card = await Card.findOne({ scryfallId: cardId });
  if (card) return card;

  // 3️⃣ Auto-import from Scryfall
  const resp = await fetch(`https://api.scryfall.com/cards/${cardId}`);

  if (!resp.ok) {
    throw new Error("SCRYFALL_FETCH_FAILED");
  }

  const data = await resp.json();

  card = await Card.create({
    name: data.name,
    scryfallId: data.id,
    oracleId: data.oracle_id,
    typeLine: data.type_line,
    oracleText: data.oracle_text,
    manaCost: data.mana_cost,
    cmc: data.cmc,
    colors: data.colors,
    colorIdentity: data.color_identity,
    set: data.set,
    setName: data.set_name,
    rarity: data.rarity,
    imageSmall: data.image_uris?.small ?? null,
    imageNormal: data.image_uris?.normal ?? null,
    imageLarge: data.image_uris?.large ?? null,
    prices: data.prices ?? {},
  });

  return card;
}

/**
 * POST /api/collection
 * Create or increment ownership entry
 */
exports.addOrUpdateEntry = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      cardId,
      finish = "nonfoil",
      condition = "NM",
      language = "en",
      isSigned = false,
      isAltered = false,
      qtyOwnedDelta = 0,
      qtyWantedDelta = 0,
      notes,
    } = req.body;

    if (!cardId) {
      return res.status(400).json({ error: "cardId is required" });
    }

    let card;
    try {
      card = await resolveCard(cardId);
    } catch (err) {
      if (err.message === "SCRYFALL_FETCH_FAILED") {
        return res
          .status(400)
          .json({ error: "Unable to fetch card from Scryfall" });
      }
      throw err;
    }

    const filter = {
      user: userId,
      card: card._id,
      finish,
      condition,
      language,
      isSigned,
      isAltered,
    };

    let entry = await CollectionEntry.findOne(filter);

    if (!entry) {
      entry = await CollectionEntry.create({
        ...filter,
        qtyOwned: 0,
        qtyWanted: 0,
        notes: notes ?? "",
      });
    }

    entry.qtyOwned = Math.max(
      0,
      entry.qtyOwned + Number(qtyOwnedDelta || 0)
    );
    entry.qtyWanted = Math.max(
      0,
      entry.qtyWanted + Number(qtyWantedDelta || 0)
    );

    if (typeof notes === "string") {
      entry.notes = notes;
    }

    await entry.save();

    res.status(201).json({
      message: "Collection entry saved",
      entry,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: "That card variant already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/collection
 * List collection with optional search, sorting, and pagination
 */
exports.getMyCollection = async (req, res) => {
  try {
    const userId = req.user._id;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const sortKey = req.query.sort || "name";
    const order = req.query.order === "desc" ? -1 : 1;
    const search = (req.query.search || "").trim();

    const sortMap = {
      name: { "card.name": order },
      set: { "card.setName": order, "card.collectionNumber": order },
      qtyOwned: { qtyOwned: order },
      updated: { updatedAt: order },
      created: { createdAt: order },
    };

    const sort = sortMap[sortKey] || sortMap.name;

    // 🔎 Use aggregation so we can search populated card fields safely
    const pipeline = [
      { $match: { user: userId } },
      {
        $lookup: {
          from: "cards",
          localField: "card",
          foreignField: "_id",
          as: "card",
        },
      },
      { $unwind: "$card" },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "card.name": { $regex: search, $options: "i" } },
            { "card.typeLine": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    const totalPipeline = [...pipeline, { $count: "count" }];
    const totalResult = await CollectionEntry.aggregate(totalPipeline);
    const total = totalResult[0]?.count || 0;

    pipeline.push(
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    );

    const entries = await CollectionEntry.aggregate(pipeline);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      entries,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /api/collection/:id
 */
exports.updateEntry = async (req, res) => {
  try {
    const userId = req.user._id;

    const entry = await CollectionEntry.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const allowed = [
      "qtyOwned",
      "qtyWanted",
      "finish",
      "condition",
      "language",
      "isSigned",
      "isAltered",
      "notes",
    ];

    for (const key of allowed) {
      if (key in req.body) {
        entry[key] = req.body[key];
      }
    }

    entry.qtyOwned = Math.max(0, Number(entry.qtyOwned || 0));
    entry.qtyWanted = Math.max(0, Number(entry.qtyWanted || 0));

    await entry.save();

    res.json({ message: "Entry updated", entry });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: "That variant already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/collection/:id
 */
exports.deleteEntry = async (req, res) => {
  try {
    const userId = req.user._id;

    const deleted = await CollectionEntry.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/collection/total
 */
exports.getTotalOwned = async (req, res) => {
  try {
    const result = await CollectionEntry.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalOwned: { $sum: "$qtyOwned" },
        },
      },
    ]);

    res.json({ totalOwned: result[0]?.totalOwned || 0 });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate library total" });
  }
};
