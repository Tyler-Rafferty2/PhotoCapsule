'use client';

import Navbar from '@/components/Navbar';
import { useState } from 'react';
import Link from 'next/link';

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

function StatusMessage({ status }) {
  if (status === 'success') {
    return <p className="text-green-600 text-sm text-center">✅ Upload successful</p>;
  } else if (status === 'error') {
    return <p className="text-red-600 text-sm text-center">❌ Upload failed</p>;
  }
  return null;
}

function LinkToGallery() {
  return (
    <div className="text-center">
      <Link href="/view" className="text-blue-500 hover:underline">
        View uploaded images
      </Link>
    </div>
  );
}

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error

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
      const res = await fetch('http://localhost:8080/upload', {
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

  return (
    <>
    <Navbar />
    <div className="p-8 max-w-md mx-auto space-y-4">
      <FileInput onSelect={handleFileSelect} />
      <ImagePreview src={preview} />
      <UploadButton onClick={handleUpload} disabled={status === 'uploading'} status={status} />
      <StatusMessage status={status} />
      <LinkToGallery />
    </div>
  </>

  );
}
