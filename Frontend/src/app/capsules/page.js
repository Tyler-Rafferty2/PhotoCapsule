"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import DndCapsules from "@/components/DndCapsules";


function CapsuleModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [includeInCapsule, setIncludeInCapsule] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setCoverImage(file);

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl("");
    }
    setIncludeInCapsule(false);
  };

  const handleSubmit = () => {
    onSubmit({ name, description, coverImage, includeInCapsule});
    setName("");
    setDescription("");
    setCoverImage(null);
  };
  
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        background: "rgba(0, 0, 0, 0.7)", // black translucent background
      }}
    >
      <div className="backdrop-blur-md bg-white/70 p-6 rounded shadow-lg w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Create New Capsule</h2>
        <input
          type="text"
          placeholder="Capsule Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-2 p-2 border rounded bg-white/80 backdrop-blur"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mb-4 p-2 border rounded bg-white/80 backdrop-blur"
        />
        <div>
          <input type="file" accept="image/*" onChange={handleFileChange} />

          {previewUrl && (
            <div style={{ marginTop: "1rem" }}>
              <img
                src={previewUrl}
                alt="Cover Preview"
                style={{
                  maxWidth: "300px",
                  maxHeight: "200px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <div style={{ marginTop: "0.5rem" }}>
                <label>
                  <input
                    type="checkbox"
                    checked={includeInCapsule}
                    onChange={(e) => setIncludeInCapsule(e.target.checked)}
                  />{" "}
                  Include in capsule
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded shadow transition-colors duration-200"
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
            Create
          </button>
        </div>
      </div>
    </div>
  );
}




export default function CapsulesPage() {
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleCreateCapsule = async ({ name, description, coverImage, includeInCapsule}) => {
    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      const vaultResponse = await fetch("http://localhost:8080/api/addvaults", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ Name: name, Description: description}),
      });
      
    if (!vaultResponse.ok) {
      throw new Error("Failed to create vault");
    }

    const vaultData = await vaultResponse.json();
    const vaultId = vaultData.vaultId;
    const formData = new FormData();
    console.log(coverImage)
    formData.append("images", coverImage);
    //formData.append("IncludeInCapsule", includeInCapsule);

    await fetch(`http://localhost:8080/cover/upload/${vaultId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    console.log(includeInCapsule)
    if(includeInCapsule){
      await fetch(`http://localhost:8080/upload/${vaultId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: formData,
      });
    }

      fetchCapsules();
    } catch (err) {
      console.error("Failed to create capsule:", err);
    } finally {
      setCreating(false);
      setIsModalOpen(false);
    }
  };

  const handleUpload = async () => {
    if (file.length === 0) {
      return;
    }

    setStatus("uploading");

    const formData = new FormData();
    file.forEach((f) => {
      formData.append("images", f);
    });
    try {
      const res = await fetch(`http://localhost:8080/upload/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setPreview(null);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
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
            onClick={() => setIsModalOpen(true)}
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
          <DndCapsules capsules={capsules} setCapsules={setCapsules} />
        )}
      </div>

      <CapsuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCapsule}
      />
    </>
  );
}
