'use client';

import { Suspense, useEffect, useState, useRef } from "react";
import { authFetch } from "@/utils/authFetch";
import Navbar from "@/components/Navbar";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ClipLoader } from "react-spinners";


function CapsuleModal({ isOpen, onClose, onSubmit, capsuleError, setCapsuleError, creating }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [includeInCapsule, setIncludeInCapsule] = useState(false);

  const fileInputRef = useRef(null);

  const modalRef = useRef(null);
  useOnClickOutside(modalRef, onClose, () => setCapsuleError(null));

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

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    if (name == "") {
      setCapsuleError("Please input a name")
    } else {
      onSubmit({ name, description, coverImage, includeInCapsule, setCapsuleError });
      setName("");
      setDescription("");
      setCoverImage(null);
      setPreviewUrl("")
      setIncludeInCapsule(false)
      setCapsuleError(null)
    }
  };

  if (!isOpen) return null;

  return (

    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        background: "rgba(0, 0, 0, 0.7)",
      }}
    >
      <ClipLoader
        loading={creating}
        size={150}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
      <div className="backdrop-blur-md bg-white/70 p-6 rounded shadow-lg w-full max-w-sm" ref={modalRef}>

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
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: "none" }}
          />

          {/* Custom styled button to open file chooser */}
          <button
            type="button"
            onClick={handleButtonClick}
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
              marginBottom: "16px",
            }}
          >
            Upload Cover Image
          </button>

          {previewUrl && (
            <div style={{ marginTop: "1rem" }}>
              <Image
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
        <div className="">
          {capsuleError && (
            <h2 className="text-red-500 text-sm mt-2">{capsuleError}</h2>
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

function DeleteModal({ onClose, currentCapsule, isOpen, setCapsules }) {
  const [userInput, setUserInput] = useState(""); // State to store the user's input
  const [isValid, setIsValid] = useState(false); // To check if the input matches the title

  // Function to handle input change
  const handleInputChange = (e) => {
    setUserInput(e.target.value);
    // Validate if the user input matches the capsule title
    if (e.target.value === currentCapsule.Title) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };

  const modalRef = useRef(null);
  useOnClickOutside(modalRef, onClose);

  const handleDelete = async () => {
    // Call the delete function, passing capsule ID or any necessary data
    setUserInput("")
    setIsValid(false);
    console.log(`Deleting capsule with ID: ${currentCapsule.ID}`);
    try {
      const response = await authFetch(`/vault/delete/${currentCapsule.ID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      });
      const res = await authFetch("/api/getvaults", {
      });
      const data = await res.json();
      console.log("Fetched capsules:", data);
      setCapsules(data);
      if (!response.ok) {
        throw new Error("Failed to delete vault");
      }

      const result = await response.json();
      console.log(result.message);  // You can display a success message or handle further logic here
    } catch (error) {
      console.error("Error:", error);
    }
    onClose(); // Close the modal after deletion
  };

  if (!isOpen) return null; // Don't render the modal if it's not open

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        background: "rgba(0, 0, 0, 0.7)", // black translucent background
      }}
    >
      <div className="backdrop-blur-md bg-white/70 p-6 pt-10 rounded shadow-lg w-full max-w-sm relative" ref={modalRef}>
        {/* Modal Content */}
        <h2 className="text-center text-lg font-semibold mt-2">
          Are you sure you want to delete &quot;{currentCapsule.Title}&quot;?
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

        {/* Validation message */}
        {userInput && userInput !== currentCapsule.Title && (
          <p className="text-red-500 text-sm mt-2">Title does not match. Please type it correctly.</p>
        )}

        {/* Close Button */}
        <button
          onClick={() => {
            setUserInput(""); // Reset the input
            setIsValid(false);
            onClose(); // Close the modal
          }}
          className="absolute top-2 right-2 bg-red-500 text-white rounded p-2 cursor-pointer"
        >
          X
        </button>

        {/* Confirm Delete Button */}
        <button
          onClick={handleDelete}
          disabled={!isValid} // Disable button if input does not match the title
          className={`mt-4 w-full p-2 rounded bg-red-500 text-white ${!isValid ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Confirm Deletion
        </button>
      </div>
    </div>
  );
}

function CapsuleCard({ capsule, setCurrentCapsule, setIsDeleteModalOpen }) {
  const router = useRouter();
  const [src, setSrc] = useState(null);

  const isBuried = capsule.Status === "buried";

  useEffect(() => {
    if (!capsule.CoverImageID) return;

    const fetchImage = async () => {
      const token = localStorage.getItem("token");
      const res = await authFetch(`/image/cover/${capsule.CoverImageID}`, {});
      const blob = await res.blob();
      setSrc(URL.createObjectURL(blob));
    };

    fetchImage();
  }, [capsule.CoverImageID]);

  return (
    <div
      key={capsule.ID}
      onClick={() => {
        if (!isBuried) {
          router.push(`/view/${capsule.ID}`);
        }
      }}
      style={{
        background: "var(--softbackground)",
        border: "1px solid var(--border)",
        cursor: isBuried ? "" : "pointer",
        opacity: isBuried ? 0.5 : 1,
      }}
      className="p-4 rounded shadow-sm flex flex-col justify-center items-center transition-transform duration-200 transform hover:scale-105 hover:shadow-lg group relative bg-white/70"
    >
      {/* Delete button */}
      {!isBuried && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDeleteModalOpen(true);
            setCurrentCapsule(capsule);
          }}
          className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
        >
          ✕
        </button>
      )}

      {/* Image */}
      <div className="relative flex justify-center items-center w-full">
        {capsule.CoverImageID ? (
          <Image src={src} alt="Capsule Cover" className="w-32 h-32 object-cover" />
        ) : (
          <Image
            src="/Vault-Closed.png"
            alt="Capsule Closed"
            className="w-32 h-32 object-cover"
          />
        )}
      </div>

      {/* Text */}
      <p className="text-center text-lg font-semibold mt-2">{capsule.Title}</p>
      <p className="text-center text-sm" style={{ color: "var(--foreground)" }}>
        {capsule.Description}
      </p>
      <p className="text-center text-sm" style={{ color: "var(--foreground)" }}>
        {capsule.TotalStorageUsed}
      </p>

      {isBuried ? (
        <p className="text-center text-sm text-gray-600">
          Unlocks on {new Date(capsule.UnlockDate).toLocaleString()}
        </p>
      ) : (
        <p className="text-center text-sm" style={{ color: "var(--foreground)" }}>
          {capsule.Status}
        </p>
      )}
    </div>
  );
}

function CapsuleList({
  setCurrentCapsule,
  capsules,
  sortFunc,
  setIsDeleteModalOpen,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {capsules.filter(sortFunc).map((capsule) => (
        <CapsuleCard
          key={capsule.ID}
          capsule={capsule}
          setCurrentCapsule={setCurrentCapsule}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
        />
      ))}
    </div>
  );
}

function Sidebar({ selected, setSelected, items }) {
  return (
    <aside
      className="fixed top-0 left-0 h-screen w-42 px-2 space-y-4 pt-16"
      style={{
        background: "var(--softbackground)",
        color: "var(--text)",
        borderRight: "2px solid rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 className="text-xl font-semibold pt-4">View</h2>
      <ul className="space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => setSelected(item)}
              className={`w-full text-left py-2 rounded transition
                ${selected.id === item.id
                  ? "bg-white bg-opacity-20 border border-white border-opacity-30 shadow-sm"
                  : "hover:bg-white hover:bg-opacity-20 hover:border hover:border-white hover:border-opacity-30 hover:shadow-sm"
                }`}
              style={{ outline: "none" }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}



export default function CapsulesPage() {

  const searchParams = useSearchParams();
  const create = searchParams.get("create");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (create === "true") {
      setIsModalOpen(true); // or trigger the button logic
    }
  }, [create]);

  const [capsules, setCapsules] = useState([]);
  const [currentCapsule, setCurrentCapsule] = useState();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [capsuleError, setCapsuleError] = useState("");

  const items = [
    {
      id: "all",
      label: "📁 All Capsules",
      filterFn: () => true,
    },
    {
      id: "opened",
      label: "📤 Opened",
      filterFn: (capsule) => capsule.Status === "open",
    },
    {
      id: "buried",
      label: "📥 Buried",
      filterFn: (capsule) => capsule.Status === "buried",
    },
    // {
    //   id: "shared",
    //   label: "🤝 Shared With Me",
    //   filterFn: (capsule) => capsule.IsShared === true, // adjust this depending on your data model
    // },
    // {
    //   id: "trash",
    //   label: "🗑️ Trash",
    //   filterFn: (capsule) => capsule.Status === "Trash",
    // },
  ];

  const [selected, setSelected] = useState(items[1]);

  const fetchCapsules = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await authFetch("/api/getvaults", {
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

  const handleCreateCapsule = async ({ name, description, coverImage, includeInCapsule, setCapsuleError }) => {
    setCreating(true);

    try {
      const token = localStorage.getItem("token");
      const vaultResponse = await authFetch("/api/addvaults", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Name: name, Description: description }),
      });

      if (!vaultResponse.ok) {
        const errorText = await vaultResponse.text();
        setCapsuleError(errorText || "Failed to create vault");
        return; // stop here and keep modal open
      }

      const vaultData = await vaultResponse.json();
      const vaultId = vaultData.vaultId;

      const formData = new FormData();
      formData.append("images", coverImage);


      await authFetch(`/cover/upload/${vaultId}`, {
        method: "POST",
        body: formData,
      });

      if (includeInCapsule) {
        const uploadResponse = await authFetch(`/upload/${vaultId}`, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          setCapsuleError(errorText || "Failed to upload image to capsule");
          return; // stop here and keep modal open
        }
      }

      // ✅ Success path
      fetchCapsules();
      setCapsuleError(null)
      setIsModalOpen(false); // only close modal on success

    } catch (err) {
      console.error("Failed to create capsule:", err);
      setCapsuleError("Unexpected error occurred. Please try again.");
    } finally {
      setCreating(false);
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
      const res = await authFetch(`/upload/${id}`, {
        method: "POST",
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
  console.log(selected)
  return (
    <>
      <Navbar />

      {/* Layout container under navbar */}
      <div className="flex">
        <Sidebar
          selected={selected}
          setSelected={setSelected}
          items={items}
        />


        {/* Main content pushed right by sidebar width */}
        <main
          className="pl-50 pt-32 px-8 pb-16 flex-1 max-w-7xl mx-auto space-y-8"
          style={{ color: "var(--text)" }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold">📂 Your Capsules</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={creating}
              className="px-5 py-3 rounded shadow transition-colors duration-200"
              style={{
                background: "var(--accent)",
                color: "#fff",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "var(--secondaccent)")}
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "var(--accent)")}
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
            <CapsuleList
              setCurrentCapsule={setCurrentCapsule}
              capsules={capsules}
              sortFunc={selected.filterFn}
              setIsDeleteModalOpen={setIsDeleteModalOpen}
            />
          )}
        </main>
      </div>

      <CapsuleModal
        capsuleError={capsuleError}
        setCapsuleError={setCapsuleError}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCapsule}
        creating={creating}
      />

      <DeleteModal
        currentCapsule={currentCapsule}
        setCapsules={setCapsules}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
}
