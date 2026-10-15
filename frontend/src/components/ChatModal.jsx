import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import VerifiedBadge from './VerifiedBadge';
import { X, Send, MessageSquare, Clock, User, Sparkles } from 'lucide-react';

export default function ChatModal({ isOpen, onClose, targetUser, targetRole = 'influencer' }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Conversation ID format: `${userId}_${influencerId}`
  const conversationId = user && targetUser
    ? (user.role === 'user'
        ? `${user.id}_${targetUser.id}`
        : `${targetUser.id}_${user.id}`)
    : null;

  useEffect(() => {
    if (!conversationId || !isOpen) return;

    let timer;
    async function fetchMessages() {
      try {
        const res = await api.chat.getMessages(conversationId);
        setMessages(res.messages || []);
      } catch (err) {
        console.error('Failed to load chat:', err);
      }
    }

    fetchMessages();
    timer = setInterval(fetchMessages, 3000); // Polling for live chat updates

    return () => clearInterval(timer);
  }, [conversationId, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !targetUser || !user) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText('');

    const userId = user.role === 'user' ? user.id : targetUser.id;
    const userName = user.role === 'user' ? user.name : targetUser.name;
    const influencerId = user.role === 'influencer' ? user.id : targetUser.id;
    const influencerName = user.role === 'influencer' ? user.name : targetUser.name;

    try {
      const res = await api.chat.sendMessage({
        conversationId,
        userId,
        userName,
        influencerId,
        influencerName,
        senderId: user.id,
        senderRole: user.role,
        text
      });

      setMessages(prev => [...prev, res.message]);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl h-[560px] flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 px-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={targetUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt={targetUser.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-purple/30"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-white text-sm">{targetUser.name}</h4>
                {targetUser.isVerified && <VerifiedBadge size="sm" />}
              </div>
              <p className="text-[11px] text-slate-400">
                {targetRole === 'influencer' ? (targetUser.specialization || 'Influencer') : 'Client'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#080D1A]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <MessageSquare className="w-10 h-10 mb-2 opacity-40 text-brand-purple" />
              <p className="text-xs font-semibold text-slate-400">Start the conversation</p>
              <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                Discuss session goals, share attachments, or ask questions ahead of your 1-hour time slot.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user.id;
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                      isMe
                        ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white rounded-br-none'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                    }`}
                  >
                    <p>{m.text}</p>
                    <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <form onSubmit={handleSend} className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${targetUser.name}...`}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-purple text-white disabled:opacity-40 hover:opacity-90 transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
