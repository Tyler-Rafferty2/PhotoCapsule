import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { authFetch } from "@/utils/authFetch";



export default function DndCapsules({ capsules, setCapsules }) {
  const [activeId, setActiveId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setIsDragging(true);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over || active.id === over.id) {
      // Small delay to prevent click after drag
      setTimeout(() => setIsDragging(false), 100);
      return;
    }

    const oldIndex = capsules.findIndex((c) => c.ID === active.id);
    const newIndex = capsules.findIndex((c) => c.ID === over.id);

    const newCapsules = arrayMove(capsules, oldIndex, newIndex);
    setCapsules(newCapsules);

    // Small delay to prevent click after drag
    setTimeout(() => setIsDragging(false), 100);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={capsules.map((c) => c.ID)} strategy={rectSortingStrategy}>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {capsules.map((capsule) => (
            <SortableCapsule
              key={capsule.ID}
              capsule={capsule}
              isDragging={isDragging}
              isModalOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
              setSelectedCapsule={setSelectedCapsule}
            />
          ))}
        </ul>
      </SortableContext>
      <DeleteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        capsule={selectedCapsule}
        setCapsules={setCapsules}
      />
    </DndContext>
  );
}

function SortableCapsule({ capsule, isDragging, isModalOpen, setIsModalOpen, setSelectedCapsule }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: itemIsDragging } = useSortable({
    id: capsule.ID,
  });
  const router = useRouter();

  const style = {
    background: "var(--softbackground)",
    border: "1px solid var(--border)",
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
    opacity: itemIsDragging ? 0.5 : 1,
    cursor: 'pointer',
  };

  const handleClick = (e) => {
    // Prevent navigation if we're in the middle of dragging
    if (isDragging) {
      e.preventDefault();
      return;
    }
    
    console.log("Navigating to capsule");
    router.push(`/view/${capsule.ID}`);
  };

  const handleTrash = () => {
    // Implement the trash functionality, like removing the capsule from the list or backend
    setSelectedCapsule(capsule)
    setIsModalOpen(true)
    console.log(`Deleting capsule with ID: ${capsule.ID}`);
  };

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="p-4 rounded shadow-sm flex flex-col justify-center items-center cursor-pointer transition-transform duration-200 transform hover:scale-105 hover:shadow-lg group relative" // Added cursor-pointer to li
      onClick={handleClick}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleTrash(capsule);
        }}
        className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer" // Added cursor-pointer to button as well
      >
        ✕
      </button>

      <div className="relative flex justify-center items-center w-full">
        {capsule.CoverImageURL ? (
          <img
            src={`http://localhost:8080/uploads/${capsule.CoverImageURL}`}
            alt="Capsule Cover"
            className="w-32 h-32 object-cover"
          />
        ) : (
          <img
            src="/Vault-Closed.png"
            alt="Capsule Closed"
            className="w-32 h-32 object-cover"
          />
        )}
      </div>
      <p className="text-center text-lg font-semibold mt-2">{capsule.Title}</p>
      <p className="text-center text-sm" style={{ color: "var(--foreground)" }}>
        {capsule.Description}
      </p>
    </li>
  );
}

function DeleteModal({ onClose, capsule, isOpen, setCapsules }) {
  const [userInput, setUserInput] = useState(""); // State to store the user's input
  const [isValid, setIsValid] = useState(false); // To check if the input matches the title

  // Function to handle input change
  const handleInputChange = (e) => {
    setUserInput(e.target.value);
    // Validate if the user input matches the capsule title
    if (e.target.value === capsule.Title) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };

  const  handleDelete = async () => {
    // Call the delete function, passing capsule ID or any necessary data
    setUserInput("")
    setIsValid(false);
    console.log(`Deleting capsule with ID: ${capsule.ID}`);
    try {
      const response = await authFetch(`http://localhost:8080/vault/delete/${capsule.ID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      });
      const res = await authFetch("http://localhost:8080/api/getvaults", {
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
      <div className="backdrop-blur-md bg-white/70 p-6 rounded shadow-lg w-full max-w-sm relative">
        {/* Modal Content */}
        <h2 className="text-center text-lg font-semibold mt-2">
          Are you sure you want to delete "{capsule.Title}"?
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
        {userInput && userInput !== capsule.Title && (
          <p className="text-red-500 text-sm mt-2">Title does not match. Please type it correctly.</p>
        )}

        {/* Close Button */}
        <button
          onClick={() => {
            setUserInput(""); // Reset the input
            setIsValid(false);
            onClose(); // Close the modal
          }}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 cursor-pointer"
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