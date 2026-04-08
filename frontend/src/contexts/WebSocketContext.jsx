import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

const WS_URL = "ws://localhost:3000";
const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectCount = useRef(0);
  const tokenRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((msg) => {
    const n = { id: Date.now(), ...msg };
    setNotifications((prev) => [...prev.slice(-9), n]);
    setTimeout(() => setNotifications((prev) => prev.filter((x) => x.id !== n.id)), 4000);
  }, []);

  const handleMessage = useCallback((raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    switch (data.type) {
      case "AUTH_SUCCESS":
        setConnected(true);
        setOnlineCount(data.onlineCount || 0);
        reconnectCount.current = 0;
        break;
      case "PLAYER_ONLINE":
        setOnlineCount(data.onlineCount || 0);
        addNotification({ type: "info", message: `${data.username} 上線了` });
        break;
      case "PLAYER_OFFLINE":
        setOnlineCount(data.onlineCount || 0);
        break;
      case "CHAT_MESSAGE":
        setChatMessages((prev) => [...prev.slice(-99), data]);
        break;
      case "REALM_BREAKTHROUGH":
        addNotification({ type: "gold", message: data.message });
        break;
      case "ONLINE_COUNT":
        setOnlineCount(data.count || 0);
        break;
      default:
        break;
    }
  }, [addNotification]);

  const connect = useCallback((token) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    tokenRef.current = token;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "AUTH", token }));
    };
    ws.onmessage = (e) => handleMessage(e.data);
    ws.onclose = () => {
      setConnected(false);
      if (reconnectCount.current < 5 && tokenRef.current) {
        reconnectCount.current++;
        reconnectTimer.current = setTimeout(() => connect(tokenRef.current), 3000);
      }
    };
    ws.onerror = () => ws.close();
  }, [handleMessage]);

  const disconnect = useCallback(() => {
    tokenRef.current = null;
    clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
    setConnected(false);
  }, []);

  const sendChat = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "CHAT_MESSAGE", message }));
    }
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  return (
    <WebSocketContext.Provider value={{ connected, onlineCount, chatMessages, notifications, connect, disconnect, sendChat }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWS = () => useContext(WebSocketContext);
