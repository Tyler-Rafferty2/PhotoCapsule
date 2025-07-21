"use client";

import Navbar from "@/components/Navbar";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/context/authContext";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [token, setToken] = useState(null);
  const { setIsLoggedIn } = useAuth();

  const router = useRouter();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("http://localhost:8080/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      setStatus("success");
      //alert('Account singned in!');
      setEmail("");
      setPassword("");
      setToken(data.token);
      localStorage.setItem("token", data.token);
      setIsLoggedIn(true);
      //window.dispatchEvent(new Event("tokenChange"));
      router.push("/");
    } else {
      setStatus("error");
      const error = await res.text();
      //alert(`Signup failed: ${error}`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-center">
        <form
          onSubmit={handleSignIn}
          className="space-y-4 border-t pt-6 mt-6 w-[50vw] max-w-md flex flex-col"
        >
          <h2 className="text-lg font-semibold text-center">Sign In</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
          >
            {status === "loading" ? "Signing in..." : "Sign In"}
          </button>

          {status === "success" && (
            <p className="text-green-600 text-sm text-center">
              ✅ Signed in! Token: {token}
            </p>
          )}
          {status === "error" && (
            <p className="text-red-600 text-sm text-center">
              ❌ Sign-in failed
            </p>
          )}
        </form>
      </div>
    </>
  );
}
