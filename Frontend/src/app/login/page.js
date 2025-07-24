"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [token, setToken] = useState(null);
  const { setIsLoggedIn } = useAuth();
  const router = useRouter();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("http://localhost:8080/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setIsLoggedIn(true);
      setStatus("success");
      setEmail("");
      setPassword("");
      router.push("/");
    } catch (err) {
      setStatus("error");
      console.error("Sign-in error:", err.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="pt-32 px-6 pb-16 max-w-7xl mx-auto flex justify-center">
        <div className="backdrop-blur-md bg-white/70 p-8 rounded shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
          <form onSubmit={handleSignIn} className="space-y-4">
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
              {status === "loading" ? "Signing in..." : "Sign In"}
            </button>

            {status === "success" && (
              <p className="text-green-600 text-sm text-center mt-2">
                ✅ Signed in successfully
              </p>
            )}
            {status === "error" && (
              <p className="text-red-600 text-sm text-center mt-2">
                ❌ Sign-in failed
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
