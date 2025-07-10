"use client"; // ← Add this if you're using the App Router

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <nav 
        style={{
        background: "var(--softbackground)",
        color: "var(--secondary)",
      }}
      className="p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">
          <Link href="/">PhotoVault</Link>
        </h1>
        <ThemeToggle/>
        <div className="space-x-4 text-sm">
          {isLoggedIn ? (
            <>
              <Link href="/vaults" className="hover:underline">
                Vaults
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  setIsLoggedIn(false);
                }}
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
    </nav>
  );
}
