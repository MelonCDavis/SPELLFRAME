import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { isFounder } from "../auth/founder";

export default function FounderRoute({ children }) {
   const { user, isAuthenticated, isInitializing } = useAuth();

  if (!isInitializing) {
    return null;
  }
  
  if (!isAuthenticated || !isFounder(user)) {
    return <Navigate to="/profile" replace />;
  }

  return children;
}
