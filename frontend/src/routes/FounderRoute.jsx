import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { isFounder } from "../auth/founder";

export default function FounderRoute({ children }) {
   const { user, isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return null;
  }
  
  if (!user) {
    return null;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }
  
  if (!isFounder(user)) {
    return <Navigate to="/profile" replace />;
  }

  return children;
}
