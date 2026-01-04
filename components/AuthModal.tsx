'use client';

import { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<'phone' | 'code' | 'name'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send code');
        setLoading(false);
        return;
      }

      setPhone(data.phone); // Use formatted phone
      setStep('code');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, firstName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid code');
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'phone') {
      handleSendCode();
    } else if (step === 'code') {
      if (!firstName.trim()) {
        setStep('name');
      } else {
        handleVerifyCode();
      }
    } else if (step === 'name') {
      handleVerifyCode();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-plum bg-opacity-90 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-semibold mb-6 text-candle-amber">
          {step === 'phone' && 'Enter your phone number'}
          {step === 'code' && 'Enter verification code'}
          {step === 'name' && "What's your first name?"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'phone' && (
            <div>
              <label className="block text-sm mb-2 text-moonstone-gray">
                Phone Number (US only)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="input-field w-full"
                autoFocus
                required
              />
              <p className="text-xs mt-2 text-moonstone-gray opacity-70">
                We'll send you a verification code
              </p>
            </div>
          )}

          {step === 'code' && (
            <div>
              <label className="block text-sm mb-2 text-moonstone-gray">
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                className="input-field w-full text-center text-2xl tracking-widest"
                maxLength={6}
                autoFocus
                required
              />
              <p className="text-xs mt-2 text-moonstone-gray opacity-70">
                Sent to {phone}
              </p>
            </div>
          )}

          {step === 'name' && (
            <div>
              <label className="block text-sm mb-2 text-moonstone-gray">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alex"
                className="input-field w-full"
                autoFocus
                required
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-smoked-rosewood bg-opacity-20 border border-smoked-rosewood">
              <p className="text-sm text-moonstone-gray">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : step === 'phone' ? 'Send Code' : 'Continue'}
          </button>

          {step === 'code' && (
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="btn-secondary w-full"
            >
              Change Number
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full text-sm text-moonstone-gray opacity-70 hover:opacity-100 transition-opacity"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
