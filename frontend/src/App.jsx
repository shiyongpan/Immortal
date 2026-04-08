import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { BattleProvider } from "./contexts/BattleContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import GameLayout from "./pages/game/GameLayout";
import DashboardPage from "./pages/game/DashboardPage";
import RealmPage from "./pages/game/RealmPage";
import BattlePage from "./pages/game/BattlePage";
import InventoryPage from "./pages/game/InventoryPage";
import SkillPage from "./pages/game/SkillPage";
import ShopPage from "./pages/game/ShopPage";
import QuestPage from "./pages/game/QuestPage";
import LeaderboardPage from "./pages/game/LeaderboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <BattleProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/game" element={<GameLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="realm" element={<RealmPage />} />
              <Route path="battle" element={<BattlePage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="skills" element={<SkillPage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="quests" element={<QuestPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </BattleProvider>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
