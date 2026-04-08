import { useWS } from "../../contexts/WebSocketContext";

export default function Notification() {
  const { notifications } = useWS();
  if (!notifications.length) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((n) => (
        <div key={n.id} className={`px-4 py-2 rounded border text-sm shadow-lg animate-pulse ${n.type === "gold" ? "bg-yellow-900/80 border-yellow-600 text-yellow-300" : "bg-gray-800/90 border-gray-600 text-gray-200"}`}>
          {n.message}
        </div>
      ))}
    </div>
  );
}
