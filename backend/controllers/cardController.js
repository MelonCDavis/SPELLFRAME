const axios = require("axios");
const Card = require("../models/Card");
const { searchCards } = require("../services/scryfallService");


/**
 * GET /api/cards/search?q=cardname
 * Searches Scryfall and returns ALL printings
 * Does NOT save cards yet
 */
exports.searchScryfall = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Search query required" });
    }

    const results = await searchCards(q);

    if (!Array.isArray(results) || results.length === 0) {
      return res.json({ count: 0, cards: [] });
    }

    const cards = results.map((card) => ({
      scryfallId: card.id,
      oracleId: card.oracle_id,
      name: card.name,
      manaCost: card.mana_cost,
      cmc: card.cmc,
      typeLine: card.type_line,
      oracleText: card.oracle_text,
      colors: card.colors,
      colorIdentity: card.color_identity,
      layout: card.layout,

      cardFaces: Array.isArray(card.card_faces)
        ? card.card_faces.map((f) => ({
            name: f.name,
            oracleText: f.oracle_text,
            imageSmall: f.image_uris?.small,
            imageNormal: f.image_uris?.normal,
          }))
        : null,

      // backward compatibility (front face image)
      imageSmall:
        card.image_uris?.small ||
        card.card_faces?.[0]?.image_uris?.small,

      imageNormal:
        card.image_uris?.normal ||
        card.card_faces?.[0]?.image_uris?.normal,

      setCode: card.set,
      setName: card.set_name,
      collectorNumber: card.collector_number,
      rarity: card.rarity,
      legalities: {
        commander: card.legalities.commander,
        modern: card.legalities.modern,
        legacy: card.legalities.legacy,
      },
    }));

    res.json({
      count: cards.length,
      cards,
    });
  } catch (err) {
    console.error(
      "Scryfall search error:",
      err.response?.data || err.message
    );

    res.status(500).json({ error: "Failed to search Scryfall" });
  }
};

 /** import a single scryfall card to the local database */

/**
 * POST /api/cards/import
 * Import a single Scryfall card (printing) into local DB
 */
exports.importCard = async (req, res) => {
  try {
    const data = req.body;

    if (!data?.scryfallId) {
      return res.status(400).json({ error: "scryfallId is required" });
    }

    // 1️⃣ Check for existing card
    let card = await Card.findOne({ scryfallId: data.scryfallId });

    if (card) {
      return res.json({
        message: "Card already exists",
        card,
      });
    }

    // 2️⃣ Create new card
    card = await Card.create({
      scryfallId: data.scryfallId,
      oracleId: data.oracleId,
      name: data.name,
      manaCost: data.manaCost,
      cmc: data.cmc,
      typeLine: data.typeLine,
      oracleText: data.oracleText,
      colors: data.colors,
      colorIdentity: data.colorIdentity,
      imageSmall: data.imageSmall,
      imageNormal: data.imageNormal,
      setCode: data.setCode,
      setName: data.setName,
      collectorNumber: data.collectorNumber,
      rarity: data.rarity,
      legalities: data.legalities,
      isFoil: Boolean(data.isFoil),
      layout: data.layout ?? null,
      cardFaces: data.cardFaces ?? null,
    });

    res.status(201).json({
      message: "Card imported successfully",
      card,
    });
  } catch (err) {
    console.error("Card import error:", err);
    res.status(500).json({ error: "Failed to import card" });
  }
};

exports.getRulings = async (req, res) => {
  try {
    const { scryfallId } = req.params;

    if (!scryfallId) {
      return res.status(400).json({ error: "scryfallId is required" });
    }

    const response = await axios.get(
      `https://api.scryfall.com/cards/${scryfallId}/rulings`,
      {
        headers: {
          "User-Agent": "The-Commander-Compendium/1.0",
          Accept: "application/json",
        },
      }
    );

    if (!response.data || !Array.isArray(response.data.data)) {
      return res.json({ rulings: [] });
    }

    res.json({
      rulings: response.data.data.map((r) => ({
        publishedAt: r.published_at,
        comment: r.comment,
      })),
    });
  } catch (err) {
    console.error(
      "Rulings fetch error:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to fetch rulings" });
  }
};

exports.getPrintings = async (req, res) => {
  try {
    const { oracleId } = req.params;

    if (!oracleId) {
      return res.status(400).json({ error: "oracleId is required" });
    }

    const response = await axios.get(
      "https://api.scryfall.com/cards/search",
      {
        params: {
          q: `oracleid:${oracleId}`,
          unique: "prints",
          order: "released",
        },
        headers: {
          "User-Agent": "The-Commander-Compendium/1.0",
          Accept: "application/json",
        },
      }
    );

    if (!response.data || !Array.isArray(response.data.data)) {
      return res.json({ printings: [] });
    }

    res.json({
      printings: response.data.data.map((card) => ({
        scryfallId: card.id,
        setCode: card.set,
        setName: card.set_name,
        collectorNumber: card.collector_number,
        releasedAt: card.released_at,
        rarity: card.rarity,
        imageSmall: card.image_uris?.small,
        imageNormal: card.image_uris?.normal,
        isFoil: card.finishes?.includes("foil") ?? false,
        prices: card.prices ?? null, 
      })),
    });

  } catch (err) {
    console.error(
      "Printings fetch error:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to fetch printings" });
  }
};

exports.getAllSets = async (req, res) => {
  try {
    const response = await axios.get("https://api.scryfall.com/sets");

    res.json(
      response.data.data
        .filter(set => !set.digital && set.set_type !== "token")
        .map(set => ({
          code: set.code,
          name: set.name,
          releasedAt: set.released_at,
        }))
        .sort(
          (a, b) =>
            new Date(b.releasedAt) - new Date(a.releasedAt)
        )
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sets" });
  }
};
