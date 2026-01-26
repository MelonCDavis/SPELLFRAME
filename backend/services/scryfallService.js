const axios = require("axios");

const SCRYFALL_BASE_URL = "https://api.scryfall.com";

exports.searchCards = async (query) => {
  try {
    const response = await axios.get(
      `${SCRYFALL_BASE_URL}/cards/search`,
      {
        params: {
          q: query,
          unique: "prints",
          order: "released",
        },
        headers: {
          "User-Agent": "SPELLFRAME/1.0",
          Accept: "application/json",
        },
      }
    );

    if (!response.data || !Array.isArray(response.data.data)) {
      return [];
    }

    return response.data.data;
  } catch (err) {
    const status = err.response?.status;

    if (status === 400 || status === 404) {
      return [];
    }

    // ❌ Only real failures should bubble up
    throw err;
  }
};
