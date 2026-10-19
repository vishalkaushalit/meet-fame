import LogoLoader from './LogoLoader';
import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';
import {
  MessageSquare,
  User,
  Sparkles,
  Clock,
  ArrowRight,
  Shield,
  Search
} from 'lucide-react';

export default function ConversationsView() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadConversations() {
      setLoading(true);
      try {
        const res = await adminApi.conversations.getAll();
        setConversations(res.conversations || []);
        if (res.conversations?.length > 0 && !selectedConv) {
          setSelectedConv(res.conversations[0]);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, []);

  const filtered = conversations.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.userName?.toLowerCase().includes(q) ||
      c.influencerName?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-brand-purple" />
          <span>User & Influencer Conversations Monitor</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Inspect message threads, review attendee briefings, and monitor community interactions.
        </p>
      </div>

      {loading ? (
        <LogoLoader variant="inline" label="Loading conversation threads..." />
      ) : conversations.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-slate-900 rounded-3xl border border-slate-800 text-xs">
          No conversations recorded on platform yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
          {/* Threads List (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 rounded-3xl border border-slate-800 p-4 flex flex-col">
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px]">
              {filtered.map((conv) => {
                const isSelected = selectedConv?.conversationId === conv.conversationId;
                return (
                  <button
                    key={conv.conversationId}
                    type="button"
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full p-3.5 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-brand-purple shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <span>{conv.userName}</span>
                        <span className="text-slate-500 font-normal">↔</span>
                        <span className="text-brand-purple">{conv.influencerName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {conv.messageCount} msgs
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                      "{conv.lastMessage}"
                    </p>

                    <div className="text-[10px] text-slate-500 mt-1">
                      {new Date(conv.lastTimestamp).toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Thread Inspector (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col overflow-hidden">
            {selectedConv ? (
              <>
                <div className="p-4 px-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">Client: {selectedConv.userName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="font-bold text-brand-purple text-sm">Creator: {selectedConv.influencerName}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Thread ID: {selectedConv.conversationId}
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Live Audit Log
                  </span>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-[#080D1A] max-h-[460px]">
                  {selectedConv.messages?.map((msg) => {
                    const isInfluencer = msg.senderRole === 'influencer';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isInfluencer ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                          {isInfluencer ? (
                            <>
                              <Sparkles className="w-3 h-3 text-brand-purple" />
                              <span className="text-brand-purple">{msg.influencerName} (Influencer)</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 text-indigo-400" />
                              <span className="text-indigo-300">{msg.userName} (Client)</span>
                            </>
                          )}
                        </span>

                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                            isInfluencer
                              ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white rounded-tr-none'
                              : 'bg-slate-800 text-slate-200 border border-slate-700/70 rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                          <div className="text-[9px] text-slate-400 mt-1 text-right">
                            {new Date(msg.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                Select a conversation thread to inspect message history.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
