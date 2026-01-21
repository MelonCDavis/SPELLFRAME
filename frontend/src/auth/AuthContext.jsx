import { createContext, useContext, useEffect, useState } from "react";
import { apiPost, apiGet } from "../services/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("tcc_token");
    if (storedToken) {
      setToken(storedToken);
    } else {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setIsInitializing(false);
      return;
    }

    apiGet("/api/users/me")
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, [token]);

  async function login({ email, password }) {
    const res = await apiPost("/api/auth/login", { email, password });

    localStorage.setItem("tcc_token", res.token);
    setToken(res.token);

    return res;
  }

  async function register({ email, username, password }) {
    return apiPost("/api/auth/register", {
      email,
      username,
      password,
    });
  }

  function logout() {
    localStorage.removeItem("tcc_token");
    setToken(null);
    setUser(null);
  }

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    isInitializing,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
