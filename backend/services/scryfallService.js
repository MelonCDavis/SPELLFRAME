const axios = require("axios");

const SCRYFALL_BASE_URL = "https://api.scryfall.com";

exports.searchCards = async (query) => {
  const url = "https://api.scryfall.com/cards/search";

  const response = await axios.get(url, {
    params: {
      q: query,
      unique: "prints",
      order: "released",
    },
    headers: {
      "User-Agent": "The-Commander-Compendium/1.0",
      Accept: "application/json",
    },
  });

  if (!response.data || !Array.isArray(response.data.data)) {
    return [];
  }

  return response.data.data;
};
