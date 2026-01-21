import { apiGet, apiPost } from "./apiClient";

export function getDeckById(deckId) {
  return apiGet(`/api/decks/${deckId}`);
}

export function saveDeck(deckData) {
  return apiPost("/api/decks", deckData);
}

export function toggleDeckLike(deckId) {
  return apiPost(`/api/decks/${deckId}/like`);
}