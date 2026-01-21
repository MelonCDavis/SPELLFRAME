import { useState, useMemo } from "react";

function normalizeName(name) {
  return (name ?? "").trim().toLowerCase();
}

function identityKey(card) {
  if (!card) return null;
  if (card.oracleId) return `oracle:${card.oracleId}`;
  if (card.name) return `name:${normalizeName(card.name)}`;
  return null;
}

export default function useDeck({ commanders = [] }) {
  const [deckCards, setDeckCards] = useState([]);

  const allNames = useMemo(() => {
    const names = new Set();

    commanders.forEach((c) => {
      if (c?.name) names.add(normalizeName(c.name));
    });

    deckCards.forEach((dc) => {
      if (dc?.name) names.add(normalizeName(dc.name));
    });

    return names;
  }, [commanders, deckCards]);

  function allowsMultipleCopies(card) {
    if (!card) return false;

    if (card.typeLine?.toLowerCase().includes("basic land")) {
      return true;
    }

    const oracle = card.oracleText?.toLowerCase() || "";
    return oracle.includes("any number of cards named");
  }

  function addCard(card, role = "mainboard") {
    if (!card?.name) return { error: "Invalid card" };

    const key = identityKey(card);

    if (commanders.some(c => identityKey(c) === key)) {
      return { error: "Card is already a commander" };
    }

    const canStack = allowsMultipleCopies(card);

    setDeckCards((prev) => {
      if (!canStack && prev.some(dc => identityKey(dc.card) === key)) {
        return prev;
      }

      const existing = prev.find(
        (dc) =>
          dc.scryfallId === card.scryfallId &&
          dc.role === role
      );

      if (existing && canStack) {
        return prev.map((dc) =>
          dc.scryfallId === card.scryfallId &&
          dc.role === role
            ? { ...dc, quantity: dc.quantity + 1 }
            : dc
        );
      }

      return [
        ...prev,
        {
          name: card.name,
          scryfallId: card.scryfallId,
          card,
          role,
          quantity: 1,
        },
      ];
    });

    return { success: true };
  }


  function removeCard(scryfallId) {
    setDeckCards((prev) =>
      prev.filter((dc) => dc.scryfallId !== scryfallId)
    );
  }

  function clearDeck() {
    setDeckCards([]);
  }

  function updateCardPrinting(oldScryfallId, newCard) {
    if (!newCard?.scryfallId) return;

    setDeckCards((prev) =>
      prev.map((dc) =>
        dc.scryfallId === oldScryfallId
          ? {
              ...dc,
              scryfallId: newCard.scryfallId,
              card: newCard,
            }
          : dc
      )
    );
  }

  function replaceDeck(cards = []) {
    setDeckCards(
      Array.isArray(cards)
        ? cards.map((dc) => ({
          name: dc.name,
          scryfallId: dc.card?.scryfallId,
          card: dc.card,
          role: dc.role ?? "mainboard",
          quantity: dc.quantity ?? 1,
        }))
        : []
    );
  }

  return {
    deckCards,
    addCard,
    removeCard,
    clearDeck,
    replaceDeck,
    updateCardPrinting, 
  };
}


