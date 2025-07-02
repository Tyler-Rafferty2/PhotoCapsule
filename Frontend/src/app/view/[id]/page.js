'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Dnd from '@/components/Dnd';

function LinkToHome() {
  return (
    <div className="text-center">
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
      className={`w-full px-4 py-2 rounded text-white ${
        disabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {status === 'uploading' ? 'Uploading...' : 'Upload'}
    </button>
  );
}

function FileInput({ onSelect }) {
  return (
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        const selected = e.target.files?.[0];
        if (selected) onSelect(selected);
      }}
      className="block w-full text-sm text-gray-500"
    />
  );
}

function ImagePreview({ src }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt="Image preview"
      className="w-full h-auto rounded border"
    />
  );
}

function StatusMessage({ status }) {
  if (status === 'success') {
    return <p className="text-green-600 text-sm text-center">✅ Upload successful</p>;
  } else if (status === 'error') {
    return <p className="text-red-600 text-sm text-center">❌ Upload failed</p>;
  }
  return null;
}

const Trashcan = async () => {
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

export default function ViewPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const [status, setStatus] = useState('idle');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (selectedFile) => {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStatus('idle');
  };
  
  const fetchImages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8080/images/${id}`, {
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

  const handleUpload = async () => {
    if (!file) {
      //alert("Please select a file first.");
      return;
    }

    setStatus('uploading');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`http://localhost:8080/upload/${id}`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`,
       },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setPreview(null);
      setStatus('success');
      //alert(`Upload successful: ${data.filename || data.message}`);
    } catch (err) {
      console.error(err);
      setStatus('error');
      //alert('Upload failed. Check console for details.');
    }
    fetchImages();
  };

  const handleTrash = async (img) => {
    try {
      const res = await fetch(`http://localhost:8080/api/upload/trash/${img}`, {
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
            <FileInput onSelect={handleFileSelect} />
            <ImagePreview src={preview} />
            <StatusMessage status={status} />
            <UploadButton onClick={handleUpload} disabled={status === 'uploading'} status={status} />

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
                        onClick={() => handleTrash(img.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        ✕
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
              <Link href={`/view/trash/${id}`} className="text-lg font-semibold hover:underline">
                  View Trash
                </Link>
              <LinkToHome />
              <Dnd images={images} setImages={setImages} />
            </div>
          </div>

      </>
  );
}
