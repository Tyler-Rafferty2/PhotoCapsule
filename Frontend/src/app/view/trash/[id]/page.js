'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

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
  const { id } = useParams();

  const fetchImages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8080/images/trash/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const data = await res.json();
        console.log("Fetched data:", data);
        setImages(data);
      } catch (err) {
        console.error('Failed to fetch images:', err);
      } finally {
        setLoading(false);
      }
  };


  const PermDel = async (img) => {
    try {
      const res = await fetch(`http://localhost:8080/images/trash/delete/${img}`, {
        method: 'DELETE',
        headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`,
       },
      });

      if (!res.ok) throw new Error('Trash failed');
      fetchImages();
    } catch (err) {
      console.error(err);
    }
  }

  const Recover = async (img) => {
    try {
      const res = await fetch(`http://localhost:8080/images/trash/recover/${img}`, {
        method: 'PATCH',
        headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`,
       },
      });

      if (!res.ok) throw new Error('Trash failed');
      fetchImages();
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    console.log("✅ Updated images:", images);
  }, [images]);

  return (
    <>
        <Navbar />
          <div className="p-8 w-full space-y-4">

            <div style={{ padding: '2rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                📸 Uploaded Images
              </h1>

              {loading ? (
                <p>Loading images...</p>
              ) : images.length === 0 ? (
                <p>No images uploaded yet.</p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden border transition-transform duration-200 hover:scale-105 group" style={{ border: '1px solid #ccc', padding: '1rem' }}>
                      <button
                        onClick={() => PermDel(img.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        Delete forever
                      </button>
                      <button
                        onClick={() => Recover(img.id)}
                        className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        Recover
                      </button>
                      <img
                        src={`http://localhost:8080/uploads/${img.filename}`}
                        style={{ width: '100%', height: 'auto' }}
                        alt={`Uploaded ${idx}`}
                      />
                    </div>
                  ))}
                </div>
              )}
              <Link href={`/view/${id}`} className="text-lg font-semibold hover:underline">
                  View Vault
                </Link>
              <LinkToHome />
            </div>
          </div>

      </>
  );
}
