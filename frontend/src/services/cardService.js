import { apiGet } from "./apiClient";

export async function fetchCards() {
  return apiGet("/api/cards");
}
