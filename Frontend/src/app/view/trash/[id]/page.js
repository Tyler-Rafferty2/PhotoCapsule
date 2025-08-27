"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { authFetch } from "@/utils/authFetch"; // ✅ new import

export default function ViewPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  const fetchImages = async () => {
    try {
      const res = await authFetch(`http://localhost:8080/images/trash/${id}`);
      const data = await res.json();
      console.log("Fetched data:", data);

      // fetch each image as blob
      const withUrls = await Promise.all(
        data.map(async (img) => {
          const imageRes = await authFetch(`http://localhost:8080${img.url}`); 
          const blob = await imageRes.blob();
          const objectUrl = URL.createObjectURL(blob);

          return { ...img, objectUrl };
        })
      );

      setImages(withUrls);
    } catch (err) {
      console.error("Failed to fetch images:", err);
    } finally {
      setLoading(false);
    }
  };

  const PermDel = async (img) => {
    try {
      const res = await authFetch(
        `http://localhost:8080/images/trash/delete/${img}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Delete failed");
      fetchImages();
    } catch (err) {
      console.error(err);
    }
  };

  const Recover = async (img) => {
    try {
      const res = await authFetch(
        `http://localhost:8080/images/trash/recover/${img}`,
        {
          method: "PATCH",
        }
      );

      if (!res.ok) throw new Error("Recover failed");
      fetchImages();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    console.log("✅ Updated images:", images);
  }, [images]);

  return (
    <>
      <Navbar />
      <div
        className="pt-32 px-8 pb-16 max-w-7xl mx-auto space-y-8"
        style={{ color: "var(--text)" }}
      >
        <h1 className="text-3xl font-bold mb-4">🗑️ Trash</h1>

        {loading ? (
          <p style={{ color: "var(--foreground)" }}>Loading images...</p>
        ) : images.length === 0 ? (
          <p style={{ color: "var(--foreground)" }}>No images in trash.</p>
        ) : (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            }}
          >
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square overflow-hidden border rounded shadow transition-transform duration-200 hover:scale-105 group bg-white/80 backdrop-blur hover:shadow-lg"
              >
                <button
                  onClick={() => PermDel(img.id)}
                  className="absolute top-2 right-2 px-3 py-1 rounded shadow text-xs transition-colors duration-200"
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
                  Delete
                </button>
                <button
                  onClick={() => Recover(img.id)}
                  className="absolute top-2 left-2 px-3 py-1 rounded shadow text-xs transition-colors duration-200"
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
                  Recover
                </button>
                <img
                  src={img.objectUrl}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  alt={`Trash ${idx}`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <Link
            href={`/view/${id}`}
            className="px-5 py-3 rounded shadow transition-colors duration-200"
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
            View Vault
          </Link>
        </div>
      </div>
    </>
  );
}
