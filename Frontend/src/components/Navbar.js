"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/context/authContext";

export default function Navbar() {
  // 1. Consume the new, correct context values
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // 2. Keep the UI-specific logic (scroll event)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3. Remove the manual `useEffect` for localStorage and the `handleLogout` function.
  // The logout function is now provided by the context.
  
  // 4. Handle the isLoading state in the UI
  if (isLoading) {
    // Render a simple, static navbar while authentication status is being determined.
    return (
      <nav
        style={{
          background: "var(--softbackground)",
          color: "var(--text)",
          borderBottom: "2px solid rgba(0, 0, 0, 0.1)",
        }}
        className="fixed top-0 left-0 w-full z-50 py-1"
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-1">
            <img
              src="/PhotoCapsuleLogo.png"
              alt="Photo Capsule Logo"
              className="h-12 w-12 object-contain"
            />
            <span className="text-xl font-bold tracking-tight">Photo Capsule</span>
          </Link>
          <div className="flex items-center space-x-6 px-4">
            <ThemeToggle />
            {/* You could add a loading spinner here */}
          </div>
        </div>
      </nav>
    );
  }

  // 5. Render the final UI based on the isAuthenticated status
  return (
    <nav
      style={{
        background: "var(--softbackground)",
        color: "var(--text)",
        borderBottom: "2px solid rgba(0, 0, 0, 0.1)",
      }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 py-1`}
    >
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-1">
          <img
            src="/PhotoCapsuleLogo.png"
            alt="Photo Capsule Logo"
            className="h-12 w-12 object-contain"
          />
          <span className="text-xl font-bold tracking-tight">Photo Capsule</span>
        </Link>
        <div className="flex items-center space-x-6 px-4">
          <ThemeToggle />
          <div className="flex items-center space-x-4 text-sm">
            {isAuthenticated ? ( // Use isAuthenticated instead of isLoggedIn
              <>
                <Link href="/capsules" className="hover:underline">
                  Capsules
                </Link>
                <button
                  onClick={logout} // Use the logout function from the context
                  className="hover:underline"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:underline">
                  Log In
                </Link>
                <Link href="/register" className="hover:underline">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}