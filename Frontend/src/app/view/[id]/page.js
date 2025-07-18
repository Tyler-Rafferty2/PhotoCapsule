"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Dnd from "@/components/Dnd";
import Time from "@/components/Time";
import { authFetch } from "@/utils/authFetch"; // ✅ NEW

function ImagePreview({ srcList }) {
  if (!srcList || srcList.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 mt-4">
      {srcList.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt={`Preview ${idx}`}
          className="w-64 h-auto rounded border"
        />
      ))}
    </div>
  );
}

function StatusMessage({ status }) {
  if (status === "success") {
    return (
      <p className="text-green-600 text-sm text-center">✅ Upload successful</p>
    );
  } else if (status === "error") {
    return <p className="text-red-600 text-sm text-center">❌ Upload failed</p>;
  }
  return null;
}

export default function ViewPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const [status, setStatus] = useState("idle");
  const [file, setFile] = useState([]);
  const [preview, setPreview] = useState([]);
  const [releaseTime, setReleaseTime] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

  const handleFileSelect = (selectedFiles) => {
    const filesArray = Array.isArray(selectedFiles)
      ? selectedFiles
      : [selectedFiles];
    const newPreviews = filesArray.map((file) => URL.createObjectURL(file));

    setFile(filesArray);
    setPreview(newPreviews);
    setStatus("idle");
  };

  function LinkToHome() {
    return (
      <div className="text-center mt-8">
        <Link href={`/capsules`} className="text-blue-500 hover:underline">
          Go back to capsules
        </Link>
      </div>
    );
  }

  const handleTrash = async (img) => {
    try {
      const res = await authFetch(`http://localhost:8080/api/upload/trash/${img}`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Trash failed");
      fetchImages();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchImages = async () => {
    try {
      const res = await authFetch(`http://localhost:8080/images/${id}`);
      const data = await res.json();
      setImages(data);
    } catch (err) {
      console.error("Failed to fetch images:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (file.length === 0) return;

    setStatus("uploading");

    const formData = new FormData();
    file.forEach((f) => {
      formData.append("images", f);
    });

    try {
      const res = await authFetch(`http://localhost:8080/upload/${id}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      await res.json();
      setPreview([]);
      setFile([]);
      setStatus("success");
      setIsModalOpen(false);
      fetchImages();
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchVaultTime = async () => {
    try {
      const res = await authFetch(`http://localhost:8080/time/get/${id}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Request failed: ${text}`);
      }

      const data = await res.json();
      if (data.release_time) {
        const d = new Date(data.release_time);
        const formatted = d.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        setReleaseTime(formatted);
      } else {
        setReleaseTime("No time set");
      }
    } catch (err) {
      console.error("Error fetching vault time:", err);
      setReleaseTime("Error loading time");
    }
  };

  useEffect(() => {
    fetchVaultTime();
  }, [id]);

  useEffect(() => {
    if (!isTimeModalOpen) {
      fetchVaultTime();
    }
  }, [isTimeModalOpen]);

  return (
    <>
      <Navbar />
      <div
        className="pt-32 px-8 pb-16 max-w-7xl mx-auto space-y-8"
        style={{ color: "var(--text)" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded shadow transition-colors duration-200"
            style={{
              background: "var(--accent)",
              color: "#fff",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--secondaccent)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
          >
            ➕ Upload Image
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              {releaseTime}
            </span>
            <button
              onClick={() => setIsTimeModalOpen(true)}
              className="px-3 py-1 rounded shadow text-sm transition-colors duration-200"
              style={{
                background: "var(--accent)",
                color: "#fff",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "var(--secondaccent)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
            >
              Edit Time
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold">📸 Uploaded Images</h1>

            <Link
              href={`/view/trash/${id}`}
              className="px-5 py-3 rounded shadow transition-colors duration-200"
              style={{
                background: "var(--accent)",
                color: "#fff",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "var(--secondaccent)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
            >
              🗑️ Go To Trash
            </Link>
          </div>

          {loading ? (
            <p style={{ color: "var(--foreground)" }}>Loading images...</p>
          ) : images.length === 0 ? (
            <p style={{ color: "var(--foreground)" }}>No images uploaded yet.</p>
          ) : (
            <Dnd
              images={images}
              setImages={setImages}
              handleTrash={handleTrash}
            />
          )}
        </div>

        <LinkToHome />
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0, 0, 0, 0.7)" }}
        >
          <div
            className="backdrop-blur-md bg-white/70 p-6 rounded shadow-lg w-full max-w-sm"
            style={{ maxHeight: "80vh", overflowY: "auto" }}
          >
            <h2 className="text-xl font-bold mb-4">Upload Images</h2>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  handleFileSelect(Array.from(files));
                }
              }}
              className="mb-4"
            />
            <ImagePreview srcList={preview} />
            <StatusMessage status={status} />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={status === "uploading"}
                className="px-5 py-3 rounded shadow transition-colors duration-200"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "var(--secondaccent)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
              >
                {status === "uploading" ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isTimeModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0, 0, 0, 0.7)" }}
        >
          <div
            className="backdrop-blur-md bg-white/70 p-8 rounded shadow-lg w-full max-w-xl"
            style={{ height: "80vh", overflowY: "auto" }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Edit Release Time</h2>
            <Time vaultId={id} />
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsTimeModalOpen(false)}
                className="px-5 py-3 rounded shadow transition-colors duration-200"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "var(--secondaccent)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
