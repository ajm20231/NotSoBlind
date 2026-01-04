'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { subscribeToMessages } from '@/lib/db/messages';
import { getSupabaseClient } from '@/lib/supabase';

interface Message {
  id: string;
  sender_phone: string;
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const nominationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [nomination, setNomination] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserPhone, setCurrentUserPhone] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();

    loadChat();

    // Subscribe to new messages
    const channel = subscribeToMessages(nominationId, (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [nominationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChat = async () => {
    try {
      // Check auth
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();

      if (!authData.authenticated) {
        router.push('/');
        return;
      }

      setCurrentUserPhone(authData.user.phone);

      // Load chat data
      const res = await fetch(`/api/chat/${nominationId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Chat not found');
        setLoading(false);
        return;
      }

      setNomination(data.nomination);
      setMessages(data.messages);
      setLoading(false);
    } catch (err) {
      setError('Failed to load chat');
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setSending(true);

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominationId,
          content: newMessage.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to send message');
        setSending(false);
        return;
      }

      setNewMessage('');
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setSending(false);
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
          <h1 className="text-2xl font-semibold text-candle-amber mb-2">Error</h1>
          <p className="text-moonstone-gray">{error}</p>
        </div>
      </div>
    );
  }

  const otherPersonName =
    currentUserPhone === nomination.person_a_phone
      ? nomination.person_b_name
      : nomination.person_a_name;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="glass-panel border-b border-moonstone-gray border-opacity-10 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-candle-amber">
              Chat with {otherPersonName}
            </h1>
            <p className="text-sm text-moonstone-gray opacity-70">
              Nominated by someone who knows you both
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-moonstone-gray opacity-70 hover:opacity-100"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* System message */}
          {messages.length === 0 && (
            <div className="glass-panel rounded-2xl p-6 text-center space-y-3">
              <div className="text-3xl">👀</div>
              <div className="space-y-2">
                <p className="text-moonstone-gray">
                  <strong className="text-candle-amber">
                    You were nominated for a blind date!
                  </strong>
                </p>
                <p className="text-sm text-moonstone-gray opacity-80">
                  Endorsed by the crowd. Totally optional. No pressure.
                </p>
                <div className="text-xs text-moonstone-gray opacity-60 mt-4 space-y-1">
                  <p>• Text only, no photos</p>
                  <p>• No seen receipts</p>
                  <p>• Chat as long as you like</p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isMe = message.sender_phone === currentUserPhone;

            return (
              <div
                key={message.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    isMe
                      ? 'bg-smoked-rosewood text-moonstone-gray'
                      : 'glass-panel text-moonstone-gray'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-50 mt-1">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="glass-panel border-t border-moonstone-gray border-opacity-10 p-4">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="input-field flex-1"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="btn-primary disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
