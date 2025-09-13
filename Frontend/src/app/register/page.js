"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("https://photocapsule.onrender.com/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error(await res.text());

      setStatus("success");
      setEmail("");
      setPassword("");
      // Instead of redirecting immediately, show the button
      // router.push("/login");
    } catch (err) {
      console.error("Signup error:", err.message);
      setStatus("error");
    }
  };

  return (
    <>
      <Navbar />
      <div className="pt-32 px-6 pb-16 max-w-7xl mx-auto flex justify-center">
        <form
          onSubmit={handleSignUp}
          className="backdrop-blur-md bg-white/70 p-8 rounded shadow-lg w-full max-w-md space-y-4"
        >
          <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded shadow-sm"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded shadow-sm"
            required
          />

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full px-5 py-3 rounded shadow transition-colors duration-200"
            style={{
              background: "var(--accent)",
              color: "#fff",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "var(--secondaccent)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "var(--accent)")
            }
          >
            {status === "loading" ? "Creating..." : "Sign Up"}
          </button>

          {status === "success" && (
            <div className="text-center space-y-2">
              <p className="text-green-600 text-sm">
                ✅ Account created! Please verify your email.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 mt-2 rounded shadow bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
              >
                Proceed to Sign In
              </button>
            </div>
          )}

          {status === "error" && (
            <p className="text-red-600 text-sm text-center">
              ❌ Signup failed
            </p>
          )}
        </form>
      </div>
    </>
  );
}
