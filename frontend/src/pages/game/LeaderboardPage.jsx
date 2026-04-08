import { useEffect, useState } from "react";
import { leaderboardApi } from "../../api/leaderboard";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { formatNumber } from "../../utils/format";

const TYPES = [
  { key: "realm", label: "境界排行" },
  { key: "level", label: "等級排行" },
  { key: "battle_wins", label: "戰鬥排行" },
  { key: "spirit_stones", label: "財富排行" },
];

export default function LeaderboardPage() {
  const { player } = useAuth();
  const [type, setType] = useState("realm");
  const [data, setData] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([leaderboardApi.get(type), leaderboardApi.getMe(type)])
      .then(([lb, me]) => {
        setData(lb.data.leaderboard || []);
        setMyRank(me.data.rank || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type]);

  const MEDAL = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4">
      <h1 className="text-yellow-400 text-xl font-bold border-l-2 border-yellow-500 pl-3">排行榜</h1>

      <div className="flex gap-2 flex-wrap">
        {TYPES.map((t) => (
          <Button key={t.key} onClick={() => setType(t.key)} variant={type === t.key ? "primary" : "secondary"} size="sm">
            {t.label}
          </Button>
        ))}
      </div>

      {myRank && (
        <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-4 py-2 flex items-center justify-between text-sm">
          <span className="text-yellow-400">我的排名</span>
          <span className="text-gray-200">第 <span className="text-yellow-400 font-bold text-lg">{myRank.rank}</span> 名</span>
          <span className="text-gray-400">{myRank.value && formatNumber(myRank.value)}</span>
        </div>
      )}

      <Card title={TYPES.find((t) => t.key === type)?.label}>
        {loading ? (
          <div className="text-gray-500 text-center py-8">載入中...</div>
        ) : data.length === 0 ? (
          <div className="text-gray-500 text-center py-8">暫無排行數據</div>
        ) : (
          <div className="space-y-2">
            {data.map((entry, i) => (
              <div
                key={entry.player_id || i}
                className={`flex items-center gap-4 px-3 py-2.5 rounded-lg ${entry.player_id === player?.id ? "bg-yellow-900/20 border border-yellow-800/40" : "bg-gray-800/60"}`}
              >
                <span className="w-8 text-center font-bold text-sm">
                  {i < 3 ? MEDAL[i] : <span className="text-gray-500">{i + 1}</span>}
                </span>
                <span className="flex-1 text-gray-200 text-sm">{entry.display_name || entry.username}</span>
                {entry.realm_name && <span className="text-purple-300 text-xs">{entry.realm_name} {entry.stage_name}</span>}
                <span className="text-yellow-400 text-sm font-semibold">{formatNumber(entry.value ?? entry.score ?? 0)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
