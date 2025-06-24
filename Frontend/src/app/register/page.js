'use client';
import { useState } from 'react';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const handleSignUp = async (e) => {
    e.preventDefault();
    setStatus('loading');

    const res = await fetch('http://localhost:8080/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
       },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      setStatus('success');
      alert('Account created!');
      setEmail('');
      setPassword('');
    } else {
      setStatus('error');
      const error = await res.text();
      alert(`Signup failed: ${error}`);
    }
  };

  return (
    <div className="flex justify-center">
      <form onSubmit={handleSignUp} className="flex flex-col items-center space-y-4 border-t pt-6 mt-6">
        <h2 className="text-lg font-semibold text-center">Sign Up</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-[50vw] max-w-md border px-3 py-2 rounded"
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-[50vw] max-w-md border px-3 py-2 rounded"
          required
        />
        
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-[50vw] max-w-md bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        >
          {status === 'loading' ? 'Creating...' : 'Sign Up'}
        </button>

        {status === 'success' && <p className="text-green-600 text-sm text-center">✅ Account created</p>}
        {status === 'error' && <p className="text-red-600 text-sm text-center">❌ Signup failed</p>}
      </form>
    </div>

  );
}