"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import Link from "next/link";

// Hero Section Component
const HeroSection = () => (
  <section className="flex flex-col md:flex-row items-center justify-between py-16 px-8">
    {/* Left side: Text and buttons */}
    <div className="flex-1 text-left">
      <h1 className="text-6xl md:text-4xl font-bold mb-4">
        Your memories,<br />safely stored.
      </h1>
      <p className="max-w-md mb-6" style={{ color: "var(--text)" }}>
        Organize, protect, and revisit your favorite moments anytime.
      </p>
      <div className="space-x-4">
        <a
          href="/vaults"
          className="inline-block text-white px-6 py-3 rounded shadow transition"
          style={{ background: "var(--accent)" }}
        >
          View Your Vaults
        </a>
        <a
          href="/create"
          className="inline-block text-white px-6 py-3 rounded shadow transition"
          style={{ background: "var(--accent)" }}
        >
          Create a Vault
        </a>
      </div>
    </div>

    {/* Right side: Shield logo */}
    <div className="mt-12 md:mt-0 md:ml-12 flex-shrink-0">
      <img
        src="Logo.png"
        alt="Shield Logo"
        className="w-100 h-100"
      />
    </div>
  </section>
);

// Vault Card Component
const VaultCard = ({ image, title, description }) => (
  <div className="bg-white rounded shadow p-4" style={{ background: "var(--softbackground)", color: "var(--text)" }}>
    <img src={image} alt={title} className="rounded mb-2" />
    <h3 className="font-semibold">{title}</h3>
    <p className="text-sm">{description}</p>
  </div>
);

// Vault Section Component
const VaultSection = () => {
  const vaults = [
    {
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      title: "Summer 2023",
      description: "Photos from our beach vacation",
    },
    {
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
      title: "Family",
      description: "Captured memories with family members",
    },
    {
      image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f",
      title: "Graduation",
      description: "Snapshots from the graduation ceremony",
    },
  ];

  return (
    <section className="px-8 py-12 rounded-t-3xl shadow-inner" style={{ background: "var(--background)" }}>
      <h2 className="text-xl font-semibold mb-6">Your Vaults</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vaults.map((vault, index) => (
          <VaultCard
            key={index}
            image={vault.image}
            title={vault.title}
            description={vault.description}
          />
        ))}
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => (
  <footer className="text-center py-6 text-gray-500 text-sm" style={{ color: "var(--text)" }}>
    © 2025 PhotoVault. All rights reserved.
  </footer>
);

// Main Home Component
export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <Navbar />
      <HeroSection />
      <VaultSection />
      <Footer />
    </div>
  );
}
