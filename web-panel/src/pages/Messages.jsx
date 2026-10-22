import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiEye,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { conversationsApi } from "../api/apiServices";

const getConversationList = (response) => {
  const list =
    response?.conversations ??
    response?.data?.conversations ??
    response?.data?.data ??
    response?.data ??
    response;

  if (!Array.isArray(list)) {
    throw new Error("The conversations API returned an invalid response.");
  }

  return list.map((conversation, index) => {
    if (
      !conversation ||
      typeof conversation !== "object" ||
      Array.isArray(conversation)
    ) {
      throw new Error(
        `The conversations API returned an invalid conversation at row ${index + 1}.`,
      );
    }

    if (conversation.messages !== undefined && !Array.isArray(conversation.messages)) {
      throw new Error(
        `The conversations API returned an invalid message list at row ${index + 1}.`,
      );
    }

    return conversation;
  });
};

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  "Unable to load conversations.";

const formatTimestamp = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getConversationId = (conversation, index) =>
  conversation.conversationId ??
  conversation.id ??
  `${conversation.userId ?? "user"}-${conversation.influencerId ?? "influencer"}-${index}`;

const getLatestMessage = (conversation) => {
  if (conversation.lastMessage) return conversation.lastMessage;

  const messages = conversation.messages ?? [];
  const latest = messages.reduce((current, message) => {
    if (!current) return message;
    return new Date(message.timestamp) > new Date(current.timestamp)
      ? message
      : current;
  }, null);
  return latest?.text ?? "—";
};

const getMessageCount = (conversation) =>
  Number.isFinite(Number(conversation.messageCount))
    ? Number(conversation.messageCount)
    : (conversation.messages?.length ?? 0);

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);

  const loadConversations = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage("");

    try {
      const response = await conversationsApi.getAll();
      setConversations(getConversationList(response));
    } catch (error) {
      console.error("Unable to load conversations.", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    conversationsApi
      .getAll()
      .then((response) => {
        const list = getConversationList(response);
        if (isMounted) {
          setConversations(list);
        }
      })
      .catch((error) => {
        console.error("Unable to load conversations.", error);
        if (isMounted) {
          setErrorMessage(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) =>
      [
        conversation.userName,
        conversation.influencerName,
        getLatestMessage(conversation),
        ...(conversation.messages ?? []).map((message) => message.text),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [conversations, search]);

  return (
    <div className="mx-auto w-full max-w-[1530px] px-3 pb-6 pt-4 sm:px-5 sm:pt-6 lg:px-[38px]">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <a
              aria-label="Back to overview"
              className="grid size-9 place-items-center rounded-lg bg-violet-100 text-violet-700 transition hover:bg-violet-200"
              href="/admin"
            >
              <FiArrowLeft aria-hidden="true" size={18} />
            </a>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
              Conversations
            </h1>
          </div>
          <p className="ml-11 mt-1 text-sm text-slate-500">
            Review conversations between users and influencers.
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={refreshing || loading}
          onClick={() => loadConversations(true)}
          type="button"
        >
          <FiRefreshCw
            aria-hidden="true"
            className={refreshing ? "animate-spin" : ""}
            size={15}
          />
          {refreshing ? "Refreshing…" : "Refresh data"}
        </button>
      </header>

      {errorMessage && (
        <div
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          <span>{errorMessage}</span>
          <button
            className="font-semibold underline"
            onClick={() => loadConversations()}
            type="button"
          >
            Try again
          </button>
        </div>
      )}

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <label className="relative block w-full sm:max-w-[420px]">
          <FiSearch
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
            size={17}
          />
          <input
            aria-label="Search conversations"
            className="min-h-[50px] w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-11 pr-10 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations..."
            type="search"
            value={search}
          />
          {search && (
            <button
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
              onClick={() => setSearch("")}
              type="button"
            >
              <FiX size={16} />
            </button>
          )}
        </label>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-sm font-semibold text-slate-700">
                <th className="px-5 py-4" scope="col">
                  S.No.
                </th>
                <th className="px-4 py-4" scope="col">
                  User
                </th>
                <th className="px-4 py-4" scope="col">
                  Influencer
                </th>
                <th className="px-4 py-4" scope="col">
                  Messages
                </th>
                <th className="px-4 py-4" scope="col">
                  Latest message
                </th>
                <th className="px-4 py-4" scope="col">
                  Last activity
                </th>
                <th className="px-5 py-4" scope="col">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    className="px-5 py-10 text-center text-sm text-slate-500"
                    colSpan={7}
                  >
                    Loading conversations…
                  </td>
                </tr>
              ) : filteredConversations.length ? (
                filteredConversations.map((conversation, index) => (
                  <tr
                    className="border-b border-slate-200 text-sm text-slate-700 last:border-0 hover:bg-slate-50/70"
                    key={getConversationId(conversation, index)}
                  >
                    <td className="px-5 py-5">{index + 1}</td>
                    <td className="max-w-[190px] truncate px-4 py-5 font-medium">
                      {conversation.userName || "Unknown user"}
                    </td>
                    <td className="max-w-[190px] truncate px-4 py-5">
                      {conversation.influencerName || "Unknown influencer"}
                    </td>
                    <td className="px-4 py-5">
                      {getMessageCount(conversation)}
                    </td>
                    <td
                      className="max-w-[360px] truncate px-4 py-5"
                      title={getLatestMessage(conversation)}
                    >
                      {getLatestMessage(conversation)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-5">
                      {formatTimestamp(conversation.lastTimestamp)}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        aria-label={`View conversation between ${conversation.userName || "user"} and ${conversation.influencerName || "influencer"}`}
                        className="grid size-10 place-items-center rounded-xl border border-slate-300 text-violet-700 transition hover:bg-violet-50"
                        onClick={() => setSelectedConversation(conversation)}
                        type="button"
                      >
                        <FiEye aria-hidden="true" size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-5 py-12 text-center text-sm text-slate-500"
                    colSpan={7}
                  >
                    {search
                      ? "No conversations match your search."
                      : "No conversations found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedConversation && (
        <div
          className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedConversation(null);
            }
          }}
        >
          <section
            aria-labelledby="conversation-title"
            aria-modal="true"
            className="my-auto flex max-h-[min(760px,90vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                  Conversation
                </p>
                <h2
                  className="mt-1 truncate text-lg font-bold text-slate-800"
                  id="conversation-title"
                >
                  {selectedConversation.userName || "Unknown user"}{" "}
                  <span className="font-normal text-slate-400">with</span>{" "}
                  {selectedConversation.influencerName || "Unknown influencer"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {getMessageCount(selectedConversation)} messages
                </p>
              </div>
              <button
                aria-label="Close conversation"
                className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                onClick={() => setSelectedConversation(null)}
                type="button"
              >
                <FiX size={18} />
              </button>
            </header>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 sm:p-5">
              {(selectedConversation.messages ?? []).length ? (
                selectedConversation.messages.map((message, index) => {
                  const isInfluencer =
                    String(message.senderRole ?? "").toLowerCase() ===
                    "influencer";
                  const senderName = isInfluencer
                    ? selectedConversation.influencerName || "Influencer"
                    : selectedConversation.userName || "User";

                  return (
                    <article
                      className={`flex ${
                        isInfluencer ? "justify-end" : "justify-start"
                      }`}
                      key={message.id ?? `${message.timestamp}-${index}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl px-3.5 py-3 sm:max-w-[80%] ${
                          isInfluencer
                            ? "rounded-br-sm bg-violet-600 text-white"
                            : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"
                        }`}
                      >
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                          <span
                            className={`text-[10px] font-semibold ${
                              isInfluencer ? "text-violet-100" : "text-slate-500"
                            }`}
                          >
                            {senderName}
                          </span>
                          <time
                            className={`text-[9px] ${
                              isInfluencer ? "text-violet-200" : "text-slate-400"
                            }`}
                            dateTime={message.timestamp}
                          >
                            {formatTimestamp(message.timestamp)}
                          </time>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">
                          {message.text || ""}
                        </p>
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="py-10 text-center text-sm text-slate-500">
                  No messages are available for this conversation.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Messages;
