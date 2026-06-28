import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { BattleProvider } from "./contexts/BattleContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import GameLayout from "./pages/game/GameLayout";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <BattleProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/game/*" element={<GameLayout />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BattleProvider>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
