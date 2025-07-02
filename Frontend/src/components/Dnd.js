import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
  defaultAnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function ImageList({ images, setImages, handleTrash}) {
  const [activeId, setActiveId] = useState(null);
  const activeImage = images.find((img) => img.id === activeId);

  const sensors = useSensors(useSensor(PointerSensor));

  const updateOrder = async (orderedImages) => {
    const payload = orderedImages.map((img, index) => ({
      id: img.id,
      order_index: index,
    }));

    await fetch("http://localhost:8080/api/update-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);
      setImages(newImages);
      updateOrder(newImages);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "1rem",
          }}
        >
          {images.map((img, idx) => (
            <SortableImage
              key={img.id}
              id={img.id}
              img={img}
              idx={idx}
              handleTrash={handleTrash}
              isDragging={activeId === img.id}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeImage ? (
          <OverlayImage img={activeImage} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableImage({ id, img, idx, handleTrash, isDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    animateLayoutChanges: defaultAnimateLayoutChanges,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
    border: "1px solid #ccc",
    padding: "1rem",
    opacity: isDragging ? 0 : 1, // Hide original when dragging
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative aspect-square overflow-hidden transition-transform duration-200 hover:scale-105 group"
    >
      <button
        onClick={() => handleTrash(img.id)}
        className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        ✕
      </button>
      <img
        {...listeners}
        src={`http://localhost:8080/uploads/${img.filename}`}
        style={{ width: "100%", height: "auto" }}
        alt={`Uploaded ${idx}`}
      />
    </div>
  );
}

function OverlayImage({ img, idx }) {
  return (
    <div
      className="relative aspect-square overflow-hidden border transition-transform duration-200 group"
      style={{
        border: "1px solid #ccc",
        padding: "1rem",
        background: "black",
      }}
    >
      <img
        src={`http://localhost:8080/uploads/${img.filename}`}
        style={{ width: "100%", height: "auto" }}
        alt={`Uploaded ${idx}`}
      />
    </div>
  );
}

