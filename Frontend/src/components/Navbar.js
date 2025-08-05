"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/context/authContext";


function UserModal({ setIsUserModalOpen, user, logout }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsUserModalOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsUserModalOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [setIsUserModalOpen]);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-64 rounded-md shadow-lg z-50"
      style={{
        background: "var(--softbackground)",
        color: "var(--text)",
        border: "2px solid rgba(0, 0, 0, 0.3)",
      }}
    >
      <div className="p-4 text-sm text-gray-800">
        <div className="font-semibold mb-2">User Info</div>
        <div className="mb-2">
          <span className="font-medium">Email:</span> {user?.email}
        </div>
        <button
          style={{
                  background: "var(--accent)",
                  color: "#fff",
          }}
          onClick={() => setIsUserModalOpen(false)}
          className="w-full mt-3 px-4 py-2 text-white rounded transition"
          onMouseOver={(e) => (e.currentTarget.style.background = "var(--secondaccent)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
        >
          Close
        </button>
        <button
          style={{
                  background: "var(--accent)",
                  color: "#fff",
          }}
          onClick={logout}
          className="w-full mt-3 px-4 py-2 text-white rounded transition"
          onMouseOver={(e) => (e.currentTarget.style.background = "var(--secondaccent)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
        >
          Logout
        </button>
      </div>
    </div>
  );
}


export default function Navbar() {
  // 1. Consume the new, correct context values
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)

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
            {isAuthenticated ? ( 
              <>
                <Link href="/capsules" className="hover:underline">
                  Capsules
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setIsUserModalOpen(true)}
                    className="hover:underline"
                  >
                    User Info
                  </button>
                  {isUserModalOpen && (
                    <UserModal
                      setIsUserModalOpen={setIsUserModalOpen}
                      user={user}
                      logout={logout}
                    />
                  )}
                </div>
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