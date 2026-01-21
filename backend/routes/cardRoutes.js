const express = require("express");
const router = express.Router();
const { validateSearchQuery } = require("../utils/validateSearchQuery");
const cardController = require("../controllers/cardController");

// Search Scryfall
router.get("/search", cardController.searchScryfall);

// Import a card
router.post("/import", cardController.importCard);

// Printings MUST come before :scryfallId
router.get("/oracle/:oracleId/printings", cardController.getPrintings);

// Rulings
router.get("/:scryfallId/rulings", cardController.getRulings);

// Sets
router.get("/sets", cardController.getAllSets);

router.get("/search", async (req, res) => {
  const { q } = req.query;

  if (!validateSearchQuery(q)) {
    return res.status(400).json({
      error: "Invalid search query.",
    });
  }

  // Existing search logic continues unchanged
});

module.exports = router;
