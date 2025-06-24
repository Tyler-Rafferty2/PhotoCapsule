'use client';

import { useEffect, useState } from 'react';

export default function VaultsPage() {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Fetch vaults on load
  useEffect(() => {
    const fetchVaults = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8080/api/vaults', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setVaults(data);
      } catch (err) {
        console.error('Failed to load vaults:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVaults();
  }, []);

  // Create vault handler
  const handleCreateVault = async () => {
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/vaults', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: `Vault ${vaults.length + 1}` }),
      });
      const newVault = await res.json();
      setVaults([...vaults, newVault]);
    } catch (err) {
      console.error('Failed to create vault:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">📂 Your Vaults</h1>

      <button
        onClick={handleCreateVault}
        disabled={creating}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {creating ? 'Creating...' : '➕ Create Vault'}
      </button>

      {loading ? (
        <p className="text-gray-500">Loading vaults...</p>
      ) : vaults.length === 0 ? (
        <p className="text-gray-500">No vaults yet. Click above to create one.</p>
      ) : (
        <ul className="space-y-2">
          {vaults.map((vault) => (
            <li key={vault.id} className="border p-4 rounded shadow-sm">
              <h2 className="text-lg font-semibold">{vault.name}</h2>
              <p className="text-sm text-gray-500">ID: {vault.id}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
