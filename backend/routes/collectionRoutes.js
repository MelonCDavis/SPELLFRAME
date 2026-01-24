const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const founderOnly = require("../middleware/founderOnly");
const {
  getMyCollection,
  addOrUpdateEntry,
  updateEntry,
  deleteEntry,
  getTotalOwned,
} = require("../controllers/collectionController");

router.use(protect);

// Collection
router.get("/", founderOnly, getMyCollection);
router.post("/", founderOnly, addOrUpdateEntry);
router.patch("/:id", founderOnly, updateEntry);
router.delete("/:id", founderOnly, deleteEntry);
router.get("/total", founderOnly, getTotalOwned);

module.exports = router;
