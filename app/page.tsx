'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';

export default function Home() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    setIsAuthenticated(true);
  };

  const handleNominate = () => {
    if (isAuthenticated) {
      router.push('/nominate');
    } else {
      setShowAuth(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-candle-amber">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-candle-amber">
            Not So Blind
          </h1>
          <p className="text-xl text-moonstone-gray">
            Setting friends up on blind dates,
            <br />
            endorsed by the crowd
          </p>
        </div>

        {/* Value Prop */}
        <div className="glass-panel rounded-2xl p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">👀</span>
              <div>
                <h3 className="text-lg font-medium text-candle-amber mb-1">
                  Nominate two friends
                </h3>
                <p className="text-moonstone-gray opacity-80">
                  You think they'd hit it off. Share why in one sentence.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">👍</span>
              <div>
                <h3 className="text-lg font-medium text-candle-amber mb-1">
                  Get it endorsed
                </h3>
                <p className="text-moonstone-gray opacity-80">
                  Share the link. Friends sanity-check it. No toxicity, just 👍 or 👎.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">💬</span>
              <div>
                <h3 className="text-lg font-medium text-candle-amber mb-1">
                  Chat unlocks
                </h3>
                <p className="text-moonstone-gray opacity-80">
                  Hit the threshold? They get a private thread. No pressure, total
                  mystery.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center space-y-4">
          <button onClick={handleNominate} className="btn-primary text-lg px-12 py-4">
            {isAuthenticated ? 'Make a Nomination' : 'Get Started'}
          </button>

          {!isAuthenticated && (
            <p className="text-sm text-moonstone-gray opacity-70">
              Phone verification required
            </p>
          )}

          {isAuthenticated && (
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                setIsAuthenticated(false);
              }}
              className="text-sm text-moonstone-gray opacity-70 hover:opacity-100 transition-opacity"
            >
              Sign out
            </button>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-moonstone-gray opacity-50">
          MVP • US numbers only • One nomination at a time
        </p>
      </div>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
