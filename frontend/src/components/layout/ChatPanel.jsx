import { useState, useRef, useEffect } from "react";
import { useWS } from "../../contexts/WebSocketContext";
import { useAuth } from "../../contexts/AuthContext";

export default function ChatPanel() {
  const { chatMessages, sendChat, connected } = useWS();
  const { player } = useAuth();
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, open]);

  const submit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendChat(input.trim());
    setInput("");
  };

  const unread = !open && chatMessages.length > 0;

  return (
    <div className="border-t border-yellow-900/30 bg-gray-900">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-1.5 text-xs text-gray-400 hover:text-gray-200"
      >
        <span>世界聊天 {unread ? `(${chatMessages.length})` : ""}</span>
        <span>{open ? "▼" : "▲"}</span>
      </button>

      {open && (
        <div className="flex flex-col h-36">
          <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
            {chatMessages.slice(-50).map((m, i) => (
              <div key={i} className="text-xs">
                <span className={`font-semibold ${m.playerId === player?.id ? "text-yellow-400" : "text-purple-300"}`}>
                  {m.username}
                </span>
                <span className="text-gray-500 mx-1">:</span>
                <span className="text-gray-300">{m.message}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={submit} className="flex gap-2 px-3 py-2 border-t border-gray-800">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={connected ? "輸入訊息..." : "未連線"}
              disabled={!connected}
              maxLength={200}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-yellow-700"
            />
            <button type="submit" disabled={!connected || !input.trim()} className="px-3 py-1 bg-yellow-800 hover:bg-yellow-700 text-xs rounded disabled:opacity-40">
              發送
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
