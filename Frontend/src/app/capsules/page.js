"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function CapsulesPage() {
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchCapsules = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/getvaults", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("Fetched capsules:", data);
      setCapsules(data);
    } catch (err) {
      console.error("Failed to load capsules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapsules();
  }, []);

  const handleCreateCapsule = async () => {
    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:8080/api/addvaults", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ Name: `Capsule ${capsules.length + 1}` }),
      });
    } catch (err) {
      console.error("Failed to create capsule:", err);
    } finally {
      setCreating(false);
      fetchCapsules();
    }
  };

  return (
    <>
      <Navbar />
      <div
        className="pt-32 px-8 pb-16 max-w-7xl mx-auto space-y-8"
        style={{ color: "var(--text)" }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold ">📂 Your Capsules</h1>

          <button
            onClick={handleCreateCapsule}
            disabled={creating}
            className="px-5 py-3 rounded shadow transition-colors duration-200"
            style={{
              background: "var(--accent)",
              color: "#fff",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--secondaccent)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
          >
            {creating ? "Creating..." : "➕ Create Capsule"}
          </button>
        </div>

        {loading ? (
          <p style={{ color: "var(--foreground)" }}>Loading capsules...</p>
        ) : capsules.length === 0 ? (
          <p style={{ color: "var(--foreground)" }}>
            No capsules yet. Click above to create one.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {capsules.map((capsule) => (
              <li
                key={capsule.ID}
                className="relative group p-4 rounded shadow-sm transition-transform duration-300 hover:scale-105"
                style={{
                  background: "var(--softbackground)",
                  border: `1px solid var(--border)`,
                }}
              >
                <Link href={`/view/${capsule.ID}`}>
                  <div className="relative inline-block mx-auto">
                    <img
                      src="/Vault-Closed.png"
                      alt="Capsule Closed"
                      className="transition-opacity duration-300 group-hover:opacity-0 w-32 mx-auto"
                    />
                    <img
                      src="/Vault-Open.png"
                      alt="Capsule Open"
                      className="absolute top-0 left-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 w-32 mx-auto"
                    />
                  </div>
                  <p className="text-center text-lg font-semibold mt-2">{capsule.Title}</p>
                  <p className="text-center text-sm" style={{ color: "var(--foreground)" }}>
                    {capsule.Description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
