import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiGet, apiDelete,apiPatch } from "../services/apiClient";
import { useAuth } from "../auth/AuthContext";
import MiniDeckBanner from "../components/profile/MiniDeckBanner";
import AvatarEditorModal from "../components/profile/AvatarEditorModal";
import { isFounder } from "../auth/founder";
import AccountSettingsModal from "../components/profile/AccountSettingsModal";
import ProfileSettingsMenu from "../components/profile/ProfileSettingsMenu";
import ChangePasswordModal from "../components/profile/ChangePasswordModal";
import DeleteAccountModal from "../components/profile/DeleteAccountModal";

export default function ProfilePage() {
  const { user, isAuthenticated, isInitializing, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); 
  const [accountOpen, setAccountOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [decks, setDecks] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [libraryTotal, setLibraryTotal] = useState(null);

  const canUseCollection =
  !isInitializing &&
  isAuthenticated &&
  isFounder(user);


  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    apiGet("/api/decks/me/decks")
      .then(setDecks)
      .finally(() => setLoading(false));

    if (canUseCollection) {
      apiGet("/api/collection/total")
      .then(res => setLibraryTotal(res.totalOwned))
      .catch(err => 
        console.error("Failed to load library total", err)
      );
    }
  }, [
    isAuthenticated,
    isInitializing,
    navigate,
    user,
    location.state?.refreshDecks,
  ]);

  const filteredDecks = decks.filter((d) =>
    activeTab === "active" ? !d.isArchived : d.isArchived
  );

  async function toggleVisibility(deckId, isPublic) {
    try {
      const res = await apiPatch(`/api/decks/${deckId}/visibility`, {
        isPublic,
      });

      setDecks((prev) =>
        prev.map((d) =>
          d._id === deckId ? { ...d, isPublic: res?.isPublic ?? isPublic } : d
        )
      );
    } catch (err) {
      console.error("Toggle visibility failed", err);
    }
  }

  function updateDeckLikes(deckId, likes) {
    setDecks((prev) =>
      prev.map((d) =>
        d._id === deckId ? { ...d, likes } : d
      )
    );
  }

    async function deleteDeck(deckId) {
      try {
        await apiDelete(`/api/decks/${deckId}`);

        setDecks(prev => prev.filter(d => d._id !== deckId));
        setConfirmDeleteId(null);
      } catch (err) {
        console.error("Delete failed", err);
      }
    }

  return (
    <div className="fixed inset-0 overflow-hidden profile-page-root flex pt-27 flex-col">
      <div className="flex-1 overflow-y-auto rounded-2xl bg-linear-to-b from-neutral-500 via-neutral-600 to-neutral-800">
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-6 space-y-6">
        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}
        <section className="profile-banner rounded-2xl shadow-(--spellframe-glow)">
          <div className="relative z-10 h-full px-6 flex items-center">
            <div className="flex w-full items-center">
              
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setEditingAvatar(true)}
                  className="shrink-0"
                >
                  <div
                    className="
                      rounded-full
                      overflow-hidden
                      border border-neutral-700
                      bg-neutral-800
                      h-20 w-20
                      sm:h-24 sm:w-24
                      md:h-42 md:w-42
                    "
                  >
                    {user?.avatar?.source === "card" && user.avatar.image ? (
                      <div
                        className="h-full w-full"
                        style={{
                          backgroundImage: `url(${user.avatar.image})`,
                          backgroundSize: `${(user.avatar.zoom ?? 1) * 100}%`,
                          backgroundPosition: `${(user.avatar.x ?? 0.5) * 100}% ${(user.avatar.y ?? 0.5) * 100}%`,
                          backgroundRepeat: "no-repeat",
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-neutral-400">
                        No Avatar
                      </div>
                    )}
                  </div>
                </button>

                <div className="flex flex-col justify-center">
                  <h1
                    className="
                      font-semibold
                      text-neutral-100
                      pt-27
                      text-2xl
                      sm:text-3xl
                      md:text-5xl
                      leading-tight
                    "
                  >
                    {user?.username}
                  </h1>
                </div>
              </div>

              <div className="flex-1" />

              <div className="absolute top-4 right-4 z-20 scale-150 sm:scale-150">
                <ProfileSettingsMenu
                  onAccount={() => setAccountOpen(true)}
                  onPassword={() => setPasswordOpen(true)}
                  onDelete={() => setDeleteOpen(true)}
                />
              </div>

            </div>
          </div>
        </section>

        {/* ========================= */}
        {/* TABS */}
        {/* ========================= */}
        <div className="flex gap-6 border-b border-neutral-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("active")}
            className={`pb-2 text-sm font-medium transition ${
              activeTab === "active"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-neutral-300 hover:text-neutral-100"
            }`}
          >
            Decks
          </button>

          <button
            onClick={() => setActiveTab("archived")}
            className={`pb-2 text-sm font-medium transition ${
              activeTab === "archived"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-neutral-300 hover:text-neutral-100"
            }`}
          >
            Archived
          </button>

          {isFounder(user) && (
            <button
              onClick={() => setActiveTab("library")}
              className={`pb-2 text-sm font-medium transition ${
                activeTab === "library"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-neutral-300 hover:text-neutral-100"
              }`}
            >
              Library{" "}
                {libraryTotal !== null && (
                  <span className="text-neutral-300">({libraryTotal})</span>
                )}
            </button>
          )}

        </div>

        {/* ========================= */}
        {/* DECK LIST */}
        {/* ========================= */}
        {activeTab !== "library" && (
          <>
            {loading ? (
              <p className="text-sm text-neutral-400">Loading decks…</p>
            ) : filteredDecks.length === 0 ? (
              <div className="rounded-md border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-400">
                No decks here yet.
              </div>
            ) : (
              <ul
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  lg:grid-cols-3
                  gap-4
                "
              >
                {filteredDecks.map((deck) => (
                  <li key={deck._id} className="space-y-2">
                     <div
                      className="rounded-xl transition"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "var(--spellframe-glow)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <MiniDeckBanner
                        deck={{
                          ...deck,
                          user: {
                            username: user.username,
                            avatar: user.avatar,
                          },
                        }}
                        to={`/deck/${deck._id}`}
                        onToggleVisibility={toggleVisibility}
                        onUpdateLikes={updateDeckLikes}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs text-neutral-400 px-1">
                      <span>
                        Updated{" "}
                        {new Date(deck.updatedAt).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-4">
                        <button className="hover:text-yellow-400">
                          Archive
                        </button>

                        {confirmDeleteId === deck._id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => deleteDeck(deck._id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="hover:text-neutral-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(deck._id)}
                            className="hover:text-red-400"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {activeTab === "library" && (
          <div className="flex flex-col items-center shadow-(--spellframe-glow) justify-center gap-4 rounded-md border border-neutral-800 bg-neutral-900 p-10">
            <button
              onClick={() => navigate("/library")}
              className="
                text-lg
                font-semibold
                text-indigo-400
                hover:text-indigo-300
                flex
                items-center
                gap-2
              "
            >
              ➜ this way
            </button>
          </div>
        )}



        {/* ========================= */}
        {/* AVATAR MODAL */}
        {/* ========================= */}
        {editingAvatar && (
          <AvatarEditorModal
            user={user}
            onClose={() => setEditingAvatar(false)}
            onSaved={() => window.location.reload()}
          />
        )}
        <AccountSettingsModal
          isOpen={accountOpen}
          onClose={() => setAccountOpen(false)}
          initialUsername={user?.username}
          initialEmail={user?.email}
          onSubmit={async ({ username, email }) => {
            await apiPatch("/api/users/me", { username, email });
          }}
        />
        <ChangePasswordModal
          isOpen={passwordOpen}
          onClose={() => setPasswordOpen(false)}
          onSubmit={async ({ currentPassword, newPassword }) => {
            await apiPatch("/api/users/me/password", {
              currentPassword,
              newPassword,
            });

            logout();
            navigate("/login");
          }}
        />
        <DeleteAccountModal
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onSubmit={async () => {
            await apiDelete("/api/users/me");

            logout();
            navigate("/login");
          }}
        />
      </div>
      </div>
    </div>
  );
  
}
