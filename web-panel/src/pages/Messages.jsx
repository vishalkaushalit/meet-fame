import { useState } from "react";
import { FiMessageCircle, FiSend } from "react-icons/fi";

const initialConversations = [
  {
    name: "Maya Chen",
    initials: "MC",
    color: "bg-purple-100 text-purple-700",
    preview: "Thanks! Looking forward to our call.",
    time: "12m",
    unread: true,
  },
  {
    name: "Jordan Lee",
    initials: "JL",
    color: "bg-orange-100 text-orange-700",
    preview: "Could we move the session to 4:30?",
    time: "1h",
    unread: true,
  },
  {
    name: "Amara Okafor",
    initials: "AO",
    color: "bg-blue-100 text-blue-700",
    preview: "I’ve shared the project brief with you.",
    time: "3h",
    unread: false,
  },
];

function Messages() {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversation, setActiveConversation] = useState(
    initialConversations[0].name,
  );
  const [reply, setReply] = useState("");
  const selected = conversations.find(
    (conversation) => conversation.name === activeConversation,
  );

  function sendReply(event) {
    event.preventDefault();
    if (!reply.trim()) return;

    setConversations((current) =>
      current.map((conversation) =>
        conversation.name === activeConversation
          ? { ...conversation, preview: reply.trim(), time: "now", unread: false }
          : conversation,
      ),
    );
    setReply("");
  }

  return (
    <div className="mx-auto max-w-[1530px] px-3 pb-5 pt-6 sm:px-5 sm:pt-[30px] lg:px-[38px]">
      <section className="mb-5">
        <div className="mb-2 text-[9px] font-bold tracking-[1.1px] text-slate-400">
          STAY CONNECTED
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-[#18213e]">
          Messages
        </h1>
        <p className="mt-1.5 text-[11px] text-slate-400">
          Keep up with your clients and creator community.
        </p>
      </section>

      <section
        aria-label="Messages"
        className="grid min-h-[440px] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02] md:grid-cols-[minmax(220px,.7fr)_minmax(0,1.3fr)]"
      >
        <div className="border-b border-slate-100 md:border-b-0 md:border-r">
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Conversations
            </h2>
            <p className="mt-1 text-[9px] text-slate-400">
              {conversations.filter((conversation) => conversation.unread).length}{" "}
              unread messages
            </p>
          </div>
          <div className="grid">
            {conversations.map((conversation) => (
              <button
                className={`flex items-start gap-2.5 border-b border-slate-100 p-3 text-left transition hover:bg-slate-50 ${
                  activeConversation === conversation.name ? "bg-violet-50/70" : ""
                }`}
                key={conversation.name}
                onClick={() => {
                  setActiveConversation(conversation.name);
                  setConversations((current) =>
                    current.map((item) =>
                      item.name === conversation.name
                        ? { ...item, unread: false }
                        : item,
                    ),
                  );
                }}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full text-[9px] font-bold ${conversation.color}`}
                >
                  {conversation.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <strong className="text-[10px] font-semibold text-slate-700">
                      {conversation.name}
                    </strong>
                    <small className="text-[8px] text-slate-400">
                      {conversation.time}
                    </small>
                  </span>
                  <span className="mt-1 block truncate text-[9px] text-slate-400">
                    {conversation.preview}
                  </span>
                </span>
                {conversation.unread && (
                  <span
                    aria-label="Unread"
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-500"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {selected ? (
          <div className="flex min-h-[300px] flex-col">
            <div className="flex items-center gap-2.5 border-b border-slate-100 p-4">
              <span
                className={`grid size-9 place-items-center rounded-full text-[9px] font-bold ${selected.color}`}
              >
                {selected.initials}
              </span>
              <div>
                <h2 className="text-[11px] font-semibold text-slate-700">
                  {selected.name}
                </h2>
                <span className="text-[9px] text-emerald-600">Active now</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-end gap-3 p-4">
              <p className="max-w-[80%] self-start rounded-xl rounded-bl-sm bg-slate-100 px-3 py-2 text-[10px] text-slate-600">
                {selected.preview}
              </p>
            </div>
            <form
              className="flex items-center gap-2 border-t border-slate-100 p-3"
              onSubmit={sendReply}
            >
              <label className="sr-only" htmlFor="message-reply">
                Write a message
              </label>
              <input
                className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-[10px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                id="message-reply"
                onChange={(event) => setReply(event.target.value)}
                placeholder="Write a message..."
                value={reply}
              />
              <button
                aria-label="Send message"
                className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-600 text-white transition hover:bg-violet-700"
                type="submit"
              >
                <FiSend aria-hidden="true" size={15} />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <FiMessageCircle
              aria-hidden="true"
              className="text-violet-400"
              size={28}
            />
            <p className="mt-3 text-[11px] font-semibold text-slate-700">
              Select a conversation
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default Messages;
