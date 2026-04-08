import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useWS } from "../../contexts/WebSocketContext";

const NAV_ITEMS = [
  { to: "/game", label: "修煉台", icon: "✦", end: true },
  { to: "/game/realm", label: "境界突破", icon: "⚡" },
  { to: "/game/battle", label: "戰鬥挑戰", icon: "⚔" },
  { to: "/game/inventory", label: "儲物戒", icon: "🎒" },
  { to: "/game/skills", label: "功法修練", icon: "📖" },
  { to: "/game/shop", label: "仙靈商城", icon: "💎" },
  { to: "/game/quests", label: "宗門任務", icon: "📜" },
  { to: "/game/leaderboard", label: "排行榜", icon: "🏆" },
];

export default function SideNav() {
  const { logout } = useAuth();
  const { connected, onlineCount } = useWS();

  return (
    <nav className="w-44 bg-gray-900 border-r border-yellow-900/30 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-yellow-900/30 text-center">
        <div className="text-yellow-500 text-lg font-bold tracking-widest">修仙世界</div>
        <div className="text-gray-500 text-xs mt-1">
          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${connected ? "bg-green-500" : "bg-gray-600"}`} />
          在線 {onlineCount} 人
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${isActive ? "bg-yellow-900/20 text-yellow-400 border-r-2 border-yellow-500" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"}`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-yellow-900/30">
        <button onClick={logout} className="w-full text-xs text-gray-500 hover:text-red-400 transition-colors py-1">
          登出
        </button>
      </div>
    </nav>
  );
}
