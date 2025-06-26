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
      setStatus('success');
      //alert(`Upload successful: ${data.filename || data.message}`);
    } catch (err) {
      console.error(err);
      setStatus('error');
      //alert('Upload failed. Check console for details.');
    }
  };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8080/images/${id}`, {
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
    <>
        <Navbar />
        <div className="p-8 max-w-md mx-auto space-y-4">
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
        </div>
      </>

    
  );
}
