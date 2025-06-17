'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    setStatus('uploading');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('http://localhost:8080/upload', { // <-- change if needed
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setStatus('success');
      alert(`Upload successful: ${data.filename || data.message}`);
    } catch (err) {
      console.error(err);
      setStatus('error');
      alert('Upload failed. Check console for details.');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500"
      />

      {preview && (
        <img
          src={preview}
          alt="Image preview"
          className="w-full h-auto rounded border"
        />
      )}

      <button
        onClick={handleUpload}
        disabled={status === 'uploading'}
        className={`w-full px-4 py-2 rounded text-white ${
          status === 'uploading'
            ? 'bg-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {status === 'uploading' ? 'Uploading...' : 'Upload'}
      </button>

      {status === 'success' && (
        <p className="text-green-600 text-sm text-center">✅ Upload successful</p>
      )}
      {status === 'error' && (
        <p className="text-red-600 text-sm text-center">❌ Upload failed</p>
      )}
      <Link href="/view">View</Link>
    </div>
    
  );
}
