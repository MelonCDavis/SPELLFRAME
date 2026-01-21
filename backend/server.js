require("dotenv").config();

// 🔴 REGISTER MODELS FIRST (ORDER MATTERS)
require("./models/User");
require("./models/Card");
require("./models/CollectionEntry");
require("./models/Deck");


const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/database");

// Routes
const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/usersRoutes");
const cardRoutes = require("./routes/cardRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const deckRoutes = require("./routes/deckRoutes");

const app = express();

connectDB();

/**
 * CORS
 * Allow frontend dev server (Vite) to access API
 */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(express.json());

// =========================
// Rate Limiters
// =========================

// Auth: prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// Writes: prevent abuse / loops
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Public search: prevent scraping
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", writeLimiter, usersRoutes);
app.use("/api/cards", searchLimiter, cardRoutes);
app.use("/api/collection", writeLimiter, collectionRoutes);
app.use("/api/decks", writeLimiter, deckRoutes);

app.get("/", (req, res) => {
  res.send("THE COMMANDER COMPENDIUM API RUNNING");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// NOTE: NODE_PATH is set to "backend"
// Absolute imports resolve from backend root
