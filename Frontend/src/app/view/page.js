'use client';

import { useEffect, useState } from 'react';

export default function ViewPage() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch('http://localhost:8080/images');
        const data = await res.json();
        setImages(data);
      } catch (err) {
        console.error('Failed to fetch images:', err);
      }
    };

    fetchImages();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        📸 Uploaded Images
      </h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {images.map((img, idx) => (
          <div key={idx} style={{ border: '1px solid #ccc', padding: '1rem' }}>
            <img
              src={`http://localhost:8080/${img.path}`}
              alt={img.filename}
              style={{ width: '100%', height: 'auto' }}
            />
            <p style={{ textAlign: 'center', marginTop: '0.5rem' }}>{img.filename}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
