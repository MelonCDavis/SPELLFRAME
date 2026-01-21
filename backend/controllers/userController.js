const Deck = require("../models/Deck");

// =========================
// PATCH /api/users/me/avatar
// =========================
exports.updateAvatar = async (req, res) => {
  try {
    const user = req.user;
    const { source, cardId, image, zoom, x, y } = req.body;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (source !== "default" && source !== "card") {
      return res.status(400).json({ error: "Invalid avatar source" });
    }

    if (source === "card") {
      if (!cardId || typeof cardId !== "string") {
        return res.status(400).json({ error: "Invalid avatar card" });
      }

      if (!image || typeof image !== "string") {
        return res.status(400).json({ error: "Invalid avatar image" });
      }

      user.avatar = {
        source: "card",
        cardId,
        image,
        zoom: zoom ?? 1,
        x: x ?? 0.5,
        y: y ?? 0.5,
      };
    } else {
      user.avatar = { source: "default" };
    }

    await user.save();

    return res.json({
      message: "Account updated",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isFounder: user.isFounder,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("Update avatar error:", err);
    return res.status(500).json({ error: "Failed to update avatar" });
  }
};


  // =========================
  // PATCH /api/users/me
  // =========================
  exports.updateAccount = async (req, res) => {
    try {
      const user = req.user;
      const { username, email } = req.body;

      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!username || !email) {
        return res.status(400).json({
          error: "Username and email are required",
        });
      }

      user.username = username;
      user.email = email;

      await user.save();

     return res.json({
      message: "Avatar updated",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isFounder: user.isFounder,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
      },
    });

    } catch (err) {
      console.error("Update account failed:", err);
      return res.status(500).json({ error: "Failed to update account" });
    }
  };

  const bcrypt = require("bcrypt");

// =========================
// PATCH /api/users/me/password
// =========================
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }

    // 🔐 Re-fetch user WITH passwordHash
    const user = await require("../models/User")
      .findById(req.user._id)
      .select("+passwordHash");

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        error: "Current password is incorrect",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Update password failed:", err);
    return res.status(500).json({ error: "Failed to update password" });
  }
};

// =========================
// DELETE /api/users/me
// =========================
exports.deleteAccount = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Optional safety lock
    if (user.isFounder) {
      return res.status(403).json({
        error: "Founder accounts cannot be deleted",
      });
    }

    // Archive all decks owned by user
    await Deck.updateMany(
      { user: user._id },
      {
        $set: {
          isArchived: true,
          isPublic: false,
        },
      }
    );

    // Delete user
    await user.deleteOne();

    return res.json({
      message: "Account deleted successfully",
    });
  } catch (err) {
    console.error("Delete account failed:", err);
    return res.status(500).json({
      error: "Failed to delete account",
    });
  }
};

