import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Navigate } from "react-router-dom";
import {
  supportsPartner,
  supportsBackground,
  supportsDoctorsCompanion,
} from "../utils/commanderRules";

import useDeck from "../hooks/useDeck";
import CommanderBanner from "../components/deck/CommanderBanner";
import DeckImportModal from "../components/deck/DeckImportModal";
import { COMMANDER_OPTION_QUERIES } from "../utils/commanderOptionQueries";
import { apiGet, apiPatch } from "../services/apiClient";
import { getDeckById, saveDeck as persistDeck } from "../services/deckService";
import { useAuth } from "../auth/AuthContext";
import CommanderOption from "../components/commander/CommanderOption";
import CardGrid from "../components/cards/CardGrid";
import { getColorIdentity } from "../utils/colorIdentity";
import DeckBuilderAdvancedSearch from "../components/deck/DeckBuilderAdvancedSearch";
import DeckVisibilityModal from "../components/deck/DeckVisibilityModal";
import { sanitizeSearchQuery } from "../utils/validateSearchQuery";

export default function DeckBuilderPage({
  mode = "edit",
  injectedDeck = null,
}) {
    // =========================
  // 1) ROUTING / MODE
  // =========================
  const [setDropdownOpen, setSetDropdownOpen] = useState(false);
  const location = useLocation();
  const state = location.state;
  const { deckId: routeDeckId } = useParams();
  const isEditMode = Boolean(routeDeckId);
  const navigate = useNavigate();
  const isReadOnly = mode === "view";
  // =========================
  // 2) CORE LIFECYCLE STATE
  // =========================
  const [deckId, setDeckId] = useState(null);
  const [isHydrating, setIsHydrating] = useState(Boolean(routeDeckId));
  const [visibilityPrompted, setVisibilityPrompted] = useState(false);

  // =========================
  // 3) COMMANDER STATE
  // =========================
  const [primaryCommander, setPrimaryCommander] = useState(
    isEditMode ? null : state?.commander
  );
  const [partner, setPartner] = useState(null);
  const [friendsForever, setFriendsForever] = useState(null);
  const [doctorsCompanion, setDoctorsCompanion] = useState(null);
  const [background, setBackground] = useState(null);
  const [isCommanderLocked, setIsCommanderLocked] = useState(null);

  // =========================
  // 4) DECK EDITING + UI STATE
  // =========================
  const [xsPreviewOpen, setXsPreviewOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [smPreviewOpen, setSmPreviewOpen] = useState(false);
  const [mainboardQuery, setMainboardQuery] = useState("");
  const [mainboardResults, setMainboardResults] = useState([]);
  const MAINBOARD_PAGE_SIZE = 40;
  const [mainboardPage, setMainboardPage] = useState(1);
  const [mainboardLoading, setMainboardLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activePicker, setActivePicker] = useState(null);
  const [pickerResults, setPickerResults] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [partnerQuery, setPartnerQuery] = useState("");
  const [basicLandCard, setBasicLandCard] = useState(null);
  const [basicLandQty, setBasicLandQty] = useState(1);
  const [deckName, setDeckName] = useState("New Deck");
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState(deckName);
  const [detailList, setDetailList] = useState([]);
  const [detailIndex, setDetailIndex] = useState(null);
  const [cardPrintings, setCardPrintings] = useState(null);
  const [cardRulings, setCardRulings] = useState(null);
  const inspectorScrollRef = useRef(null);
  const [activePrinting, setActivePrinting] = useState(null);
  const [pendingDeckPrinting, setPendingDeckPrinting] = useState(null);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedSet, setSelectedSet] = useState("");
  const [allSets, setAllSets] = useState([]);
  const [mainboardError, setMainboardError] = useState(null);
  const mainboardInputRef = useRef(null);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [visibilityStep, setVisibilityStep] = useState("choice"); 
  const [exportOpen, setExportOpen] = useState(false);
  const [addDestination, setAddDestination] = useState("mainboard");
  const [isImporting, setIsImporting] = useState(false);
  const searchFormRef = useRef(null);
  // =========================
  // 5) BANNER / APPEARANCE STATE
  // =========================

  const [cardHeight, setCardHeight] = useState("normal");
  const [bannerSettings, setBannerSettings] = useState({
    y: 25,
    leftFade: 0.7,
    rightFade: 0.2,
    color: "black",
  });
  const [bannerRGB, setBannerRGB] = useState([99,102,241]);
  const [r, g, b] = bannerRGB ?? [99,102,241];
  const { user, isAuthenticated } = useAuth();
    
  // =========================
  // 6) PERSISTENCE FUNCTIONS (SAVE / HYDRATE)
  // =========================
  useEffect(() => {
    apiGet("/api/cards/sets")
      .then((res) => setAllSets(Array.isArray(res) ? res : []))
      .catch(() => setAllSets([]));
  }, []);

  useEffect(() => {
    if (state?.fromImport && primaryCommander) {
      setIsCommanderLocked(true);
    }
  }, [state, primaryCommander]);

  useEffect(() => {
    if (isReadOnly && saveAsOpen) {
      setSaveAsOpen(false);
    }
  }, [isReadOnly, saveAsOpen]);

  function buildDeckPayload({ nameOverride, forceNewId = false } = {}) {
    return {
      _id: forceNewId ? undefined : (deckId ?? undefined),
      name: nameOverride ?? deckName,

      commanderLocked: isCommanderLocked === true,

      commanders,
      deckCards,
      bannerSettings,
      bannerRGB,
      cardHeight,
      updatedAt: Date.now(),
    };

  }

  async function saveDeck() {
    if (!isAuthenticated) {
      navigate("/login", { state: { intent: "save-deck" } });
      return;
    }

    const payload = buildDeckPayload();

    try {
      const deck = await persistDeck(payload);

      setDeckId(deck._id);

      navigate(`/deck/${deck._id}`, { replace: true });
    } catch (err) {
      console.error("Save failed:", err);
    }
  }

  async function saveDeckAsConfirmed(name) {
    const trimmed = name.trim() || deckName;


    if (!isAuthenticated) {
      navigate("/login", { state: { intent: "save-deck-as" } });
      return;
    }

    const payload = buildDeckPayload({
      nameOverride: trimmed,
      forceNewId: true,
    });

    try {
      const deck = await persistDeck(payload);


      setDeckId(deck._id);
      setDeckName(trimmed);
      setSaveAsOpen(false);
      navigate(`/deck/${deck._id}`, { replace: true });
    } catch (err) {
      console.error("Save As failed, caching locally", err);
    }
  }

  async function saveAndExit() {
    try {
      await saveDeck();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Save & Exit failed", err);
    }
  }

  function exitViewer() {
    if (state?.from) {
      navigate(state.from, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }

  function hydrateDeck(deck) {
    if (!deck) {
      setIsCommanderLocked(false);
      return;
    }

    setDeckId(deck._id);
    setDeckName(deck.name);
    setVisibilityPrompted(Boolean(deck.visibilityPrompted));

    if (deck.bannerSettings) setBannerSettings(deck.bannerSettings);
    if (deck.bannerRGB) setBannerRGB(deck.bannerRGB);
    if (deck.cardHeight) setCardHeight(deck.cardHeight);

    const loadedPrimary = deck.commanders?.[0] ?? null;
    const loadedPartner = deck.commanders?.[1] ?? null;
    const loadedFriendsForever = deck.commanders?.[2] ?? null;
    const loadedDoctorsCompanion = deck.commanders?.[3] ?? null;
    const loadedBackground = deck.commanders?.[4] ?? null;

    setPrimaryCommander(loadedPrimary);
    setPartner(loadedPartner);
    setFriendsForever(loadedFriendsForever);
    setDoctorsCompanion(loadedDoctorsCompanion);
    setBackground(loadedBackground);

    replaceDeck(
      (deck.deckCards ?? []).map(dc => ({
        name: dc.card?.name,
        card: dc.card,
        quantity: dc.quantity ?? 1,
        role: dc.role ?? "mainboard",
      }))
    );

    setIsCommanderLocked(
      typeof deck.commanderLocked === "boolean" ? deck.commanderLocked : false
    );

  }

  const deckOwner = injectedDeck?.owner || injectedDeck?.user || null;

  const ownerName =
    isReadOnly && deckOwner
      ? deckOwner.username
      : user?.username;

  const ownerAvatar =
    isReadOnly && deckOwner
      ? deckOwner.avatar
      : user?.avatar;


  function updateCommanderPrinting(updatedCard) {
    if (!updatedCard?.scryfallId) return;

    setPrimaryCommander(prev =>
      prev?.scryfallId === updatedCard.scryfallId
        ? { ...prev, ...updatedCard }
        : prev
    );

    setPartner(prev =>
      prev?.scryfallId === updatedCard.scryfallId
        ? { ...prev, ...updatedCard }
        : prev
    );

    setFriendsForever(prev =>
      prev?.scryfallId === updatedCard.scryfallId
        ? { ...prev, ...updatedCard }
        : prev
    );

    setDoctorsCompanion(prev =>
      prev?.scryfallId === updatedCard.scryfallId
        ? { ...prev, ...updatedCard }
        : prev
    );

    setBackground(prev =>
      prev?.scryfallId === updatedCard.scryfallId
        ? { ...prev, ...updatedCard }
        : prev
    );
  }

   function identityKey(card) {
      if (!card) return null;

      if (card.oracleId) {
        return `oracle:${card.oracleId}`;
      }

      if (card.scryfallId) {
        return `scry:${card.scryfallId}`;
      }

      if (card.name) {
        return `name:${normName(card.name)}`;
      }

      return null;
    }

  async function lookupExact(cardName) {
    try {
      const q = `!"${String(cardName).replace(/"/g, '\\"')}"`;
      const data = await apiGet(`/api/cards/search?q=${encodeURIComponent(q)}`);
      return data?.cards?.[0] ?? null;
    } catch (err) {
      console.warn("[IMPORT] lookup failed:", cardName, err);
      return null;
    }
  }

  async function applyImportedDeck(importedDeck) {
    if (!importedDeck) return;

    setIsImporting(true); 

    try {
      const { commanders: importedCommanders, entries } = importedDeck;

      const c0 = importedCommanders?.[0] ?? null;
      const c1 = importedCommanders?.[1] ?? null;

      setPrimaryCommander(c0);
      setPartner(c1);
      setFriendsForever(null);
      setDoctorsCompanion(null);
      setBackground(null);

      setIsCommanderLocked(true);

      const safeEntries = Array.isArray(entries) ? entries : [];

      const commanderKeys = new Set(
        [c0, c1]
          .filter(Boolean)
          .map(identityKey)
      );

      const nonCommander = safeEntries.filter(e => {
        if (!e?.cardName) return false;
        return !commanderKeys.has(`name:${e.cardName.trim().toLowerCase()}`);
      });

      const uniqueNames = [
        ...new Set(nonCommander.map(e => e.cardName).filter(Boolean))
      ];

      const cardMap = new Map();
      for (const name of uniqueNames) {
        const card = await lookupExact(name);
        if (card) cardMap.set(name, card);
      }

      const nextDeck = [];

      for (const e of nonCommander) {
        const card = cardMap.get(e.cardName);
        if (!card) continue;

        nextDeck.push({
          card,
          name: card.name,
          quantity: e.quantity ?? 1,
          role: e.role ?? "mainboard",
        });
      }

      replaceDeck(nextDeck);
    } finally {
      setIsImporting(false);
    }
  }

  // =========================
  // 7) EFFECTS
  // =========================

  const importHandledRef = useRef(false);

  useEffect(() => {
    if (importHandledRef.current) return;

    const importedDeck = location.state?.importedDeck;
    if (!importedDeck) return;

    importHandledRef.current = true;

    applyImportedDeck(importedDeck).catch((err) => {
      console.error("[IMPORT] failed:", err);
    });

    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    if (!isReadOnly) return;

    function onKey(e) {
      if (e.key === "Escape") {
        exitViewer();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isReadOnly]);

  useEffect(() => {
    if (mode === "view" && injectedDeck) {
      hydrateDeck(injectedDeck);
      setIsHydrating(false);
      return;
    }

    if (!routeDeckId) return;

    setIsHydrating(true);

    getDeckById(routeDeckId)
      .then(hydrateDeck)
      .catch((err) => {
        console.error("Failed to load deck", err);
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, [routeDeckId, injectedDeck, mode]);


  useEffect(() => {
        if (isEditMode) return;
        if (!primaryCommander?.manaCost && primaryCommander?.name && !primaryCommander?.scryfallId) {
            apiGet(
              `/api/cards/search?q=${encodeURIComponent(
                `!"${primaryCommander.name}"`
              )}`
            ).then((data) => {
              if (data?.cards?.length) {
                setPrimaryCommander(data.cards[0]);
              }
            }).catch((err) => {
              console.error("Failed to hydrate commander", err);
            });
        }
    }, [primaryCommander, isEditMode]);

  useEffect(() => {
      if (detailIndex === null) return;

      function onKey(e) {
        if (e.key === "Escape") closeInspector();
        if (e.key === "ArrowRight") nextInspector();
        if (e.key === "ArrowLeft") prevInspector();
      }

      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
  }, [detailIndex]);

  useEffect(() => {
    if (mainboardResults.length === 0) {
      requestAnimationFrame(() => {
        mainboardInputRef.current?.focus();
      });
    }
  }, [mainboardResults]);

  useEffect(() => {
    if (detailIndex === null) return;

    const card = detailList[detailIndex];
    if (!card) return;

    setActivePrinting({
      image: card.imageLarge || card.imageNormal || null,
      prices: card.prices ?? null,
    });


    const oracleId = card.oracleId;
    if (!oracleId) {
      setCardPrintings([]);
      setCardRulings([]);
      return;
    }

    requestAnimationFrame(() => {
      inspectorScrollRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });

    setCardPrintings(null);
    setCardRulings(null);

    apiGet(`/api/cards/oracle/${oracleId}/printings`)
      .then((res) => {
        const list = Array.isArray(res?.printings)
          ? res.printings
          : Array.isArray(res)
          ? res
          : [];

        setCardPrintings(list);
      })
      .catch(() => setCardPrintings([]));

    apiGet(`/api/cards/${card.scryfallId}/rulings`)
      .then((res) => {
        setCardRulings(res?.rulings ?? []);
      })
      .catch(() => setCardRulings([]));
  }, [detailIndex, detailList]);


  useEffect(() => {
  if (!cardPrintings || cardPrintings.length === 0) return;

  setActivePrinting(prev => {
    if (prev) return prev;

    const firstPriced = cardPrintings.find(p =>
      p.prices?.usd ||
      p.prices?.usd_foil ||
      p.prices?.eur ||
      p.prices?.eur_foil
    );

    if (!firstPriced) return prev;

    return {
      image: firstPriced.imageLarge || firstPriced.imageNormal || null,
      prices: firstPriced.prices ?? null,
    };
  });
}, [cardPrintings]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setMainboardResults([]);
        setMainboardPage(1);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!saveAsOpen) return;

    function onKey(e) {
      if (e.key === "Escape") {
        setSaveAsOpen(false);
        setSaveAsName("");
      }
    }

    window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [saveAsOpen]);

  // =========================
  // 8) DERIVED VALUES + RENDER
  // =========================
  const effectivePrices =
  activePrinting?.prices ??
  cardPrintings?.find(p =>
    p.prices?.usd ||
    p.prices?.usd_foil ||
    p.prices?.eur ||
    p.prices?.eur_foil
  )?.prices ??
  null;

  const mainboardTotalPages = Math.max(
    1,
    Math.ceil(mainboardResults.length / MAINBOARD_PAGE_SIZE)
  );

  const paginatedMainboardResults = mainboardResults.slice(
    (mainboardPage - 1) * MAINBOARD_PAGE_SIZE,
    mainboardPage * MAINBOARD_PAGE_SIZE
  );

  const commanders = [
    primaryCommander,
    partner,
    friendsForever,
    doctorsCompanion,
    background,
  ].filter(Boolean)
  .map(c => ({
    ...c,
    oracleId: c.oracleId ?? c.card?.oracleId ?? null,
  }));

  const {
    deckCards,
    addCard,
    removeCard,
    replaceDeck,
  } = useDeck({ commanders }); 

  function normName(name) {
    return (name ?? "").trim().toLowerCase();
  }

  const selectedIdentityKeys = new Set(
    [
      ...commanders.map(identityKey),
      ...deckCards.map(dc => identityKey(dc.card)),
    ].filter(Boolean)
  );

  const deckColors = [
    ...new Set(
      commanders.flatMap((c) => getColorIdentity(c))),
  ];

  const commanderCount = commanders.length;

  const groupedMainboard = {
    planeswalkers: [],
    creatures: [],
    sorceries: [],
    instants: [],
    artifacts: [],
    enchantments: [],
    lands: [],
    other: [],
  };

  deckCards.forEach((dc) => {
    if (dc.role !== "mainboard") return;
    const group = getDeckCategory(dc.card);
    groupedMainboard[group].push(dc);
  });

  Object.values(groupedMainboard).forEach(section => {
    section.sort((a, b) =>
      a.card.name.localeCompare(b.card.name)
    );
  });

  const mainboardCount = deckCards
  .filter(dc => dc.role === "mainboard")
  .reduce((sum, dc) => sum + dc.quantity, 0);

  const totalDeckCount = commanderCount + mainboardCount;

  useEffect(() => {
    if (!deckId) return;

    if (visibilityPrompted === true) return;

    if (totalDeckCount !== 100) return;

    setShowVisibilityModal(true);
    setVisibilityStep("choice");
  }, [deckId, visibilityPrompted, totalDeckCount]);

  useEffect(() => {
    if (!actionsMenuOpen) return;

    function onKey(e) {
      if (e.key === "Escape") {
        setActionsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actionsMenuOpen]);

  const hasFriendsForever =
    !!primaryCommander &&
    primaryCommander.oracleText?.includes("Friends forever");

  const hasPartner =
    !!primaryCommander &&
    supportsPartner(primaryCommander) &&
    !hasFriendsForever;
  
  const sideboardCount = deckCards
      .filter(dc => dc.role === "sideboard")
      .reduce((sum, dc) => sum + dc.quantity, 0);

  const sideboardCards = deckCards
    .filter(dc => dc.role === "sideboard")
    .sort((a, b) => a.card.name.localeCompare(b.card.name));    

  function guardedAddCard(card, destination) {
    if (
      destination === "mainboard" &&
      totalDeckCount >= 100
    ) {
      return { error: "Mainboard full" };
    }

    if (
      destination === "sideboard" &&
      sideboardCount >= 10
    ) {
      return { error: "Sideboard full" };
    }

    return addCard(card, destination);
  }

   function isCommanderCard(card) {
    return commanders.some(c => c.scryfallId === card.scryfallId);
  }
// =========================
// 9) HELPERS / HANDLERS
// =========================
function buildExportText() {
  const lines = [];

  if (commanders.length > 0) {
    lines.push("Commander");
    commanders.forEach(c => {
      lines.push(`1 ${c.name}`);
    });
    lines.push("");
  }

  const sections = [
    ["Creatures", "creatures"],
    ["Instants", "instants"],
    ["Sorceries", "sorceries"],
    ["Artifacts", "artifacts"],
    ["Enchantments", "enchantments"],
    ["Planeswalkers", "planeswalkers"],
    ["Lands", "lands"],
    ["Other", "other"],
  ];

  sections.forEach(([label, key]) => {
    const cards = groupedMainboard[key];
    if (!cards || cards.length === 0) return;

    lines.push(label);

    cards.forEach(({ card, quantity }) => {
      lines.push(`${quantity} ${card.name}`);
    });

    lines.push("");
  });

  return lines.join("\n").trim();
}

function exportDeckToClipboard() {
  const text = buildExportText();

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Decklist copied to clipboard!");
      })
      .catch(() => {
        showManualCopy(text);
      });
  } else {
    showManualCopy(text);
  }
}

function showManualCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;

  textarea.style.position = "fixed";
  textarea.style.inset = "10%";
  textarea.style.width = "80%";
  textarea.style.height = "80%";
  textarea.style.zIndex = "10000";
  textarea.style.background = "#0a0a0a";
  textarea.style.color = "#e5e7eb";
  textarea.style.border = "1px solid #27272a";
  textarea.style.padding = "12px";
  textarea.style.fontSize = "14px";
  textarea.style.fontFamily = "monospace";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  alert("Clipboard blocked — press Ctrl+C / Cmd+C to copy.");

  textarea.addEventListener("blur", () => {
    document.body.removeChild(textarea);
  });
}

async function cloneDeck() {
  if (!isAuthenticated) {
    navigate("/login", { state: { intent: "clone-deck" } });
    return;
  }

  const payload = {
    name: "New Deck",

    commanderLocked: true,

    commanders: commanders.map(c => ({
      ...c,
    })),

    deckCards: deckCards.map(dc => ({
      card: dc.card,
      quantity: dc.quantity,
      role: dc.role ?? "mainboard",
    })),

    updatedAt: Date.now(),
  };

  try {
    const deck = await persistDeck(payload);

    setDeckId(deck._id);
    setDeckName(deck.name);

    setBannerSettings({
      y: 25,
      leftFade: 0.7,
      rightFade: 0.2,
      color: "black",
    });
    setBannerRGB([168, 85, 247]);
    setCardHeight("normal");

    navigate(`/deck/${deck._id}`, { replace: true });
  } catch (err) {
    console.error("Clone failed:", err);
    alert("Failed to clone deck.");
  }
}

  function buildDetailList() {
    return [
      ...commanders.map(c => ({ card: c })),
      ...sideboardCards.map(dc => ({ card: dc.card })),
      ...groupedMainboard.planeswalkers,
      ...groupedMainboard.creatures,
      ...groupedMainboard.sorceries,
      ...groupedMainboard.instants,
      ...groupedMainboard.artifacts,
      ...groupedMainboard.enchantments,
      ...groupedMainboard.lands,
    ].map(e => e.card);
  }

  function updateCardPrinting(baseScryfallId, newCard) {
    if (commanders.some(c => c.scryfallId === baseScryfallId)) {
      if (primaryCommander?.scryfallId === baseScryfallId) {
        setPrimaryCommander(newCard);
        return;
      }
      if (partner?.scryfallId === baseScryfallId) {
        setPartner(newCard);
        return;
      }
      if (friendsForever?.scryfallId === baseScryfallId) {
        setFriendsForever(newCard);
        return;
      }
      if (doctorsCompanion?.scryfallId === baseScryfallId) {
        setDoctorsCompanion(newCard);
        return;
      }
      if (background?.scryfallId === baseScryfallId) {
        setBackground(newCard);
        return;
      }
    }

  replaceDeck(
    deckCards.map(dc =>
      dc.card.scryfallId === baseScryfallId
        ? { ...dc, card: newCard }
        : dc
    )
  );
}

  function openInspector(card) {
    if (!card) return;

    const list = buildDetailList();

    const index = list.findIndex(
      (c) => c?.scryfallId === card.scryfallId
    );

    if (index === -1) return;

    setDetailList(list);
    setDetailIndex(index);
    setCardPrintings(null);
    setCardRulings(null);
  }

  function closeInspector() {
    setDetailIndex(null);
    setDetailList([]);
    setCardPrintings(null);
    setCardRulings(null);
  }

  function nextInspector() {
    setDetailIndex(i =>
      i === detailList.length - 1 ? 0 : i + 1
    );
  }

  function prevInspector() {
    setDetailIndex(i =>
      i === 0 ? detailList.length - 1 : i - 1
    );
  }    

  async function preloadOptions(type) {
    const query = COMMANDER_OPTION_QUERIES[type];
    if (!query) return;

    try {
      setPickerLoading(true);
      setActivePicker(type);

      const data = await apiGet(
        `/api/cards/search?q=${encodeURIComponent(query)}`
      );

      setPickerResults(Array.isArray(data.cards) ? data.cards : []);
    } catch (err) {
      console.error("Option preload failed", err);
      setPickerResults([]);
    } finally {
      setPickerLoading(false);
    }
  }

  async function searchPartner(e) {
    e.preventDefault();
    if (!partnerQuery.trim()) return;

    try {
      setPickerLoading(true);
      setActivePicker("partner");

      const data = await apiGet(
        `/api/cards/search?q=${encodeURIComponent(
          `${partnerQuery} oracle:Partner -oracle:"Friends forever"`
        )}`
      );

      setPickerResults(Array.isArray(data.cards) ? data.cards : []);
    } catch (err) {
      console.error("Partner search failed", err);
      setPickerResults([]);
    } finally {
      setPickerLoading(false);
    }
  }

  function ManaCost({ manaCost }) {
    if (!manaCost) return null;

    const symbols = manaCost.match(/\{[^}]+\}/g);
    if (!symbols) return null;

    return (
      <span className="flex items-center gap-0.5">
        {symbols.map((sym, i) => {
            const key = sym
                .replace(/[{}]/g, "")
                .replace(/\//g, "-")
                .toLowerCase();
            return (
                <span
                    key={i}
                    className={`mana mana-${key}`}
                    aria-hidden
                />
            );
        })}
      </span>
    );
}

    function DeckRow({ card, quantity, onRemove, onHover }) {
      return (
        <li
        className="
            flex items-center justify-between
            px-0 py-2
            text-sm
            hover:bg-neutral-800/50
        "
        onMouseEnter={() => onHover?.(card)}
        onMouseLeave={() => onHover?.(null)}
        >
        <div className="flex items-center gap-1 min-w-0">
            <span className="w-4 text-right text-neutral-400">
            {quantity}
            </span>

            <button
              type="button"
              onClick={() => openInspector(card)}
              title={card.name} 
              className="
                min-w-0
                text-left
                text-neutral-100
                hover:underline
                truncate
              "
            >
              {truncateName(card.name, 24)}
            </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
            {getCardBadges(card).map((b) => (
                <span
                key={b.key}
                className={`px-1.5 py-0.5 text-[10px] rounded ${b.className}`}
                >
                {b.label}
                </span>
            ))}

            <ManaCost manaCost={card.manaCost} />

            {!isReadOnly && (
              <button
                type="button"
                onClick={onRemove}
                className="mr-1 opacity-60 hover:opacity-100 hover:text-red-400 transition"
              >
                ✕
              </button>
            )}
        </div>
        </li>
      );
    }

function truncateName(name, max = 22) {
  if (!name) return "";
  return name.length > max
    ? name.slice(0, max - 1) + "…"
    : name;
}

  function getDeckCategory(card) {
    const type = card.typeLine?.toLowerCase() || "";

    if (type.includes("planeswalker")) return "planeswalkers";
    if (type.includes("creature")) return "creatures";
    if (type.includes("sorcery")) return "sorceries";
    if (type.includes("instant")) return "instants";
    if (type.includes("artifact")) return "artifacts";
    if (type.includes("enchantment")) return "enchantments";
    if (type.includes("land")) return "lands";

    return "other";
}

  function getCardBadges(card) {
    const badges = [];

    if (card.legalities?.commander === "banned") {
      badges.push({
        key: "banned",
        label: "BANNED",
        className: "bg-red-600/20 text-red-400 border border-red-600/40",
      });
    }

    const oracle = card.oracleText?.toLowerCase() || "";
    const isBasic = card.typeLine?.toLowerCase().includes("basic land");
    const isRelentless =
      oracle.includes("any number of cards named");
 
    if (isBasic || isRelentless) {
      badges.push({
        key: "any",
        label: "ANY #",
        className: "bg-emerald-600/20 text-emerald-400 border border-emerald-600/40",
      });
    }

    if (oracle.includes("transform")) {
      badges.push({
        key: "transform",
        label: "DF",
        className: "bg-indigo-600/20 text-indigo-400 border border-indigo-600/40",
      });
    }

    if (card.isFoil) {
      badges.push({
        key: "foil",
        label: "★",
        className: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40",
      });
    }

    return badges;
  }

  function handleOptionSelect(card) {
    if (isReadOnly) return; 
    if (activePicker === "partner") setPartner(card);
    if (activePicker === "friendsForever") setFriendsForever(card);
    if (activePicker === "doctorsCompanion") setDoctorsCompanion(card);
    if (activePicker === "background") setBackground(card);

    setActivePicker(null);
    setPickerResults([]);
    setPartnerQuery("");
  }

  async function searchMainboard(e) {
    e.preventDefault();

    const hasText = mainboardQuery.trim().length > 0;
    const hasFilters =
      selectedColors.length > 0 ||
      selectedTypes.length > 0 ||
      Boolean(selectedSet);

    if (!hasText && !hasFilters) return;

    try {
      setMainboardLoading(true);
      setMainboardError(null);

      const parts = [];

      if (hasText) {
        const q = mainboardQuery.trim();
        parts.push(`(name:${q} or t:${q} or ${q})`);
      }

      if (!hasText && selectedSet) {
        parts.push("game:paper");
      }

      if (selectedTypes.length > 0) {
        parts.push(
          `(${selectedTypes.map(t => `t:${t}`).join(" or ")})`
        );
      }

      if (selectedColors.length > 0) {
        parts.push(`ci=${selectedColors.join("")}`);
      }

      if (deckColors.length > 0 && hasText) {
        parts.push(`ci<=${deckColors.join("")}`);
      }

      if (selectedSet) {
        parts.push(`set:${selectedSet}`);
      }

      const finalQuery = parts.join(" ");

      const data = await apiGet(
        `/api/cards/search?q=${encodeURIComponent(finalQuery)}`
      );

      const cards = Array.isArray(data.cards) ? data.cards : [];

      if (cards.length === 0) {
        setMainboardResults([]);
        setMainboardPage(1); 
        setMainboardQuery("");
        setMainboardError(
          "There are no cards that match your search. Please refine your search."
        );                
        return;
      }

      setMainboardResults(cards);
      setMainboardPage(1);
    } catch (err) {
      console.error("Mainboard search failed", err);

      setMainboardResults([]);
      setMainboardPage(1);
      setMainboardQuery("");
      setMainboardError(
        "Please check your spelling and search parameters and try again."
      );
    }finally {
      setMainboardLoading(false);
    }
  }

  return (
    <div
      className="
        fixed inset-0 overflow-hidden
        bg-linear-to-b
        from-neutral-700/85
        via-neutral-800/95
        to-neutral-950
        flex flex-col
        pt-10
        md:pt-27
      "
        >
      <div className="flex-1 overflow-y-auto space-y-6">
        {isHydrating ? (
          <div className="text-neutral-400 text-sm">Loading deck…</div>
        ) : (
          <>
          {!routeDeckId && !primaryCommander && !state?.importedDeck && (
            <Navigate to="/" replace />
          )}
          {isReadOnly && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={exitViewer}
                className="
                  flex items-center gap-2
                  px-4 py-2
                  rounded-md
                  border border-red-600
                  bg-red-600/10
                  text-red-400
                  hover:bg-red-600/20
                  hover:text-red-300
                  transition
                "
                aria-label="Exit deck viewer"
              >
                <span className="text-lg leading-none">✕</span>
                <span className="text-sm font-semibold">Exit</span>
              </button>
            </div>
          )}

          {isCommanderLocked === true && (
            <CommanderBanner
              key={deckId || "new"}
              deckName={deckName}
              setDeckName={setDeckName}
              commanders={commanders}
              deckColors={deckColors}
              totalDeckCount={totalDeckCount}
              ownerName={ownerName}
              ownerAvatar={ownerAvatar}
              isOwner={!isReadOnly}
              bannerSettings={bannerSettings}
              onBannerSettingsChange={setBannerSettings}
              onColorChange={setBannerRGB}
              onSave={(action) => {
                if (isReadOnly) return; 

                if (action === "save") saveDeck();

                if (action === "saveAs") {
                  setSaveAsName("");
                  setSaveAsOpen(true);
                }
                if (action === "saveAndExit") saveAndExit();
              }}
            />
          )}
          {/* XS controls row */}
          <div className="mt-3 flex gap-2 min-[860px]:hidden">
            {/* XS preview toggle */}
            <button
              type="button"
              onClick={() => setXsPreviewOpen(o => !o)}
              className="
                flex-1
                flex items-center justify-center gap-2
                rounded-md
                border border-neutral-800
                bg-neutral-900
                py-3
                text-sm font-semibold
                text-neutral-200
                hover:bg-neutral-800
                transition
                shadow-(--spellframe-glow)
              "
            >
              <span className="text-lg leading-none">
                {xsPreviewOpen ? "▲" : "▼"}
              </span>
              <span>Preview</span>
            </button>

            {/* XS hamburger */}
            {isAuthenticated && isCommanderLocked === true && (
              <button
                type="button"
                onClick={() => setActionsMenuOpen(o => !o)}
                className="
                  flex-1
                  flex items-center justify-center gap-2
                  rounded-md
                  border border-neutral-800
                  bg-neutral-900
                  py-3
                  text-sm font-semibold
                  text-neutral-200
                  hover:bg-neutral-800
                  transition
                  shadow-(--spellframe-glow)
                "
              >
                <span className="text-lg leading-none">☰</span>
                <span>Actions</span>
              </button>
            )}
          </div>
          
          {/* XS + SM actions menu */}
          {actionsMenuOpen && isAuthenticated && isCommanderLocked === true && (
            <div className="fixed inset-0 z-40">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setActionsMenuOpen(false)}
              />

              {/* Menu */}
              <div
                className="
                  absolute
                  top-32
                  right-4
                  w-56
                  rounded-md
                  border border-neutral-800
                  bg-neutral-950
                  shadow-xl
                  divide-y divide-neutral-800
                "
              >
                <button
                  type="button"
                  onClick={() => {
                    setImportOpen(true);
                    setActionsMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                >
                  Import Decklist
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(true);
                    setActionsMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                >
                  Export Decklist
                </button>

                <button
                  type="button"
                  onClick={() => {
                    cloneDeck();
                    setActionsMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                >
                  Clone Deck
                </button>
              </div>
            </div>
          )}

          {isImporting && (
            <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
              <div className="
                mt-3
                rounded-md
                border border-indigo-500/40
                bg-indigo-500/10
                px-4 py-3
                text-sm
                text-indigo-200
                animate-pulse
              ">
                Importing decklist… resolving cards and quantities
              </div>
            </div>  
          )}

          {isAuthenticated && isCommanderLocked === true && (
            <div className="hidden min-[860px]:flex justify-end gap-2 mt-3 pr-1">
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="
                  px-4 py-2
                  rounded-md
                  border border-neutral-800
                  bg-neutral-900
                  text-sm text-neutral-200
                  transition-shadow
                  hover:bg-neutral-800
                  shadow-(--spellframe-glow)
                "
              >
                Import Decklist
              </button>

              <button
                type="button"
                onClick={() => setExportOpen(true)}
                className="
                  px-4 py-2
                  rounded-md
                  border border-neutral-800
                  bg-neutral-900
                  text-sm text-neutral-200
                  transition-shadow
                  hover:bg-neutral-800
                  shadow-(--spellframe-glow)
                "
              >
                Export Decklist
              </button>

              <button
                type="button"
                onClick={cloneDeck}
                className="
                  px-4 py-2
                  rounded-md
                  border border-neutral-800
                  bg-neutral-900
                  text-sm text-neutral-200
                  transition-shadow
                  hover:bg-neutral-800
                  shadow-(--spellframe-glow)
                "
              >
                Clone Deck
              </button>
            </div>
          )}
            {isReadOnly && (
              <div className="mt-2 text-center text-xs text-neutral-500">
                Viewing a public deck — editing disabled
              </div>
            )}
          {/* Commander options */}
          {isCommanderLocked !== true && (
                <section className="space-y-3">
            {hasPartner && (
              <CommanderOption
                label="Partner"
                card={partner}
                disabled={isCommanderLocked}
                onClear={() => setPartner(null)}
                onAdd={() => setActivePicker("partner")}
              />
            )}

            {hasFriendsForever && (
              <CommanderOption
                label="Friends Forever"
                card={friendsForever}
                disabled={isCommanderLocked}
                onClear={() => setFriendsForever(null)}
                onAdd={() => preloadOptions("friendsForever")}
              />
            )}

            {supportsDoctorsCompanion(primaryCommander) && (
              <CommanderOption
                label="Doctor’s Companion"
                card={doctorsCompanion}
                disabled={isCommanderLocked}
                onClear={() => setDoctorsCompanion(null)}
                onAdd={() => preloadOptions("doctorsCompanion")}
              />
            )}

            {supportsBackground(primaryCommander) && (
              <CommanderOption
                label="Background"
                card={background}
                disabled={isCommanderLocked}
                onClear={() => setBackground(null)}
                onAdd={() => preloadOptions("background")}
              />
            )}
                </section>
            )}
          {/* Option picker */}
          {activePicker && isCommanderLocked !== true && (
            <section className="space-y-4 rounded-md border border-neutral-800 bg-neutral-900 p-4">
              <h3 className="text-sm font-semibold text-neutral-200">
                Choose {activePicker.replace(/([A-Z])/g, " $1")}
              </h3>

              {activePicker === "partner" && (
                <form onSubmit={searchPartner}>
                  <input
                    value={partnerQuery}
                    onChange={(e) =>
                      setPartnerQuery(e.target.value)
                    }
                    placeholder="Search partner…"
                    className="w-full rounded-md px-3 py-2 bg-neutral-900 border border-neutral-800"
                  />
                </form>
              )}

              <CardGrid
                cards={pickerResults}
                loading={pickerLoading}
                selectedIds={selectedIdentityKeys}
                identityKey={identityKey}
                onSelect={(card) => {
                  if (isReadOnly) return; 
                  
                  if (activePicker) {
                    handleOptionSelect(card);
                    return;
                  }

                  const key = identityKey(card);

                  if (key && selectedIdentityKeys.has(key)) {
                    return;
                  }

                  if (card.typeLine?.toLowerCase().includes("basic land")) {
                    setBasicLandCard(card);
                    setBasicLandQty(1);
                    return;
                  }

                  const res = guardedAddCard(card, addDestination);
                    if (res?.error) return;

                  setMainboardQuery("");
                  setMainboardResults([]);
                  setMainboardPage(1);
                }}
              />

              <button
                type="button"
                onClick={() => {
                  setActivePicker(null);
                  setPickerResults([]);
                  setPartnerQuery("");
                }}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Cancel
              </button>
            </section>
          )}

          {isCommanderLocked !== true && (
            <section className="pt-6 border-neutral-800">
              <button
                type="button"
                onClick={() => setIsCommanderLocked(true)}
                className="w-full rounded-md bg-indigo-600 py-3 font-semibold text-white hover:shadow-(--spellframe-glow) transition"
              >
                Lock Commander & Continue
              </button>
            </section>
          )}

          {basicLandCard && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
              <div className="w-80 rounded-md border border-neutral-800 bg-neutral-900 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-neutral-200">
                  Add {basicLandCard.name}
                </h3>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setBasicLandQty((q) => Math.max(0, q - 1))}
                    className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
                  >
                    −
                  </button>

                  <span className="w-12 text-center text-lg text-neutral-100">
                    {basicLandQty}
                  </span>

                  <button
                    onClick={() => setBasicLandQty((q) => q + 1)}
                    className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
                  >
                    +
                  </button>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setBasicLandCard(null)}
                    className="text-sm text-neutral-400 hover:text-neutral-200"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                    if (isReadOnly) return; 
                    if (basicLandQty === 0) {
                    setBasicLandCard(null);
                    return;
                    }

                    if (totalDeckCount + basicLandQty > 100) return;

                    for (let i = 0; i < basicLandQty; i++) {
                      const res = guardedAddCard(basicLandCard, "mainboard");
                      if (res?.error) break;
                    }

                    setBasicLandCard(null);
                    setBasicLandQty(1);
                    setMainboardQuery("");
                    setMainboardResults([]);
                    setMainboardPage(1);
                }}
                className="rounded bg-indigo-600 px-3 py-1 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                      Add
                    </button>
            </div>
              </div>
            </div>
          )}

          
            {/* PREVIEW PANEL */}
            <div className="grid grid-cols-1 sm:grid-cols-[260px_1fr] gap-6">
              <aside
                className={`
                  ${xsPreviewOpen ? "block" : "hidden"}
                  sm:block
                  lg:sticky lg:top-6
                  pt-8
                `}
              >
                <div className="flex flex-col items-center gap-3 shrink-0">
                  {/* PREVIEW CARD */}
                  <div
                    className="w-60 rounded-md border shadow-(--spellframe-glow) border-neutral-800 bg-neutral-900 overflow-hidden "
                    style={{ aspectRatio: "63 / 88" }}
                  >
                    {(hoveredCard || primaryCommander)?.imageNormal ||
                    (hoveredCard || primaryCommander)?.imageLarge ? (
                      <img
                        src={
                          hoveredCard?.imageNormal ||
                          hoveredCard?.imageLarge ||
                          primaryCommander?.imageNormal ||
                          primaryCommander?.imageLarge
                        }
                        alt={hoveredCard?.name || primaryCommander?.name || ""}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  {/* SIDEBAR: SIDEBOARD (UI ONLY — A1) */}
                  <div className="w-60">
                    <div className="
                      rounded-md
                      border border-neutral-800
                      bg-neutral-900
                      p-3
                      shadow-(--spellframe-glow)
                    ">

                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                          Sideboard
                        </h3>
                      <span className="text-xs text-neutral-400">
                        {sideboardCount} / 10
                      </span>

                      </div>

                      {/* Empty state */}
                      {sideboardCards.length === 0 ? (
                        <div className="flex h-20 items-center justify-center rounded border border-dashed border-neutral-800 text-xs text-neutral-500">
                          Sideboard (0/10)
                        </div>
                      ) : (
                        <ul className="space-y-1">
                          {sideboardCards.map(({ card }, index) => {
                            
                            return (
                              <li
                                key={`${card.scryfallId}-${index}`}
                                className="
                                  w-full
                                  rounded
                                  border border-neutral-800
                                  bg-neutral-950
                                  px-3 py-1.5
                                  text-xs
                                  text-neutral-200
                                  hover:bg-neutral-800
                                  transition
                                  flex
                                  items-center
                                  justify-between
                                  gap-3
                                "
                                onMouseEnter={() => setHoveredCard(card)}
                                onMouseLeave={() => setHoveredCard(null)}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  
                                  <button
                                    type="button"
                                    onClick={() => openInspector(card)}
                                    className="flex-1 text-left truncate hover:underline"
                                    title={card.name}
                                  >
                                    {truncateName(card.name, 24)}
                                  </button>
                                </div>

                                {/* RIGHT: mana + remove */}
                                <div className="flex items-center gap-3 shrink-0">
                                  <ManaCost manaCost={card.manaCost} />

                                  {!isReadOnly && (
                                    <button
                                      type="button"
                                      onClick={() => removeCard(card.scryfallId)}
                                      className="text-neutral-500 hover:text-red-400 transition"
                                      title="Remove from sideboard"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </aside>

              {/* MAINBOARD */}
              {isCommanderLocked === true && (
                <section className="w-full space-y-4">
                  <form ref={searchFormRef} onSubmit={searchMainboard} className="space-y-2">
                    {/* Add destination toggle */}
                    {!isReadOnly && (
                      <div className="flex items-center gap-2 text-xs text-neutral-200">
                        <span>Add to:</span>

                        <div className="flex rounded border border-neutral-800 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setAddDestination("mainboard")}
                            className={`
                              px-4 py-1.5
                              font-medium
                              rounded-lg
                              transition-colors
                              ${
                                addDestination === "mainboard"
                                  ? "bg-blue-500/42 text-white"
                                  : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                              }
                            `}
                          >
                            Mainboard
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddDestination("sideboard")}
                            className={`
                              px-4 py-1.5
                              font-medium
                              rounded-lg
                              transition-colors
                              ${
                                addDestination === "sideboard"
                                  ? "bg-blue-500/42 text-white"
                                  : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                              }
                            `}
                          >
                            Sideboard
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Search row */}
                    <div className="flex gap-2">
                      <input
                        disabled={isReadOnly}
                        ref={mainboardInputRef}
                        value={mainboardQuery}
                        onChange={(e) => {
                          setMainboardQuery(e.target.value);
                          if (mainboardError) setMainboardError(null);
                        }}
                        placeholder={
                          mainboardError
                            ? mainboardError
                            : "Search cards to add…"
                        }
                        className={`
                          flex-1
                          rounded-md
                          px-3 py-2
                          bg-neutral-900
                          border
                          transition-shadow
                          focus:shadow-(--spellframe-glow)
                          ${mainboardError
                            ? "border-red-500 placeholder-red-400"
                            : "border-neutral-800"}
                        `}
                        autoFocus
                      />

                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => {
                          if (isReadOnly) return;
                          setAdvancedSearchOpen(o => !o);
                        }}
                        className={`
                          px-3 py-2
                          rounded-md
                          border
                          text-sm
                          transition-shadow
                          ${
                            isReadOnly
                              ? "border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50"
                              : "border-neutral-800 hover:bg-neutral-800 shadow-(--spellframe-glow)"
                          }
                        `}
                      >
                        Advanced
                      </button>
                    </div>

                    {advancedSearchOpen && (
                      <DeckBuilderAdvancedSearch
                        selectedColors={selectedColors}
                        setSelectedColors={setSelectedColors}
                        selectedTypes={selectedTypes}
                        setSelectedTypes={setSelectedTypes}
                        selectedSet={selectedSet}
                        setSelectedSet={setSelectedSet}
                        allSets={allSets}
                        onSetSelect={() => {
                          searchFormRef.current?.requestSubmit();
                        }}
                      />
                    )}
                  </form>

                  {/* Floating search results */}
                {mainboardResults.length > 0 && (

                  <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div
                      className="absolute inset-0 bg-black/60"
                      onClick={() => setMainboardResults([])}
                    />

                    {/* Results panel */}
                    <div className="absolute left-1/2 top-28 w-full max-w-4xl pt-3 mt-5 -translate-x-1/2 rounded-md border border-neutral-800 bg-neutral-950 shadow-xl">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
                        <span className="text-sm text-neutral-300">
                          Search results
                        </span>

                        <button
                          type="button"
                          onClick={() => setMainboardResults([])}
                          className="text-sm text-neutral-400 hover:text-neutral-200"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="max-h-[70vh] overflow-y-auto p-4">
                        {mainboardResults.length > 0 && (
                          <>
                            <CardGrid
                              cards={paginatedMainboardResults}
                              loading={mainboardLoading}
                              selectedIds={selectedIdentityKeys}
                              identityKey={identityKey}
                              onSelect={(card) => {
                                if (isReadOnly) return;

                                const k = identityKey(card);
                                if (commanders.some(c => identityKey(c) === k)) return;
                                if (k && selectedIdentityKeys.has(k)) return;

                                if (card.typeLine?.toLowerCase().includes("basic land")) {
                                  setBasicLandCard(card);
                                  setBasicLandQty(1);
                                  return;
                                }

                                if (
                                  addDestination === "mainboard" &&
                                  totalDeckCount >= 100
                                ) {
                                  return;
                                }

                                if (
                                  addDestination === "sideboard" &&
                                  sideboardCount >= 10
                                ) {
                                  return;
                                }

                                const res = guardedAddCard(card, addDestination);
                                if (res?.error) return;

                                setMainboardQuery("");
                                setMainboardResults([]);
                                setMainboardPage(1);
                              }}
                            />

                            {mainboardResults.length > MAINBOARD_PAGE_SIZE && (
                              <div className="flex justify-center items-center gap-2 pt-4">
                                <button
                                  disabled={mainboardPage === 1}
                                  onClick={() => setMainboardPage(p => p - 1)}
                                  className="px-3 py-1 text-sm rounded border border-neutral-700 text-neutral-300 disabled:opacity-40"
                                >
                                  ←
                                </button>

                                {Array.from(
                                  { length: mainboardTotalPages },
                                  (_, i) => i + 1
                                ).map(p => (
                                  <button
                                    key={p}
                                    onClick={() => setMainboardPage(p)}
                                    className={`px-3 py-1 text-sm rounded border ${
                                      p === mainboardPage
                                        ? "border-indigo-400 text-indigo-300 shadow-(--spellframe-glow)"
                                        : "border-neutral-700 text-neutral-400 hover:text-neutral-200"
                                    }`}
                                  >
                                    {p}
                                  </button>
                                ))}

                                <button
                                  disabled={mainboardPage === mainboardTotalPages}
                                  onClick={() => setMainboardPage(p => p + 1)}
                                  className="px-3 py-1 text-sm rounded border border-neutral-700 text-neutral-300 disabled:opacity-40"
                                >
                                  →
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                  {/* Deck columns */}
                    <div
                      className="
                        w-full
                        columns-1
                        min-[860px]:columns-2
                        min-[1150px]:columns-3
                        gap-6
                        pr-1
                      "
                    >
                    {/* COMMANDER GROUP */}
                    <section className="space-y-2 break-inside-avoid mb-6">
                      <h3 className="text-sm font-semibold text-neutral-300">
                        Commander ({commanderCount})
                      </h3>

                      <ul className="rounded-md border border-neutral-800 bg-neutral-900 divide-y divide-neutral-800">
                        {commanders.map((card, index) => (
                          <li
                            key={`${card.scryfallId}-${index}`}
                            className="
                              flex items-center justify-between
                              px-2 py-1.5
                              text-sm
                              hover:bg-neutral-800/50
                            "
                            onMouseEnter={() => setHoveredCard(card)}
                            onMouseLeave={() => setHoveredCard(null)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-4 text-right text-neutral-400">1</span>

                              <button
                                type="button"
                                onClick={() => openInspector(card)}
                                className="truncate text-left text-neutral-100 hover:underline"
                              >
                                {card.name}
                              </button>

                              
                            </div>

                            <ManaCost manaCost={card.manaCost} />
                          </li>
                        ))}
                      </ul>
                    </section>

                    {saveAsOpen && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                        <form
                          className="w-96 rounded-md border border-neutral-800 bg-neutral-900 p-5 space-y-4"
                          onSubmit={(e) => {
                            e.preventDefault();
                            saveDeckAsConfirmed(saveAsName);
                          }}
                        >
                          <h3 className="text-lg font-semibold text-neutral-200">
                            Save Deck As
                          </h3>

                          <input
                            value={saveAsName}
                            onChange={(e) => setSaveAsName(e.target.value)}
                            placeholder="Deck name"
                            className="w-full rounded-md px-3 py-2 bg-neutral-950 border border-neutral-800"
                            autoFocus
                          />

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSaveAsName(deckName);
                                setSaveAsOpen(false);
                              }}
                              className="text-sm text-neutral-400 hover:text-neutral-200"
                            >
                              Cancel
                            </button>

                            <button
                              type="submit"
                              className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                            >
                              Save As
                            </button>
                          </div>
                        </form>
                      </div>
                    )}


                    {/* MAINBOARD GROUPS */}
                    {[
                      ["Planeswalkers", "planeswalkers"],
                      ["Creatures", "creatures"],
                      ["Sorceries", "sorceries"],
                      ["Instants", "instants"],
                      ["Artifacts", "artifacts"],
                      ["Enchantments", "enchantments"],
                      ["Lands", "lands"],
                    ].map(([label, key]) => {
                      const cards = groupedMainboard[key];
                      if (!cards.length) return null;

                      const count = cards.reduce((s, c) => s + c.quantity, 0);

                      return (
                        <section
                          key={key}
                          className="mb-6"
                        >
                          {/* Section header */}
                          <div className="mb-2 break-inside-avoid">
                            <h3 className="text-sm font-semibold text-neutral-300">
                              {label} ({count})
                            </h3>

                            {/* Continuation header (appears ONLY if column breaks here) */}
                            <h3
                              className="
                                hidden
                                text-sm
                                font-semibold
                                text-neutral-400
                                pt-2
                                mt-2
                                border-t
                                border-neutral-800
                                before:content-[attr(data-cont)]
                              "
                              data-cont={`${label} (cont.)`}
                            />
                          </div>

                          <ul className="divide-y divide-neutral-800">
                            {cards.map(({ card, quantity }, index) => (
                              <DeckRow
                                key={`${card.scryfallId}-${index}`}
                                card={card}
                                quantity={quantity}
                                onHover={setHoveredCard}
                                onRemove={
                                  isReadOnly
                                    ? undefined
                                    : () => {
                                        removeCard(card.scryfallId);
                                        setHoveredCard((prev) =>
                                          prev?.name === card.name ? null : prev
                                        );
                                      }
                                }
                              />
                            ))}
                          </ul>
                        </section>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          
          {detailIndex !== null && (
            <div className="fixed inset-0 z-90 flex items-center justify-center px-4">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={closeInspector}
              />

              {/* Inspector */}
              <div
                className="
                  relative
                  w-full lg:w-1/2 max-w-4xl
                  h-full max-[599px]:overflow-y-auto
                  bg-neutral-950
                  border border-neutral-800
                  shadow-(--spellframe-glow)
                  flex flex-col
                  transition-opacity duration-200
                "
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-5 py-3 border-b pt-27"
                  style={{
                    borderColor: `rgba(${r},${g},${b},0.4)`,
                    boxShadow: `0 4px 16px rgba(${r},${g},${b},0.35)`,
                  }}
                >
                  <div className="flex gap-2">
                    <button
                      onClick={prevInspector}
                      className="
                      px-3 py-1 rounded
                      border border-neutral-700
                      text-sm text-neutral-200
                      shadow-(--spellframe-glow)
                      transition-colors
                      hover:bg-indigo-600/30
                      hover:border-indigo-400
                      hover:text-white
                      "                    
                    >
                      ← Prev
                    </button>

                    <button
                      onClick={nextInspector}
                      className="
                      px-3 py-1 rounded
                      border border-neutral-700
                      text-sm text-neutral-200
                      shadow-(--spellframe-glow)
                      transition-colors
                      hover:bg-indigo-600/30
                      hover:border-indigo-400
                      hover:text-white
                      "
                    >
                      Next →
                    </button>
                  </div>

                  <button
                    onClick={closeInspector}
                    className="
                      px-3 py-1 rounded
                      border border-neutral-700
                      text-sm text-neutral-200
                      shadow-(--spellframe-glow)
                      transition-colors
                      hover:bg-indigo-600/30
                      hover:border-indigo-400
                      hover:text-white
                      "
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Body */}
                <div
                  key={detailList[detailIndex].name}
                  className="
                    grid
                    grid-cols-[256px_1fr]
                    max-[599px]:grid-cols-1
                    gap-x-6 gap-y-10
                    flex-1
                    overflow-hidden max-[599px]:overflow-y-auto
                  "
                >
            {/* IMAGE COLUMN */}
            <div 
              className="
                max-h-full
                overflow-y-auto
                max-[599px]:overflow-visible
                pr-2
                space-y-4
              "
            >
              <img
                src={
                  activePrinting?.image ||
                  detailList[detailIndex].imageLarge ||
                  detailList[detailIndex].imageNormal
                }
                alt={detailList[detailIndex].name}
                className="w-64 rounded-md border border-neutral-800"
              />
              {effectivePrices && (
                  <div className="mt-3 rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-3 text-center">
                    <div className="text-xs uppercase tracking-wide text-neutral-400 mb-1">
                      Current Average Price
                    </div>

                    <div className="flex items-center justify-center gap-2 text-lg font-semibold text-neutral-100">
                      {effectivePrices.usd_foil ? (
                        <>
                          <span>${effectivePrices.usd_foil}</span>
                          <span className="text-xs font-normal text-neutral-400">
                            Foil
                          </span>
                        </>
                      ) : effectivePrices.usd ? (
                        <>
                          <span>${effectivePrices.usd}</span>
                          <span className="text-xs font-normal text-neutral-400">
                            Non-foil
                          </span>
                        </>
                      ) : effectivePrices.eur_foil ? (
                        <>
                          <span>€{effectivePrices.eur_foil}</span>
                          <span className="text-xs font-normal text-neutral-400">
                            Foil
                          </span>
                        </>
                      ) : effectivePrices.eur ? (
                        <>
                          <span>€{effectivePrices.eur}</span>
                          <span className="text-xs font-normal text-neutral-400">
                            Non-foil
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-neutral-500">
                          No pricing data
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {pendingDeckPrinting && (
                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      className="px-4 py-2 rounded border border-neutral-700 text-sm hover:bg-neutral-800"
                      onClick={() => setPendingDeckPrinting(null)}
                    >
                      Keep Browsing
                    </button>

                    <button
                      className="px-4 py-2 rounded bg-indigo-600 text-sm font-semibold hover:bg-indigo-500"
                      onClick={() => {
                        const { baseScryfallId, newCard } = pendingDeckPrinting;

                        if (commanders.some(c => c.scryfallId === baseScryfallId)) {
                          if (primaryCommander?.scryfallId === baseScryfallId) {
                            setPrimaryCommander(newCard);
                          } else if (partner?.scryfallId === baseScryfallId) {
                            setPartner(newCard);
                          } else if (friendsForever?.scryfallId === baseScryfallId) {
                            setFriendsForever(newCard);
                          } else if (doctorsCompanion?.scryfallId === baseScryfallId) {
                            setDoctorsCompanion(newCard);
                          } else if (background?.scryfallId === baseScryfallId) {
                            setBackground(newCard);
                          }
                        } else {
                          replaceDeck(
                            deckCards.map(dc =>
                              dc.card.scryfallId === baseScryfallId
                                ? { ...dc, card: newCard }
                                : dc
                            )
                          );
                        }

                        setPendingDeckPrinting(null);
                      }}
                    >
                      Update Deck
                    </button>
                  </div>
                )}
            </div>

            {/* TEXT COLUMN */}
            <div
              ref={inspectorScrollRef}
              className="
                animate-[inspectorIn_180ms_ease-out]
                max-h-full
                overflow-y-auto
                max-[599px]:overflow-visible
                pr-6
                space-y-8
              "
              style={{
                scrollbarColor: `rgb(${r},${g},${b}) transparent`,
              }}
            >
              {/* TOP FADE */}
              <div
                className="pointer-events-none sticky top-0 z-10 h-8"
                style={{
                  background: "linear-gradient(to bottom, #0a0a0a, transparent)",
                }}
              />

              {/* CARD DETAILS */}
              <section className="space-y-3">
                <h2
                  className="text-3xl font-semibold"
                  style={{ color: `rgb(${r},${g},${b})` }}
                >
                  {detailList[detailIndex].name}
                </h2>

                <div className="text-sm text-neutral-400">
                  {detailList[detailIndex].typeLine}
                </div>

                <ManaCost manaCost={detailList[detailIndex].manaCost} />

                <p className="whitespace-pre-line text-neutral-200">
                  {detailList[detailIndex].oracleText}
                </p>

                {detailList[detailIndex].flavorText && (
                  <p className="italic text-neutral-400">
                    {detailList[detailIndex].flavorText}
                  </p>
                )}
              </section>

              {/* DIVIDER */}
              <hr className="border-neutral-800" />

              {/* PRINTINGS */}
              <section className="space-y-2">
                <h3
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: `rgb(${r},${g},${b})` }}
                >
                  Printings
                </h3>

                {cardPrintings ? (
                  <ul className="space-y-1 text-sm text-neutral-400">
                    {cardPrintings.map((p) => (
                      <li key={p.scryfallId}>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...detailList[detailIndex],
                              scryfallId: p.scryfallId,
                              imageNormal: p.imageNormal,
                              imageLarge: p.imageLarge,
                              setCode: p.setCode,
                              setName: p.setName,
                              collectorNumber: p.collectorNumber,
                              rarity: p.rarity,
                              prices: p.prices ?? null,
                            };

                            setActivePrinting({
                              image: updated.imageLarge || updated.imageNormal || null,
                              prices: updated.prices ?? null,
                            });
                            setPendingDeckPrinting({
                              baseScryfallId: detailList[detailIndex].scryfallId,
                              newCard: updated,
                            });
                        
                          }}

                          className="
                            text-left
                            hover:underline
                            hover:text-white
                            transition
                          "
                        >
                          {p.setName} ({p.collectorNumber})
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-neutral-500">Loading…</p>
                )}

              </section>

              {/* DIVIDER */}
              <hr className="border-neutral-800" />

              {/* RULINGS */}
              <section className="space-y-2">
                <h3
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: `rgb(${r},${g},${b})` }}
                >
                  Rulings
                </h3>

                {cardRulings ? (
                  <ul className="space-y-2 text-sm text-neutral-400">
                    {cardRulings.map((r, i) => (
                      <li key={i}>
                        <span className="block text-neutral-500 text-xs">
                          {r.publishedAt}
                        </span>
                        {r.comment}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-neutral-500">Loading…</p>
                )}

              </section>

              {/* BOTTOM FADE */}
              <div
                className="pointer-events-none sticky bottom-0 z-10 h-10"
                style={{
                  background: "linear-gradient(to top, #0a0a0a, transparent)",
                }}
              />

            </div>
          </div>
              </div>
            </div>
          )}
          </>
        )}
        <DeckImportModal
          isOpen={importOpen}
          onClose={() => setImportOpen(false)}
          onDeckImport={({ commanders, entries }) => {
            applyImportedDeck({ commanders, entries });
          }}
        />
        {exportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-3xl rounded-md border border-neutral-800 bg-neutral-950 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-100">
                  Export Decklist
                </h2>
                <button
                  onClick={() => setExportOpen(false)}
                  className="text-neutral-400 hover:text-neutral-200"
                >
                  ✕
                </button>
              </div>

              <textarea
                readOnly
                autoFocus
                value={buildExportText()}
                className="
                  w-full
                  h-[60vh]
                  rounded-md
                  bg-neutral-900
                  border border-neutral-800
                  p-3
                  text-sm
                  font-mono
                  text-neutral-100
                "
                onFocus={(e) => e.target.select()}
              />

              <div className="text-xs text-neutral-400">
                Press <strong>Ctrl+C</strong> / <strong>Cmd+C</strong> to copy
              </div>
            </div>
          </div>
        
            )}
      </div>
       {showVisibilityModal && (
          <DeckVisibilityModal
            step={visibilityStep}

            onMakePublic={async () => {
              await apiPatch(`/api/decks/${deckId}/visibility`, {
                isPublic: true,
                visibilityPrompted: true,
              });

              setVisibilityPrompted(true);
              setShowVisibilityModal(false);
            }}

            onChoosePrivate={() => {
              setVisibilityStep("confirm");
            }}

            onConfirmPrivate={async () => {
              await apiPatch(`/api/decks/${deckId}/visibility`, {
                isPublic: false,
                visibilityPrompted: true,
              });

              setVisibilityPrompted(true);
              setShowVisibilityModal(false);
            }}
          />
        )}
    </div>
  );
}