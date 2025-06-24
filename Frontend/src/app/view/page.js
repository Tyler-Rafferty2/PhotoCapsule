'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function LinkToHome() {
  return (
    <div className="text-center">
      <Link href="/" className="text-blue-500 hover:underline">
        Go home
      </Link>
    </div>
  );
}

export default function ViewPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8080/images', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setImages(data);
      } catch (err) {
        console.error('Failed to fetch images:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  // ✅ This logs the updated state only after setImages has run
  useEffect(() => {
    console.log("✅ Updated images:", images);
  }, [images]);
  images.forEach(img => console.log(img));
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        📸 Uploaded Images
      </h1>
      {loading ? (
      <p>Loading images...</p>
      ) : (
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
              src={`http://localhost:8080/uploads/${img}`}
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        ))}
      </div>
      )}
      <LinkToHome />
    </div>
    
  );
}
