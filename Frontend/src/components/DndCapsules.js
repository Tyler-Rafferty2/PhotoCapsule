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

export default function DndCapsules({ capsules, setCapsules }) {
  const [activeId, setActiveId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
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
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableCapsule({ capsule, isDragging }) {
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

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="p-4 rounded shadow-sm flex flex-col justify-center items-center cursor-pointer transition-transform duration-200 transform hover:scale-105 hover:shadow-lg"
      onClick={handleClick}
    >
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