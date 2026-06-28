import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import GameWorld from "../../scenes/GameWorld";

export default function GameLayout() {
  const { player, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-screen h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-yellow-500 text-lg animate-pulse tracking-widest">修仙世界載入中...</div>
      </div>
    );
  }

  if (!player) return <Navigate to="/login" replace />;

  return <GameWorld />;
}
