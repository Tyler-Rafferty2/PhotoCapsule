"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  return (
    <nav
      style={{
        background: "var(--softbackground)",
        color: "var(--text)",
      }}
      className={`fixed top-0 left-0 w-full z-50 shadow-md transition-all duration-300 ${
        isScrolled ? "py-1" : "py-4"
      }`}
    >
      <div className=" flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-1">
          <img
            src="/PhotoCapsuleLogo.png"
            alt="Photo Capsule Logo"
            className="h-12 w-12 object-contain"
          />
          <span className="text-3xl font-bold tracking-tight">Photo Capsule</span>
        </Link>

        <div className="flex items-center space-x-6">
          <ThemeToggle />
          <div className="flex items-center space-x-4 text-sm">
            {isLoggedIn ? (
              <>
                <Link href="/capsules" className="hover:underline">
                  Capsules
                </Link>
                <button
                  onClick={handleLogout}
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
