"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { authFetch } from "@/utils/authFetch";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
  user: null, 
  isAuthenticated: false,
  isLoading: true, 
  login: (token) => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 
  const router = useRouter();

  const logout = useCallback(async () => {
    console.log("Logging out, clearing all tokens.");

    // 1. Clear the short-term token on the client-side
    localStorage.removeItem("token");
    setUser(null);

    // 2. Make an API call to the backend to invalidate the refresh token cookie
    try {
      // The `fetch` request needs to await the response
      await fetch("http://localhost:8080/logout", {
        method: "POST",
        // This is crucial. It tells the browser to include the cookie with the request.
        credentials: "include", 
      });
      console.log("Backend logout endpoint called successfully.");
    } catch (error) {
      console.error("Failed to call logout endpoint:", error);
      // It's okay if the fetch fails, the user is still logged out locally.
    }
    router.push(`/`);
  }, []);


  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          console.log("Token expired, logging out.");
          logout();
        } else {
          console.log("Found valid token, setting user.");
          setUser(decoded);
        }
      }
    } catch (error) {
      // If token is malformed or invalid, decoding will fail
      console.error("Invalid token found in storage.", error);
      logout();
    } finally {
      // This is crucial to prevent the UI flicker
      setIsLoading(false);
    }
  }, [logout]); 

  useEffect(() => {
    const handleStorageChange = (event) => {
        if (event.key === "token") {
            if (!event.newValue) {
                logout();
            } else {
                try {
                    const decoded = jwtDecode(event.newValue);
                    if (decoded.exp * 1000 > Date.now()) {
                        setUser(decoded);
                    } else {
                        logout();
                    }
                } catch {
                    logout();
                }
            }
        }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [logout]);


  // 2. Define clear actions instead of exposing the setter
  const login = (token) => {
    try {
        const decoded = jwtDecode(token);
        localStorage.setItem("token", token);
        setUser(decoded);
    } catch (error) {
        console.error("Failed to decode token on login:", error);
        logout();
    }
  };

  // 3. Provide a richer value object to consumers
  const contextValue = {
    user,
    isAuthenticated: !!user, // Derived boolean is safer
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook remains the same and is great practice
export const useAuth = () => useContext(AuthContext);