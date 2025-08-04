"use client";

import {useState, useEffect} from "react"
import Navbar from "@/components/Navbar";
import Link from "next/link";
import useSmoothScroll from "@/hooks/useSmoothScroll";

// Hero Section Component
const HeroSection = () => {
  const [token, setToken] = useState("");

  useEffect(() => {
    // Set initial token on mount
    setToken(localStorage.getItem("token") || "");

    const handleTokenChange = () => {
      setToken(localStorage.getItem("token") || "");
    };

    // Listen for custom event
    window.addEventListener("tokenChange", handleTokenChange);

    // Cleanup
    return () => window.removeEventListener("tokenChange", handleTokenChange);
  }, []);
  
  return (
    <section className="flex flex-col md:flex-row items-center justify-between py-20 px-8 min-h-screen">
      <div className="flex-1 text-left">
        <h1 className="text-6xl font-bold mb-4">
          Save the moments<br />that matter most.
        </h1>
        <p className="max-w-md mb-8 text-2xl" style={{ color: "var(--text)" }}>
          Create a personal time capsule to keep your memories alive forever.
        </p>
        <div className="space-x-4">
          {token && (
            <Link
              href="/capsules"
              className="inline-block text-white px-6 py-3 rounded shadow"
              style={{ background: "var(--accent)" }}
            >
              View Your Capsules
            </Link>
          )}
          <Link
            href="/capsules?create=true"
            className="inline-block text-white px-6 py-3 rounded shadow"
            style={{ background: "var(--accent)" }}
          >
            Create a Capsule
          </Link>
        </div>
      </div>

      <div className="relative w-80 h-80 mt-12 md:mt-0 md:ml-12">
        <div
          className="absolute top-1/2 left-1/2"
          style={{
            width: "100%",
            height: "100%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <img
            src="/PhotoCapsuleLogo.png"
            alt="Photo Capsule Logo"
            className="relative z-10 w-full h-full object-contain"
          />
        </div>
      </div>
    </section>
  );
};

// Capsule Card Component
const CapsuleCard = ({ image, title, description }) => {
  return (
    <div
      className="relative rounded-lg shadow-lg p-6"
      style={{ background: "var(--softbackground)", color: "var(--text)" }}
    >
      <span className="absolute top-2 right-2 bg-[#4285F4] text-white text-xs px-2 py-0.5 rounded">
        Example
      </span>
      <img 
        src={image} 
        alt={title} 
        className="rounded-lg mb-4 w-full h-48 object-cover"
        loading="lazy"
      />
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm opacity-80">{description}</p>
    </div>
  );
};

// Capsule Section Component
const CapsuleSection = () => {
  const capsules = [
    {
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
      title: "Summer 2023",
      description: "Photos from our beach vacation.",
    },
    {
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=300&fit=crop",
      title: "Family",
      description: "Captured memories with family members.",
    },
    {
      image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop",
      title: "Graduation",
      description: "Snapshots from the graduation ceremony.",
    },
  ];

  return (
    <section className="px-8 py-20 rounded-t-3xl shadow-inner min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-semibold mb-4">Example Capsules</h2>
        <p className="text-gray-500 text-sm mb-12">
          (These are example capsules to show how your saved memories might look)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {capsules.map((capsule, index) => (
            <CapsuleCard
              key={index}
              image={capsule.image}
              title={capsule.title}
              description={capsule.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Why Section Component
const WhySection = () => {
  const features = [
    {
      icon: "🔒",
      title: "Private & Secure",
      description: "Your memories are always safe and protected."
    },
    {
      icon: "📱",
      title: "Access Anywhere",
      description: "View your photos from any device, anytime."
    },
    {
      icon: "📂",
      title: "Easy to Organize",
      description: "Create capsules and keep things simple."
    }
  ];

  return (
    <section className="px-8 py-20 text-center min-h-screen flex flex-col justify-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-semibold mb-8">Why Photo Capsule?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="text-center py-8 text-gray-500 text-sm border-t" style={{ color: "var(--text)" }}>
      <div className="max-w-6xl mx-auto">
        © 2025 Photo Capsule. All rights reserved.
      </div>
    </footer>
  );
};

// Main Home Component
export default function Home() {
  useSmoothScroll();

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <Navbar />
      <HeroSection />
      <CapsuleSection />
      <WhySection />
      <Footer />
    </div>
  );
}
