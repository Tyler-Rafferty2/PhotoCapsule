import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
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
import Image from "next/image";

export default function ImageList({ images, setImages, handleTrash }) {
  const [activeId, setActiveId] = useState(null);
  const activeImage = images.find((img) => img.id === activeId);

  const sensors = useSensors(useSensor(PointerSensor));

  // Overlay uses the same loaded image
  function OverlayImage({ img }) {
    if (!img.src) return null;

    return (
      <div
        className="p-4 rounded shadow-sm flex flex-col justify-center items-center"
        style={{
          background: "var(--softbackground)",
          border: "1px solid var(--border)",
          width: "250px",
          height: "250px",
        }}
      >
        <img
          src={img.src}
          alt="Overlay"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const updateOrder = async (orderedImages) => {
    const payload = orderedImages.map((img, index) => ({
      id: img.id,
      order_index: index,
    }));

    await authFetch("/api/update-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);

    const newImages = arrayMove(images, oldIndex, newIndex);
    setImages(newImages);
    updateOrder(newImages);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={images.map((img) => img.id)}
        strategy={rectSortingStrategy}
      >
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}
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
        {activeImage && <OverlayImage img={activeImage} />}
      </DragOverlay>
    </DndContext>
  );
}

function SortableImage({ id, img, idx, handleTrash, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id, animateLayoutChanges: defaultAnimateLayoutChanges });

  const [src, setSrc] = useState(img.src || null); // use existing src if present

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
    opacity: isDragging ? 0 : 1,
    background: "var(--softbackground)",
    border: "1px solid var(--border)",
  };

  // Fetch image once and store in img object
  useEffect(() => {
    if (img.src) return; // already loaded
    const fetchImage = async () => {
      const res = await authFetch(img.url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setSrc(objectUrl);
      img.src = objectUrl; // save for overlay
    };
    fetchImage();
  }, [img]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="group p-4 rounded shadow-sm flex flex-col justify-center items-center cursor-pointer transition-transform duration-200 transform hover:scale-105 hover:shadow-lg"
    >
      <div className="relative w-full aspect-square overflow-hidden">
        <button
          onClick={() => handleTrash(id)}
          className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          ✕
        </button>
        {src && (
          <Image
            {...listeners}
            src={src}
            className="w-full h-full object-cover"
            alt={`Uploaded ${idx}`}
          />
        )}
      </div>
    </div>
  );
}
