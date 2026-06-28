import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { authApi } from "../api/auth";
import { storage } from "../utils/storage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [token, setToken] = useState(storage.getToken());
  const [loading, setLoading] = useState(!!storage.getToken());

  // 版本號：確保只接受「最新一次」refreshPlayer 的結果
  // 當戰鬥結束主動呼叫 refreshPlayer 後，若輪詢的舊請求才回來，會被忽略
  const refreshVersionRef = useRef(0);

  // 啟動時恢復登入狀態
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then((res) => setPlayer(res.data.player))
      .catch(() => { storage.removeToken(); setToken(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    const { token: t, player: p, dailyBonus } = res.data;
    storage.setToken(t);
    setToken(t);
    setPlayer(p);
    if (dailyBonus?.immortal_jade) {
      // 短暫顯示每日登入獎勵通知（透過 window 全域事件）
      window.dispatchEvent(new CustomEvent("daily-bonus", { detail: dailyBonus }));
    }
    return p;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    const { token: t, player: p } = res.data;
    storage.setToken(t);
    setToken(t);
    setPlayer(p);
    return p;
  }, []);

  const logout = useCallback(() => {
    storage.removeToken();
    setToken(null);
    setPlayer(null);
  }, []);

  const refreshPlayer = useCallback(async () => {
    // 每次呼叫都遞增版本號，只有「最後一次」請求的結果才會更新 state
    const myVersion = ++refreshVersionRef.current;
    const res = await authApi.me();
    if (myVersion === refreshVersionRef.current) {
      setPlayer(res.data.player);
    }
    return res.data.player;
  }, []);

  return (
    <AuthContext.Provider value={{ player, token, loading, login, register, logout, refreshPlayer }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
