import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWS } from "../contexts/WebSocketContext";
import Button from "../components/ui/Button";

export default function RegisterPage() {
  const { register } = useAuth();
  const { connect } = useWS();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", displayName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      connect(localStorage.getItem("immortal_token"));
      navigate("/game");
    } catch (err) {
      setError(err.error || err.details?.join(", ") || "註冊失敗");
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-yellow-500 text-4xl mb-2">⚡</div>
          <h1 className="text-yellow-400 text-2xl font-bold tracking-widest">修仙世界</h1>
          <p className="text-gray-500 text-sm mt-1">開啟你的修仙之路</p>
        </div>

        <form onSubmit={submit} className="bg-gray-900 border border-yellow-900/40 rounded-lg p-6 space-y-4">
          <h2 className="text-gray-200 text-lg font-semibold text-center">創建角色</h2>

          {error && <div className="bg-red-900/30 border border-red-800 rounded px-3 py-2 text-red-300 text-sm">{error}</div>}

          <div>
            <label className="text-gray-400 text-xs mb-1 block">用戶名 <span className="text-red-500">*</span></label>
            <input value={form.username} onChange={set("username")} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-yellow-700" placeholder="3-50 字元，只能英數字" required />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">郵箱 <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={set("email")} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-yellow-700" placeholder="your@email.com" required />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">密碼 <span className="text-red-500">*</span></label>
            <input type="password" value={form.password} onChange={set("password")} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-yellow-700" placeholder="至少 6 個字元" required />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">道號（顯示名稱）</label>
            <input value={form.displayName} onChange={set("displayName")} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-yellow-700" placeholder="可留空，預設為用戶名" />
          </div>

          <Button type="submit" loading={loading} className="w-full">踏入修仙之路</Button>

          <p className="text-center text-gray-500 text-xs">
            已有帳號？{" "}
            <Link to="/login" className="text-yellow-500 hover:text-yellow-400">立即登入</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
