const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const founderOnly = require("../middleware/founderOnly");
const collectionController = require("../controllers/collectionController");
const { getTotalOwned } = require("../controllers/collectionController");
router.use(protect);
router.use(founderOnly);

router.get("/", collectionController.getMyCollection);
router.post("/", collectionController.addOrUpdateEntry);
router.patch("/:id", collectionController.updateEntry);
router.delete("/:id", collectionController.deleteEntry);
router.get("/total", protect, founderOnly, getTotalOwned);

module.exports = router;
