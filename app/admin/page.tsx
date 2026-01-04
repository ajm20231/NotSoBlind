'use client';

import { useEffect, useState } from 'react';

interface Nomination {
  id: string;
  person_a_name: string;
  person_b_name: string;
  rationale: string;
  status: string;
  created_at: string;
  share_token: string;
  positive_count: number;
  negative_count: number;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nominations, setNominations] = useState<Nomination[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/nominations', {
        headers: {
          'X-Admin-Password': password,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setNominations(data.nominations);
        setAuthenticated(true);
      } else {
        alert('Invalid password');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="glass-panel rounded-2xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-semibold text-candle-amber mb-6">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="input-field w-full mb-4"
            autoFocus
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-candle-amber">Admin Dashboard</h1>
          <button
            onClick={() => {
              setAuthenticated(false);
              setPassword('');
            }}
            className="btn-secondary"
          >
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel rounded-xl p-6">
            <div className="text-3xl font-semibold text-candle-amber">
              {nominations.length}
            </div>
            <div className="text-sm text-moonstone-gray opacity-70">Total Nominations</div>
          </div>
          <div className="glass-panel rounded-xl p-6">
            <div className="text-3xl font-semibold text-candle-amber">
              {nominations.filter((n) => n.status === 'pending').length}
            </div>
            <div className="text-sm text-moonstone-gray opacity-70">Pending</div>
          </div>
          <div className="glass-panel rounded-xl p-6">
            <div className="text-3xl font-semibold text-candle-amber">
              {nominations.filter((n) => n.status === 'unlocked').length}
            </div>
            <div className="text-sm text-moonstone-gray opacity-70">Unlocked</div>
          </div>
          <div className="glass-panel rounded-xl p-6">
            <div className="text-3xl font-semibold text-candle-amber">
              {nominations.filter((n) => n.status === 'completed').length}
            </div>
            <div className="text-sm text-moonstone-gray opacity-70">Completed</div>
          </div>
        </div>

        {/* Nominations table */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-charcoal-plum bg-opacity-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-candle-amber">
                    People
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-candle-amber">
                    Rationale
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-candle-amber">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-candle-amber">
                    Endorsements
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-candle-amber">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-candle-amber">
                    Share Link
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-moonstone-gray divide-opacity-10">
                {nominations.map((nom) => (
                  <tr key={nom.id} className="hover:bg-charcoal-plum hover:bg-opacity-30">
                    <td className="px-4 py-3 text-sm text-moonstone-gray">
                      {nom.person_a_name} × {nom.person_b_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-moonstone-gray max-w-xs truncate">
                      {nom.rationale}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          nom.status === 'unlocked'
                            ? 'bg-candle-amber text-charcoal-plum'
                            : nom.status === 'pending'
                            ? 'bg-smoked-rosewood text-moonstone-gray'
                            : 'bg-forest-shadow text-moonstone-gray'
                        }`}
                      >
                        {nom.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-moonstone-gray">
                      👍 {nom.positive_count} / 👎 {nom.negative_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-moonstone-gray">
                      {new Date(nom.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href={`/endorse/${nom.share_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-candle-amber hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
