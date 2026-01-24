import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import GlobalHeader from "./components/layout/GlobalHeader";
import ScrollToTop from "./components/layout/ScrollToTop";
import MainPage from "./pages/MainPage";
import CommanderSelectPage from "./pages/CommanderSelectPage";
import DeckBuilderPage from "./pages/DeckBuilderPage";
import DeckViewerPage from "./pages/DeckViewerPage";
import ProfilePage from "./pages/ProfilePage";
import LibraryPage from "./pages/LibraryPage";
import CommanderFAQPage from "./pages/CommanderFAQPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";
import FounderRoute from "./routes/FounderRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth } from "./auth/AuthContext";
import ResetPasswordPage from "./pages/ResetPasswordPage";

export default function App() {
  const { user, isInitializing } = useAuth(); 

  if (isInitializing) {
    return null; 
  }

  return (
    <BrowserRouter>
      <ScrollToTop />

      <div className="min-h-dvh text-neutral-100">
        <GlobalHeader />

        <main className="relative">
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-email" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/decks/:deckId" element={<DeckViewerPage />} />
            <Route path="/" element={<MainPage />} />
            <Route path="/commander" element={<CommanderSelectPage />} />
            <Route path="/faq" element={<CommanderFAQPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/*  PROTECTED ROUTES */}
            <Route
              path="/deck"
              element={
                <ProtectedRoute>
                  <DeckBuilderPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/deck/:deckId"
              element={
                <ProtectedRoute>
                  <DeckBuilderPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* FOUNDER-ONLY */}
            <Route
              path="/library"
              element={
                <FounderRoute>
                  <LibraryPage />
                </FounderRoute>
              }
            />

            {/* FALLBACK */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
