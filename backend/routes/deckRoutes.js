const express = require("express");
const router = express.Router();

const {
  saveDeck,
  getDeck,
  getPublicDeck,
  getMyDecks,
  updateDeckVisibility,
  toggleDeckLike,
  searchPublicDecks,
} = require("../controllers/deckController");

const { protect } = require("../middleware/authMiddleware");
const { deleteDeck } = require("../controllers/deckController");

/**
 * 🔓 PUBLIC ROUTE (NO AUTH)
 */
router.get("/public", searchPublicDecks);
router.get("/public/:id", getPublicDeck);
/**
 * 🔐 AUTH REQUIRED BELOW THIS LINE
 */
router.use(protect);
// 👍 Toggle like on a public deck (auth required)
router.post("/:id/like", toggleDeckLike);

// 👍 Like / Unlike a public deck
router.patch("/:id/like", toggleDeckLike);

router.delete("/:id", deleteDeck);
router.patch("/:id/visibility", updateDeckVisibility);
router.get("/me/decks", getMyDecks);
router.post("/", saveDeck);
router.get("/:id", getDeck);

module.exports = router;
