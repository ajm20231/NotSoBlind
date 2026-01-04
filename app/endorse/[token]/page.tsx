'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AuthModal from '@/components/AuthModal';

export default function EndorsePage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [nomination, setNomination] = useState<any>(null);
  const [endorsementCounts, setEndorsementCounts] = useState({ positive: 0, negative: 0 });
  const [error, setError] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasEndorsed, setHasEndorsed] = useState(false);
  const [endorsing, setEndorsing] = useState(false);

  useEffect(() => {
    loadNomination();
    checkAuth();
  }, [token]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const loadNomination = async () => {
    try {
      const res = await fetch(`/api/nominations/${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Nomination not found');
        setLoading(false);
        return;
      }

      setNomination(data.nomination);
      setEndorsementCounts(data.counts);
      setHasEndorsed(data.hasEndorsed);
      setLoading(false);
    } catch (err) {
      setError('Failed to load nomination');
      setLoading(false);
    }
  };

  const handleEndorse = async (isPositive: boolean) => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }

    setEndorsing(true);

    try {
      const res = await fetch('/api/endorsements/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominationId: nomination.id,
          isPositive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to endorse');
        setEndorsing(false);
        return;
      }

      // Reload to show updated counts
      await loadNomination();
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setEndorsing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-candle-amber">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel rounded-2xl p-8 text-center max-w-md">
          <div className="text-4xl mb-4">😕</div>
          <h1 className="text-2xl font-semibold text-candle-amber mb-2">
            Nomination Not Found
          </h1>
          <p className="text-moonstone-gray">{error}</p>
        </div>
      </div>
    );
  }

  if (!nomination) {
    return null;
  }

  // Already endorsed
  if (hasEndorsed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel rounded-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-semibold text-candle-amber mb-2">
            Already Endorsed
          </h1>
          <p className="text-moonstone-gray mb-6">
            You've already endorsed this nomination
          </p>
          <div className="text-sm text-moonstone-gray opacity-80">
            <p>
              <strong className="text-candle-amber">{endorsementCounts.positive}</strong>{' '}
              endorsements so far
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Nomination expired or unlocked
  if (nomination.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel rounded-2xl p-8 text-center max-w-md">
          <div className="text-4xl mb-4">
            {nomination.status === 'unlocked' ? '🔓' : '⏰'}
          </div>
          <h1 className="text-2xl font-semibold text-candle-amber mb-2">
            {nomination.status === 'unlocked'
              ? 'Nomination Unlocked'
              : 'Nomination Closed'}
          </h1>
          <p className="text-moonstone-gray">
            {nomination.status === 'unlocked'
              ? 'This nomination has met its threshold and is no longer accepting endorsements.'
              : 'This nomination has expired.'}
          </p>
        </div>
      </div>
    );
  }

  // Endorsement screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="text-5xl mb-4">👀</div>
          <h1 className="text-3xl font-semibold text-candle-amber mb-2">
            Blind Date Nomination
          </h1>
          <p className="text-moonstone-gray">Does this make sense?</p>
        </div>

        <div className="glass-panel rounded-2xl p-8 space-y-6">
          {/* People */}
          <div className="text-center space-y-2">
            <p className="text-2xl font-medium text-moonstone-gray">
              {nomination.person_a_name}
              <span className="text-candle-amber mx-3">×</span>
              {nomination.person_b_name}
            </p>
          </div>

          {/* Rationale */}
          <div className="bg-charcoal-plum bg-opacity-50 rounded-xl p-6">
            <p className="text-sm text-candle-amber opacity-70 mb-2">
              Why they'd hit it off:
            </p>
            <p className="text-lg text-moonstone-gray italic">
              "{nomination.rationale}"
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-semibold text-candle-amber">
                {endorsementCounts.positive}
              </div>
              <div className="text-moonstone-gray opacity-70">endorsements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-moonstone-gray opacity-50">
                3+
              </div>
              <div className="text-moonstone-gray opacity-70">to unlock</div>
            </div>
          </div>
        </div>

        {/* Endorse buttons */}
        <div className="space-y-4">
          <p className="text-center text-sm text-moonstone-gray opacity-80">
            Your vote is anonymous
          </p>

          <div className="flex space-x-4">
            <button
              onClick={() => handleEndorse(true)}
              disabled={endorsing}
              className="btn-primary flex-1 text-lg py-4 disabled:opacity-50"
            >
              👍 This makes sense
            </button>
            <button
              onClick={() => handleEndorse(false)}
              disabled={endorsing}
              className="btn-secondary flex-1 text-lg py-4 disabled:opacity-50"
            >
              👎 Bad idea
            </button>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => {
          setShowAuth(false);
          setIsAuthenticated(true);
        }}
      />
    </div>
  );
}
