const User = require("../models/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { signToken } = require("../utils/tokenUtils");
const { sendEmail } = require("../utils/email");

//
// REGISTER
//
exports.register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      username,
      passwordHash: hashedPassword,
    });

    // 🔐 Create email verification token
    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // 📧 Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your Commander Compendium email",
      html: `
        <h2>Welcome to SPELLFRAME!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <p><a href="${verifyUrl}">Verify Email</a></p>
        <p>This link expires in 1 hour.</p>
      `,
    });

    return res.status(201).json({
      message: "Registration successful. Please check your email to verify your account.",
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

//
// VERIFY EMAIL (kept intact for later)
//
exports.verifyEmail = async (req, res) => {
  try {
    const token = req.query.token || req.body?.token;

    if (!token) {
      return res.status(400).json({ error: "Verification token missing" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Token invalid or expired" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

   return res.redirect(
  `${process.env.FRONTEND_URL}/login?verified=1`
);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

//
// LOGIN
//
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: "Please verify your email before logging in.",
      });
    }

    const passwordValid = await user.comparePassword(password);
    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user._id);

    return res.json({ message: "Login successful", token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

//
// FORGOT PASSWORD (unchanged)
//
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your Commander Compendium password",
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 1 hour.</p>
      `,
    });

    return res.json({
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

//
// RESET PASSWORD (unchanged)
//
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { password } = req.body;

    if (!token) return res.status(400).json({ error: "Reset token missing" });
    if (!password)
      return res.status(400).json({ error: "New password missing" });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordHash");

    if (!user) {
      return res.status(400).json({ error: "Token invalid or expired" });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
