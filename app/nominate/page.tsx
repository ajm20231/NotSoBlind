'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NominatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    personAName: '',
    personAPhone: '',
    personBName: '',
    personBPhone: '',
    rationale: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (!data.authenticated) {
        router.push('/');
        return;
      }

      setLoading(false);
    } catch (error) {
      router.push('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/nominations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personAPhone: formData.personAPhone,
          personAName: formData.personAName,
          personBPhone: formData.personBPhone,
          personBName: formData.personBName,
          rationale: formData.rationale,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create nomination');
        setSubmitting(false);
        return;
      }

      setShareUrl(data.nomination.shareUrl);
    } catch (err) {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-candle-amber">Loading...</div>
      </div>
    );
  }

  // Success screen
  if (shareUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <div className="text-6xl mb-4">✨</div>
            <h1 className="text-3xl font-semibold text-candle-amber mb-2">
              Nomination Created!
            </h1>
            <p className="text-moonstone-gray">
              Share this link to get endorsements
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="input-field flex-1"
              />
              <button onClick={handleCopy} className="btn-primary whitespace-nowrap">
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            <div className="text-sm text-moonstone-gray opacity-80 space-y-2">
              <p>
                <strong className="text-candle-amber">Threshold:</strong> Need ≥3
                endorsements to unlock
              </p>
              <p>
                <strong className="text-candle-amber">Expires:</strong> 48 hours from
                now
              </p>
              <p className="text-xs opacity-70">
                Share this with friends who know both people. Once unlocked, they'll be
                notified.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => router.push('/')}
              className="btn-secondary"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nomination form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-candle-amber mb-2">
            Make a Nomination
          </h1>
          <p className="text-moonstone-gray">
            Set two friends up on a blind date
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-8 space-y-6">
          {/* Person A */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-candle-amber">Person #1</h3>
            <div>
              <label className="block text-sm mb-2 text-moonstone-gray">
                First Name
              </label>
              <input
                type="text"
                value={formData.personAName}
                onChange={(e) =>
                  setFormData({ ...formData, personAName: e.target.value })
                }
                placeholder="Alex"
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-moonstone-gray">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.personAPhone}
                onChange={(e) =>
                  setFormData({ ...formData, personAPhone: e.target.value })
                }
                placeholder="(555) 123-4567"
                className="input-field w-full"
                required
              />
            </div>
          </div>

          {/* Person B */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-candle-amber">Person #2</h3>
            <div>
              <label className="block text-sm mb-2 text-moonstone-gray">
                First Name
              </label>
              <input
                type="text"
                value={formData.personBName}
                onChange={(e) =>
                  setFormData({ ...formData, personBName: e.target.value })
                }
                placeholder="Sam"
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-moonstone-gray">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.personBPhone}
                onChange={(e) =>
                  setFormData({ ...formData, personBPhone: e.target.value })
                }
                placeholder="(555) 987-6543"
                className="input-field w-full"
                required
              />
            </div>
          </div>

          {/* Rationale */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-candle-amber">Why?</h3>
            <div>
              <label className="block text-sm mb-2 text-moonstone-gray">
                One sentence explaining why they'd hit it off
              </label>
              <textarea
                value={formData.rationale}
                onChange={(e) =>
                  setFormData({ ...formData, rationale: e.target.value })
                }
                placeholder="I think Alex and Sam would hit it off because..."
                className="input-field w-full min-h-[100px] resize-y"
                required
                minLength={10}
              />
              <p className="text-xs mt-2 text-moonstone-gray opacity-70">
                Min. 10 characters • This will be shown to endorsers
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-smoked-rosewood bg-opacity-20 border border-smoked-rosewood">
              <p className="text-sm text-moonstone-gray">{error}</p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Nomination'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
