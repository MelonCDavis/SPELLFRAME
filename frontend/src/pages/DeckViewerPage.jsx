import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DeckBuilderPage from "./DeckBuilderPage";
import { apiGet } from "../services/apiClient";

export default function DeckViewerPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deckId) return;

    setLoading(true);

    apiGet(`/api/decks/public/${deckId}`)
      .then((res) => {
        setDeck(res);
      })
      .catch(() => {
        navigate("/", { replace: true });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [deckId]);

  if (loading) {
    return <div className="text-neutral-400 text-sm">Loading deck…</div>;
  }

  if (!deck) {
    return null;
  }

  return (
    <DeckBuilderPage
      mode="view"
      injectedDeck={deck}
    />
  );
}
