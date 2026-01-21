// controllers/deckController.js
const mongoose = require("mongoose");
const Deck = require("../models/Deck");
const Card = require("../models/Card");
const User = require("../models/User");
const { validateSearchQuery } = require("../utils/validateSearchQuery");

async function ensureCard(cardData) {
  // NOTE: reserved for future deck-card normalization
  let card = await Card.findOne({ scryfallId: cardData.scryfallId });

  if (card) return card;

  // Create if missing
  return Card.create({
    scryfallId: cardData.scryfallId,
    oracleId: cardData.oracleId,
    name: cardData.name,
    manaCost: cardData.manaCost,
    cmc: cardData.cmc,
    typeLine: cardData.typeLine,
    oracleText: cardData.oracleText,
    colors: cardData.colors,
    colorIdentity: cardData.colorIdentity,
    imageSmall: cardData.imageSmall,
    imageNormal: cardData.imageNormal,
    setCode: cardData.setCode,
    setName: cardData.setName,
    collectorNumber: cardData.collectorNumber,
    rarity: cardData.rarity,
    legalities: cardData.legalities,
  });
}

/**
 * POST /api/decks
 * Create or update a deck (backend owns _id)
 */
exports.saveDeck = async (req, res) => {
  try {
    const data = req.body;

    // If you expect auth, fail clearly (prevents req.user undefined 500s)
    if (!req.user?._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!data?.name || !Array.isArray(data.commanders) || data.commanders.length === 0) {
      return res.status(400).json({ error: "Invalid deck payload" });
    }

    const updates = {
      user: req.user._id,
      name: data.name,
      format: data.format ?? "commander",
      commanderLocked: Boolean(data.commanderLocked),
      commanders: data.commanders,
      deckCards: data.deckCards ?? [],
      bannerRGB: data.bannerRGB ?? [168, 85, 247],
      cardHeight: data.cardHeight ?? "normal",
      bannerSettings: data.bannerSettings ?? {
        y: 25,
        leftFade: 0.7,
        rightFade: 0.2,
        color: "black",
      },
      isArchived: Boolean(data.isArchived),
    };
    if (typeof data.isPublic === "boolean") {
      updates.isPublic = data.isPublic;
    }


    // IMPORTANT:
    // - Only update by _id if it's a VALID ObjectId
    // - Otherwise CREATE a new deck
    const incomingId = data._id || data.id; // accept either
    if (incomingId && mongoose.isValidObjectId(incomingId)) {
      const deck = await Deck.findOneAndUpdate(
        { _id: incomingId, user: req.user._id }, // user scoping
        updates,
        { new: true }
      );

      // If deck doesn't exist under this user, create instead of silently failing
      if (!deck) {
        const created = await Deck.create(updates);
        return res.json(created);
      }

      return res.json(deck);
    }

    // Create new
    const created = await Deck.create(updates);
    return res.json(created);
  } catch (err) {
    console.error("Save deck error:", err);
    return res.status(500).json({ error: "Failed to save deck" });
  }
};

/**
 * GET /api/decks/:id
 * Load a deck (must be valid ObjectId)
 */
exports.getDeck = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid deck id" });
    }

    const deck = await Deck.findOne({ _id: id, user: req.user._id });

    if (!deck) {
      return res.status(404).json({ error: "Deck not found" });
    }

    return res.json(deck);
  } catch (err) {
    console.error("Load deck error:", err);
    return res.status(500).json({ error: "Failed to load deck" });
  }
};

/**
 * GET /api/decks/public/:id
 * Public, read-only deck fetch
 */
exports.getPublicDeck = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id)
      .populate({
        path: "user",
        select: "username avatar",
      });

    if (!deck) {
      return res.status(404).json({ error: "Deck not found." });
    }

    if (!deck.isPublic) {
      return res.status(403).json({
        error: "This deck cannot be viewed publicly.",
      });
    }

    // commanders and deckCards are embedded snapshots — DO NOT populate them
    res.json(deck);
  } catch (err) {
    console.error("getPublicDeck failed:", err);
    res.status(500).json({ error: "Failed to load deck" });
  }
};



/**
 * GET /api/users/me/decks
 * Return all decks for the authenticated user
 */
exports.getMyDecks = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decks = await Deck.find({
      user: req.user._id,
      isArchived: false,
    })
      .select(
        "name commanders commanderLocked isPublic likes bannerRGB bannerSettings cardHeight updatedAt createdAt"
      )
      .sort({ updatedAt: -1 });

    return res.json(decks);
  } catch (err) {
    console.error("Load user decks failed:", err);
    return res.status(500).json({ error: "Failed to load decks" });
  }
};

// PATCH /api/decks/:id/visibility
// PATCH /api/decks/:id/visibility
exports.updateDeckVisibility = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { isPublic, visibilityPrompted } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid deck id" });
    }

    const update = {};

    if (typeof isPublic === "boolean") {
      update.isPublic = isPublic;
    }

    if (typeof visibilityPrompted === "boolean") {
      update.visibilityPrompted = visibilityPrompted;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No valid updates provided" });
    }

    const deck = await Deck.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: update },
      { new: true }
    ).select("isPublic visibilityPrompted");

    if (!deck) {
      return res.status(404).json({ error: "Deck not found" });
    }

    return res.json({
      isPublic: deck.isPublic,
      visibilityPrompted: deck.visibilityPrompted,
    });
  } catch (err) {
    console.error("Update visibility failed", err);
    return res.status(500).json({ error: "Failed to update visibility" });
  }
};

exports.deleteDeck = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const deck = await Deck.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!deck) {
      return res.status(404).json({ error: "Deck not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Delete deck failed:", err);
    return res.status(500).json({ error: "Failed to delete deck" });
  }
};

exports.toggleDeckLike = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid deck id" });
    }

    const user = await User.findById(req.user._id);
    const deck = await Deck.findById(id);

    if (!deck || !deck.isPublic) {
      return res.status(404).json({ error: "Deck not found" });
    }

    const alreadyLiked = user.likedDecks.includes(deck._id);

    if (alreadyLiked) {
      // remove like
      user.likedDecks.pull(deck._id);
      deck.likes = Math.max(0, deck.likes - 1);
    } else {
      // add like
      user.likedDecks.push(deck._id);
      deck.likes += 1;
    }

    await user.save();
    await deck.save();

    return res.json({
      liked: !alreadyLiked,
      likes: deck.likes,
    });
  } catch (err) {
    console.error("Toggle deck like failed", err);
    return res.status(500).json({ error: "Failed to toggle like" });
  }
};


/**
 * GET /api/decks/public
 * Search public decks
 */
exports.searchPublicDecks = async (req, res) => {
  try {
    const { q, colors } = req.query;

    const filter = { isPublic: true };

    // 🔍 Text search (validated)
    if (q && q.trim()) {
      if (!validateSearchQuery(q)) {
        return res.status(400).json({
          error: "Invalid search query.",
        });
      }

      const trimmed = q.trim();

      // Try to resolve username → userId
      const foundUser = await User.findOne({
        username: { $regex: `^${trimmed}$`, $options: "i" },
      }).select("_id");

      filter.$or = [
        { name: { $regex: trimmed, $options: "i" } },
        { "commanders.name": { $regex: trimmed, $options: "i" } },
      ];

      // 👤 Include user's decks if username matched
      if (foundUser) {
        filter.$or.push({ user: foundUser._id });
      }
    }

    // 🎨 Color identity filter
    if (colors) {
      const colorArray = colors.split("");
      filter["commanders.colorIdentity"] = { $all: colorArray };
    }

    const decks = await Deck.find(filter)
      .select(
        "name commanders likes bannerRGB bannerSettings cardHeight updatedAt"
      )
      .populate("user", "username")
      .sort({ likes: -1, updatedAt: -1 })
      .limit(60);

    return res.json({ decks });
  } catch (err) {
    console.error("Public deck search failed:", err);
    return res.status(500).json({ error: "Failed to search public decks" });
  }
};
