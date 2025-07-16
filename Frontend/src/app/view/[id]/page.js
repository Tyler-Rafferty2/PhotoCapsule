"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Dnd from "@/components/Dnd";
import Time from "@/components/Time";

function LinkToHome() {
  return (
    <div className="text-center mt-8">
      <Link href="/" className="text-blue-500 hover:underline">
        Go home
      </Link>
    </div>
  );
}

function UploadButton({ onClick, disabled, status }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-5 py-3 rounded shadow transition-colors duration-200 w-full"
      style={{
        background: "var(--accent)",
        color: "#fff",
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = "var(--secondaccent)")}
      onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
    >
      {status === "uploading" ? "Uploading..." : "Upload"}
    </button>
  );
}

function FileInput({ onSelect }) {
  return (
    <div>
      <label
        htmlFor="fileUpload"
        className="cursor-pointer inline-block px-5 py-3 rounded shadow transition-colors duration-200"
        style={{
          background: "var(--accent)",
          color: "#fff",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "var(--secondaccent)")}
        onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
      >
        Upload your image
      </label>
      <input
        id="fileUpload"
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            onSelect(Array.from(files));
          }
        }}
        className="hidden"
      />
    </div>
  );
}

function ImagePreview({ srcList }) {
  if (!srcList || srcList.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4">
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

  const handleFileSelect = (selectedFiles) => {
    const filesArray = Array.isArray(selectedFiles)
      ? selectedFiles
      : [selectedFiles];
    const newPreviews = filesArray.map((file) => URL.createObjectURL(file));

    setFile((prevFiles) => [...prevFiles, ...filesArray]);
    setPreview((prevPreviews) => [...prevPreviews, ...newPreviews]);
    setStatus("idle");
  };

  const handleTrash = async (img) => {
    try {
      const res = await fetch(`http://localhost:8080/api/upload/trash/${img}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!res.ok) throw new Error("Trash failed");
      fetchImages();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/images/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setImages(data);
    } catch (err) {
      console.error("Failed to fetch images:", err);
    } finally {
      setLoading(false);
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

      await res.json();
      setPreview([]);
      setFile([]);
      setStatus("success");
      fetchImages();
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <>
      <Navbar />
      <div
        className="pt-32 px-8 pb-16 max-w-7xl mx-auto space-y-8"
        style={{ color: "var(--text)" }}
      >
        <Time vaultId={id} />

        <FileInput onSelect={handleFileSelect} />
        <ImagePreview srcList={preview} />
        <StatusMessage status={status} />
        <UploadButton
          onClick={handleUpload}
          disabled={status === "uploading"}
          status={status}
        />

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
    </>
  );
}
