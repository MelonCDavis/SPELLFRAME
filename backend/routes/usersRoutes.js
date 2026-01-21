const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  updateAvatar,
  updateAccount,
  updatePassword,
  deleteAccount,
} = require("../controllers/userController");

router.get("/me", protect, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      username: req.user.username,
      isFounder: req.user.isFounder,
      avatar: req.user.avatar,
      isEmailVerified: req.user.isEmailVerified,
    },
  });
});

router.patch("/me", protect, updateAccount);
router.patch("/me/password", protect, updatePassword);
router.patch("/me/avatar", protect, updateAvatar);
router.delete("/me", protect, deleteAccount);

module.exports = router;

const bcrypt = require("bcrypt");
