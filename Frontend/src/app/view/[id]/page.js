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
    <div>
      <label
        htmlFor="fileUpload"
        className="cursor-pointer inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        Upload your image
      </label>
      <input
        id="fileUpload"
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            onSelect(Array.from(files)); // pass as an array of File objects
          }
        }}
        className="hidden" // hide default input
      />
    </div>
  );
}

function ImagePreview({ srcList }) {
  if (!srcList || srcList.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4">
      {srcList.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt={`Preview ${idx}`}
          className="w-64 h-auto rounded border"
        />
      ))}
    </div>
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
  const [file, setFile] = useState([]);
  const [preview, setPreview] = useState([]);

  const handleFileSelect = (selectedFiles) => {
    const filesArray = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles];
    const newPreviews = filesArray.map(file => URL.createObjectURL(file));

    setFile((prevFiles) => [...prevFiles, ...filesArray]); // if you're tracking files too
    setPreview((prevPreviews) => [...prevPreviews, ...newPreviews]);
    setStatus('idle');
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
    if (file.length === 0) {
      return;
    }

    setStatus('uploading');

    const formData = new FormData();
    file.forEach((f) => {
      formData.append('images', f);
    });
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
            <ImagePreview srcList={preview} />
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
                <Dnd images={images} setImages={setImages} handleTrash={handleTrash} />
              )}
              <Link href={`/view/trash/${id}`} className="text-lg font-semibold hover:underline">
                  View Trash
                </Link>
              <LinkToHome />
            </div>
          </div>

      </>
  );
}
