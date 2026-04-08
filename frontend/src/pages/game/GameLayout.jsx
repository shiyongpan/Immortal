import { useEffect, useRef, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import SideNav from "../../components/layout/SideNav";
import PlayerInfoBar from "../../components/layout/PlayerInfoBar";
import ChatPanel from "../../components/layout/ChatPanel";
import Notification from "../../components/ui/Notification";

const POLL_INTERVAL = 12_000; // 12 秒滾動輪詢

export default function GameLayout() {
  const { player, loading, refreshPlayer } = useAuth();
  const timerRef = useRef(null);
  const [dailyBonusMsg, setDailyBonusMsg] = useState(null);

  // 監聽每日登入獎勵事件
  useEffect(() => {
    const handler = (e) => {
      const { immortal_jade } = e.detail || {};
      if (immortal_jade) {
        setDailyBonusMsg(`每日登入獎勵：仙玉 +${immortal_jade}`);
        setTimeout(() => setDailyBonusMsg(null), 5000);
      }
    };
    window.addEventListener("daily-bonus", handler);
    return () => window.removeEventListener("daily-bonus", handler);
  }, []);

  // 滾動式輪詢：上一次 refresh 完成後才排下一次，避免累積漂移
  // 版本號機制在 AuthContext 內確保競態安全，舊請求不會蓋掉新資料
  useEffect(() => {
    if (!player) return;

    let cancelled = false;

    const schedule = () => {
      timerRef.current = setTimeout(async () => {
        if (cancelled) return;
        await refreshPlayer().catch(() => {});
        if (!cancelled) schedule(); // 完成後再排下一次
      }, POLL_INTERVAL);
    };

    schedule();

    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
    };
  }, [!!player, refreshPlayer]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-yellow-500 text-lg animate-pulse">修仙世界載入中...</div>
      </div>
    );
  }

  if (!player) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <SideNav />

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
        <ChatPanel />
      </div>

      <PlayerInfoBar />
      <Notification />

      {/* 每日登入獎勵 Toast */}
      {dailyBonusMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-cyan-900/90 border border-cyan-600 text-cyan-300 text-sm px-5 py-2.5 rounded-full shadow-lg animate-pulse">
          ✦ {dailyBonusMsg}
        </div>
      )}
    </div>
  );
}
