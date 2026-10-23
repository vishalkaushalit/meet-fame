import { formatDateTime } from '../../../shared/dateFormat';
import Pagination, { usePagination } from './Pagination';
import LogoLoader from './LogoLoader';
import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { navigateAdminRecord } from '../routes';
import { User, Sparkles, Eye, Search } from 'lucide-react';

export default function ConversationsView({ detailId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const selectedConv = conversations.find(
    (conversation) => conversation.conversationId === detailId,
  );
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadConversations() {
      setLoading(true);
      try {
        const res = await adminApi.conversations.getAll();
        setConversations(res.conversations || []);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, []);

  const filtered = conversations.filter((c) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.userName?.toLowerCase().includes(q) ||
      c.influencerName?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  });

  const threadPagination = usePagination(filtered, searchTerm);

  if (detailId && !loading && !selectedConv) {
    return (
      <div className="dashboard-card p-6 space-y-4">
        <p>Conversation not found.</p>
      </div>
    );
  }

  return (
    <div className="conversations-view space-y-6">
      {loading ? (
        <LogoLoader variant="inline" label="Loading conversation threads..." />
      ) : conversations.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-slate-900 rounded-3xl border border-slate-800 text-xs">
          No conversations recorded on platform yet.
        </div>
      ) : (
        <div className="space-y-4">
          {!selectedConv ? (
            <div className="space-y-6">
              <div className="admin-list-toolbar">
                <div className="conversation-search relative">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple"
                  />
                </div>
              </div>
              <div className="admin-records-table-wrap">
                <table
                  className="dashboard-table conversation-table column-sized-table"
                  style={{ minWidth: 1074 }}
                >
                  <colgroup>
                    <col style={{ width: 64 }} />
                    <col style={{ width: 180 }} />
                    <col style={{ width: 180 }} />
                    <col style={{ width: 100 }} />
                    <col style={{ width: 260 }} />
                    <col style={{ width: 210 }} />
                    <col style={{ width: 80 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>S.No.</th>
                      <th>User</th>
                      <th>Influencer</th>
                      <th>Messages</th>
                      <th>Latest message</th>
                      <th>Last activity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {threadPagination.items.map((conv, index) => (
                      <tr key={conv.conversationId}>
                        <td>{threadPagination.start + index}</td>
                        <td>{conv.userName}</td>
                        <td>{conv.influencerName}</td>
                        <td>{conv.messageCount}</td>
                        <td>
                          <span className="conversation-preview">
                            {conv.lastMessage || '—'}
                          </span>
                        </td>
                        <td>{formatDateTime(conv.lastTimestamp)}</td>
                        <td>
                          <div className="account-icon-actions">
                            <button
                              type="button"
                              className="user-view-button"
                              aria-label={`View conversation between ${conv.userName} and ${conv.influencerName}`}
                              title="View conversation"
                              onClick={() =>
                                navigateAdminRecord(
                                  'conversations',
                                  conv.conversationId,
                                )
                              }
                            >
                              <Eye size={18} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!filtered.length && (
                      <tr>
                        <td colSpan={7}>No conversations match your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={threadPagination} label="conversations" />
            </div>
          ) : (
            <div className=" bg-slate-900 rounded-3xl border border-slate-800 flex flex-col overflow-hidden">
              {selectedConv ? (
                <>
                  <div className="conversation-header p-4 px-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white text-sm">
                          {selectedConv.userName}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="font-semibold text-brand-purple text-sm">
                          Influencer: {selectedConv.influencerName}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 break-all">
                        Thread ID: {selectedConv.conversationId}
                      </p>
                    </div>

                    <span className="shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Live Audit Log
                    </span>
                  </div>

                  {/* Messages Feed */}
                  <div className="conversation-feed flex-1 p-5 overflow-y-auto space-y-3 bg-[#080D1A] max-h-[460px]">
                    {selectedConv.messages?.map((msg) => {
                      const isInfluencer = msg.senderRole === 'influencer';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isInfluencer ? 'items-end' : 'conversation-client-message items-start'}`}
                        >
                          <span className="conversation-message-sender text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                            {isInfluencer ? (
                              <>
                                <Sparkles className="w-3 h-3 text-brand-purple" />
                                <span className="text-brand-purple">
                                  {msg.influencerName} (Influencer)
                                </span>
                              </>
                            ) : (
                              <>
                                <User className="w-3 h-3 text-indigo-400" />
                                <span className="text-indigo-300">
                                  {msg.userName}
                                </span>
                              </>
                            )}
                          </span>

                          <div
                            className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed break-words ${
                              isInfluencer
                                ? 'conversation-message-creator bg-gradient-to-r from-brand-indigo to-brand-purple text-white rounded-tr-none'
                                : 'conversation-message-client bg-slate-800 text-slate-200 border border-slate-700/70 rounded-tl-none'
                            }`}
                          >
                            {msg.text}
                            <div className="conversation-message-time text-[9px] text-slate-400 mt-1 text-right">
                              {formatDateTime(msg.timestamp)}
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
          )}
        </div>
      )}
    </div>
  );
}
