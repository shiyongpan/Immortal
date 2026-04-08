import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWS } from "../contexts/WebSocketContext";
import Button from "../components/ui/Button";

export default function LoginPage() {
  const { login, token } = useAuth();
  const { connect } = useWS();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (token) { navigate("/game", { replace: true }); return null; }

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      connect(localStorage.getItem("immortal_token"));
      navigate("/game");
    } catch (err) {
      setError(err.error || "登入失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-yellow-500 text-4xl mb-2">⚡</div>
          <h1 className="text-yellow-400 text-2xl font-bold tracking-widest">修仙世界</h1>
          <p className="text-gray-500 text-sm mt-1">踏上修仙之路</p>
        </div>

        <form onSubmit={submit} className="bg-gray-900 border border-yellow-900/40 rounded-lg p-6 space-y-4">
          <h2 className="text-gray-200 text-lg font-semibold text-center">登入</h2>

          {error && <div className="bg-red-900/30 border border-red-800 rounded px-3 py-2 text-red-300 text-sm">{error}</div>}

          <div>
            <label className="text-gray-400 text-xs mb-1 block">用戶名 / 郵箱</label>
            <input
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-yellow-700"
              placeholder="輸入用戶名或郵箱"
              required
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">密碼</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-yellow-700"
              placeholder="輸入密碼"
              required
            />
          </div>

          <Button type="submit" loading={loading} className="w-full">進入修仙世界</Button>

          <p className="text-center text-gray-500 text-xs">
            還未踏入修道？{" "}
            <Link to="/register" className="text-yellow-500 hover:text-yellow-400">立即開始</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
