"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Dnd from "@/components/Dnd";
import Time from "@/components/Time";
import { authFetch } from "@/utils/authFetch";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import Image from "next/image";
import { useNavigate } from "react-router-dom";

function ShareModal({setIsShareModalOpen,capsule}){
  return(
    <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0, 0, 0, 0.7)" }}
        >
          <div
            className="backdrop-blur-md bg-white/70 p-8 rounded shadow-lg w-full max-w-xl"
            style={{ height: "80vh", overflowY: "auto" }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Share &quot;{capsule.Title}&quot;</h2>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsShareModalOpen(false)}
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
  );
}

function TimeModal({setIsTimeModalOpen,id,setCapsule}){
  const modalRef = useRef(null);
  useOnClickOutside(modalRef, () => setIsTimeModalOpen(false));

  return(
    <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0, 0, 0, 0.7)" }}
        >
          <div
            className="backdrop-blur-md bg-white/70 p-8 rounded shadow-lg w-full max-w-xl"
            style={{ height: "80vh", overflowY: "auto" }}
            ref={modalRef}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Edit Release Time</h2>
            <Time vaultId={id} setCapsule={setCapsule}/>
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
  );
}

function ImagePreview({ srcList }) {
  if (!srcList || srcList.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 mt-4">
      {srcList.map((src, idx) => (
        <Image
          key={idx}
          src={src}
          alt={`Preview ${idx}`}
          className="w-64 h-auto rounded border"
        />
      ))}
    </div>
  );
}

function StatusMessage({ uploadStatus }) {
  if (uploadStatus === "success") {
    return (
      <p className="text-green-600 text-sm text-center">✅ Upload successful</p>
    );
  } else if (uploadStatus == "idle" || uploadStatus == "uploading"){
    return null;
  }
  else{
    return (
      <p className="text-red-600 text-sm text-center">
        ❌ {uploadStatus || "Upload failed"}
      </p>
    );
  }
}

function ImageUploadModal({
  setIsImageModalOpen,
  preview,
  uploadStatus,
  setUploadStatus,
  handleUpload,
  handleFileSelect,
  storage,
  setPreview,
  setFile,
  file,
  setStorage
}) {
  const fileInputRef = useRef(null);

  const modalRef = useRef(null);
  useOnClickOutside(modalRef, () => setIsImageModalOpen(false), () => {
    setUploadStatus("idle")
    handleFileSelect(null);
  });

  const handleButtonClick = () => {
      fileInputRef.current?.click();
    };

  const handleRemoveFile = (index) => {
    // Free the object URL
    URL.revokeObjectURL(preview[index]);

    // Remove the file from files
    const newFiles = [...file];
    const removedFile = newFiles.splice(index, 1)[0];
    setFile(newFiles);

    // Remove the preview
    const newPreview = [...preview];
    newPreview.splice(index, 1);
    setPreview(newPreview);

    // Subtract the removed file size from storage
    console.log(removedFile)
    setStorage((prevStorage) => prevStorage - removedFile.size);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleFileSelect(files);
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
    >
      <div
        className="backdrop-blur-md bg-white/70 p-6 rounded shadow-lg w-full max-w-[80vw]"
        style={{ maxHeight: "80vh", overflowY: "auto" }}
        ref={modalRef}
      >
        <h2 className="text-xl font-bold mb-4">Upload Images with {storage}</h2>

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              handleFileSelect(Array.from(files));
            }
          }}
        />

        
        {/* Drag & Drop / Default Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed rounded p-4 mb-4 flex flex-wrap gap-2 justify-start`}
          style={{
            minHeight: preview.length === 0 ? "150px" : "auto", // default zone height
            width: "100%",
            backgroundColor: "#f9f9f9",
            cursor: "pointer",
          }}
          onClick={handleButtonClick} // allow click to select as well
        >
          {preview.length === 0 ? (
            <span className="text-gray-500 m-auto">Drag & drop images here or click to select</span>
          ) : (
            preview.map((src, index) => (
              <div key={index} className="relative">
                <Image
                  src={src}
                  alt={`preview-${index}`}
                  className="h-24 w-24 object-cover rounded"
                />
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  type="button"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
        {/* <ImagePreview srcList={preview} /> */}
        <StatusMessage uploadStatus={uploadStatus} />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => {
              setIsImageModalOpen(false)
              setUploadStatus("idle")
              handleFileSelect(null)}}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploadStatus === "uploading"}
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
            {uploadStatus === "uploading" ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CapsuleSettingModal({ setIsCapulseSettingOpen, capsule, setCapsule }) {
  // State to store the title and description for editing
  const [title, setTitle] = useState(capsule?.Title || "");
  const [description, setDescription] = useState(capsule?.Description || "");


  const modalRef = useRef(null);
  useOnClickOutside(modalRef, () => setIsCapulseSettingOpen(false));

  // Reference to the description textarea for auto-resizing
  const descriptionRef = useRef(null);

  // Automatically adjust the height of the description textarea
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = "auto"; // Reset the height
      descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`; // Set the height to match the content
    }
  }, [description]); // Run the effect whenever description changes

  const updateVault = async (id, updatedFields) => {
    try {
      const response = await authFetch(`/vault/changeTitleAndDesc/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedFields),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();

      return data
    } catch (err) {
      console.error("Failed to update vault:", err.message);
    }
  };

  const handleSave = async () => {
    const updated = await updateVault(capsule.ID, {
      Title: title,
      Description: description,
    });
    if (updated) {
      setCapsule(updated); // ✅ set with the updated vault
    }
    setIsCapulseSettingOpen(false); // ✅ then close modal
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
    >
      <div
        className="backdrop-blur-md bg-white/70 p-8 rounded shadow-lg w-full max-w-xl"
        style={{ height: "80vh", overflowY: "auto" }}
        ref={modalRef}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Settings</h2>

        {/* Title and Description fields */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            type="text"
            className="w-full p-3 rounded border"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            ref={descriptionRef}
            id="description"
            className="w-full p-3 rounded border"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ resize: "none", overflow: "hidden" }} // Disables manual resizing and hides overflow
          />
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={() => setIsCapulseSettingOpen(false)}
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
          <button
            onClick={handleSave}
            className="px-5 py-3 rounded shadow transition-colors duration-200 ml-2"
            style={{
              background: "var(--accent)",
              color: "#fff",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--secondaccent)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function BuryModal({ setIsBuryModalOpen, capsule}) {
  const [userInput, setUserInput] = useState(""); // State to store the user's input
  const [isValid, setIsValid] = useState(false); // To check if the input matches the title
  const navigate = useNavigate();

  const modalRef = useRef(null);
  useOnClickOutside(modalRef, () => setIsBuryModalOpen(false));

  // Function to handle input change
  const handleInputChange = (e) => {
    setUserInput(e.target.value);
    // Validate if the user input matches the capsule title
    if (e.target.value === capsule.Title && capsule.UnlockDate != null) {
      setIsValid(true);
    }else {
      setIsValid(false);
    }
  };

  const buryCapsule = async () => {
    // Call the patch function, passing capsule ID or any necessary data
    setUserInput("")
    setIsValid(false);
    console.log(`Burying capsule with ID: ${capsule.ID}`);
    try {
      const response = await authFetch(`/vault/changeStatus/${capsule.ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({Status: "buried"}),
      });
      const result = await response.json();
      console.log(result.message);  // You can display a success message or handle further logic here
      navigate("/capsules");
    } catch (error) {
      console.error("Error:", error);
    }
      setIsBuryModalOpen(false); // Close the modal after deletion
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        background: "rgba(0, 0, 0, 0.7)", // black translucent background
      }}
    >
      <div className="backdrop-blur-md bg-white/70 p-6 rounded shadow-lg w-full max-w-sm relative" ref={modalRef}>
        {/* Modal Content */}
        <h2 className="text-center text-lg font-semibold mt-2">
          Are you sure you want to bury &quot;{capsule.Title}&quot;?
        </h2>
        
        {/* Input for confirmation */}
        <p className="text-center text-sm mt-2">Type the title to confirm:</p>
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          placeholder="Type the title"
          className="w-full p-2 border rounded mt-2"
        />

        {capsule.UnlockDate === null ? (
          <p className="text-red-500 text-sm mt-2">
            An unlock date must be set before burying.
          </p>
        ) : userInput && userInput !== capsule.Title ? (
          <p className="text-red-500 text-sm mt-2">
            Title does not match. Please type it correctly.
          </p>
        ) : null}


        {/* Validation message */}
        

        {/* Close Button */}
        <button
          onClick={() => {
            setUserInput(""); // Reset the input
            setIsValid(false);
            setIsBuryModalOpen(false); // Close the modal
          }}
          className="absolute top-2 right-2 p-2 rounded cursor-pointer"
          style={{
              background: "var(--accent)",
              color: "#fff",
          }}
        >
          X
        </button>

        {/* Confirm Delete Button */}
        <button
          onClick={buryCapsule}
          disabled={!isValid} // Disable button if input does not match the title
          className={`mt-4 w-full p-2 rounded ${!isValid ? "opacity-50 cursor-not-allowed" : ""}`}
          style={{
              background: "var(--accent)",
              color: "#fff",
          }}
        >
          Confirm Bury
        </button>
      </div>
    </div>
  );
}


export default function ViewPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [file, setFile] = useState([]);
  const [preview, setPreview] = useState([]);
  const [releaseTime, setReleaseTime] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCapulseSettingOpen, setIsCapulseSettingOpen] = useState(false);
  const [isBuryModalOpen, setIsBuryModalOpen] = useState(false);
  const [capsule, setCapsule] = useState(null)
  const [error, setError] = useState(null)
  const [storage, setStorage] = useState(0)

  const getVault = async (id) => {
      try {
        const res = await authFetch(`/vault/${id}`);

        if (res.status === 403) {
          setError("forbidden");
          return;
        }

        if (res.status === 404) {
          setError("notfound");
          return;
        }

        const data = await res.json();
        setCapsule(data);
      } catch (error) {
        console.error("Error:", error);
        setError("server");
      }
  };

  useEffect(() => {
    getVault(id);
  }, [id]);

  const handleFileSelect = (selectedFiles) => {
    if (!selectedFiles) {
      // Clear the file and preview states
      setFile([]);
      setPreview([]);
      setUploadStatus("idle");
      return;
    }
    const filesArray = Array.isArray(selectedFiles)
    ? selectedFiles
    : [selectedFiles];

    const newPreviews = filesArray.map((file) => URL.createObjectURL(file));

    const newFilesSize = filesArray.reduce((total, file) => total + file.size, 0);

    setFile((prevFiles) => [...prevFiles, ...filesArray]);
    setPreview((prevPreviews) => [...prevPreviews, ...newPreviews]);
    setStorage((prevStorage) => prevStorage + newFilesSize);
    setUploadStatus("idle");
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
      const res = await authFetch(`/api/upload/trash/${img}`, {
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
      const res = await authFetch(`/images/${id}`);
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

    setUploadStatus("uploading");

    const formData = new FormData();
    file.forEach((f) => {
      console.log(f)
      formData.append("images", f);
    });

    try {
      const res = await authFetch(`/upload/${id}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        // get error message from backend
        const errorText = await res.text();
        throw new Error(errorText); // throw with backend message
      }

      await res.json();
      setPreview([]);
      setFile([]);
      setUploadStatus("idle")
      setIsImageModalOpen(false);
      fetchImages();
    } catch (err) {
      console.error(err);
      setUploadStatus(err?.message || "Upload failed");
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchVaultTime = async () => {
    try {
      const res = await authFetch(`/time/get/${id}`);
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

  const addUsers = async () => {
    try {
      const res = await authFetch(`/time/get/${id}`);
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
  }, [isTimeModalOpen] );

    // --- RENDER LOGIC ---
  if (error === "forbidden") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="mt-2">You don’t have permission to view this capsule.</p>
        <Link href="/" className="mt-4 text-blue-500 underline">Go back home</Link>
      </div>
    );
  }

  if (error === "notfound") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold">Capsule Not Found</h1>
        <p className="mt-2">This vault does not exist.</p>
        <Link href="/" className="mt-4 text-blue-500 underline">Go back home</Link>
      </div>
    );
  }

  if (error === "server") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold">Something went wrong. Please try again later.</h1>
        <Link href="/" className="mt-4 text-blue-500 underline">Go back home</Link>
      </div>
    )
  }

  if (capsule != null){
    if (capsule.Status === "buried") {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-3xl font-bold">This Capsule has been buried.</h1>
          <Link href="/" className="mt-4 text-blue-500 underline">Go back home</Link>
        </div>
      )
    }
  }

  

  return (
    <>
      <Navbar />
      <div
        className="pt-32 px-8 pb-16 max-w-7xl mx-auto space-y-8"
        style={{ color: "var(--text)" }}
      >
          {capsule != null && (
            <>
              <div className="relative px-8 max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold mb-2 text-center">{capsule.Title}</h2>
                <button
                  onClick={() => setIsCapulseSettingOpen(true)}
                  className="absolute top-0 right-4 px-5 py-3 rounded shadow transition-colors duration-200 text-sm"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "var(--secondaccent)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
                  aria-label="Edit capsule"
                >
                  ⚙️
                </button>
              </div>
              <p className="text-lg text-gray-600 mb-8 text-center">{capsule.Description}</p>
            </>
          )}
        <div className="flex items-center justify-between w-full">
          {/* Left group: Upload + Edit Time */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsImageModalOpen(true)}
              className="px-5 py-3 rounded shadow transition-colors duration-200 text-sm"
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
              <span className="text-sm text-gray-700">{releaseTime}</span>
              <button
                onClick={() => setIsTimeModalOpen(true)}
                className="px-5 py-3 rounded shadow transition-colors duration-200 text-sm"
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

          {/* Right: Share button */}
          <div className="flex gap-8">
              <button
                onClick={() => setIsBuryModalOpen(true)}
                className="px-5 py-3 rounded shadow transition-colors duration-200 text-sm"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "var(--secondaccent)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
              >
                Bury Capsule
              </button>
            {/* <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-5 py-3 rounded shadow text-sm transition-colors duration-200"
              style={{
                background: "var(--accent)",
                color: "#fff",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "var(--secondaccent)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
            >
              Share
            </button> */}
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

      {isImageModalOpen && (
        <ImageUploadModal
          setIsImageModalOpen={setIsImageModalOpen}
          preview={preview}
          uploadStatus={uploadStatus}
          setUploadStatus={setUploadStatus}
          handleUpload={handleUpload}        
          handleFileSelect={handleFileSelect}
          storage={storage}
          setFile={setFile}
          setPreview={setPreview}
          file={file}
          setStorage={setStorage}
          />
      )}

      {isTimeModalOpen && (
        <TimeModal
          setIsTimeModalOpen={setIsTimeModalOpen}
          id={capsule.ID}
          setCapsule={setCapsule}
        />
      )}

      {isShareModalOpen && (
        <ShareModal
          setIsShareModalOpen={setIsShareModalOpen}
          capsule={capsule}
        />
      )}

      {isCapulseSettingOpen && (
        <CapsuleSettingModal
          setIsCapulseSettingOpen={setIsCapulseSettingOpen}
          capsule={capsule}
          setCapsule={setCapsule}
        />
      )}
      {isBuryModalOpen && (
        <BuryModal
          setIsBuryModalOpen={setIsBuryModalOpen}
          capsule={capsule}
        />
      )}
      
    </>
  );
}
