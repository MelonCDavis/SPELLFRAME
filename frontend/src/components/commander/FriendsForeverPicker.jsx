import { useEffect, useState } from "react";
import { apiGet } from "../../services/apiClient";
import CardGrid from "../cards/CardGrid";

export default function FriendsForeverPicker({ onSelect, disabled }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet(
          `/api/cards/search?q=oracle:"Friends forever"`
        );
        setCards(data.cards ?? []);
      } catch (err) {
        console.error("Friends Forever load failed", err);
        setCards([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <CardGrid
      cards={cards}
      loading={loading}
      onSelect={disabled ? undefined : onSelect}
    />
  );
}
