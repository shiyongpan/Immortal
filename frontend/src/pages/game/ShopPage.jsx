import { useEffect, useState, useCallback } from "react";
import { useApi } from "../../hooks/useApi";
import { shopApi } from "../../api/shop";
import { inventoryApi } from "../../api/inventory";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { formatNumber } from "../../utils/format";

const CURRENCY_LABEL = {
  spirit_stones:       "靈石",
  immortal_jade:       "仙玉",
  honor_points:        "榮譽",
  contribution_points: "貢獻",
};
const CURRENCY_COLOR = {
  spirit_stones:       "text-yellow-400",
  immortal_jade:       "text-cyan-400",
  honor_points:        "text-purple-400",
  contribution_points: "text-green-400",
};
const RARITY_BORDER = {
  common: "border-gray-600", uncommon: "border-green-700",
  rare: "border-blue-700", epic: "border-purple-700", legendary: "border-yellow-600",
};
const RARITY_TEXT = {
  common: "text-gray-300", uncommon: "text-green-400",
  rare: "text-blue-400", epic: "text-purple-400", legendary: "text-yellow-400",
};

// 物品效果說明
function effectLabel(effects) {
  if (!effects) return null;
  const parts = [];
  if (effects.hp_restore)           parts.push(`回復 HP +${formatNumber(effects.hp_restore)}`);
  if (effects.mp_restore)           parts.push(`回復 MP +${formatNumber(effects.mp_restore)}`);
  if (effects.exp_gain)             parts.push(`境界修為 +${formatNumber(effects.exp_gain)}`);
  if (effects.spirit_stones_gain)   parts.push(`兌換靈石 +${formatNumber(effects.spirit_stones_gain)}`);
  if (effects.realm_exp_gain)       parts.push(`修為精華 +${formatNumber(effects.realm_exp_gain)}`);
  if (effects.breakthrough_rate_boost) parts.push(`突破率 +${effects.breakthrough_rate_boost}%`);
  if (effects.extreme_entry)        parts.push("進入極境材料");
  return parts.join(" · ") || null;
}

// 物品獲取途徑說明
const OBTAIN_TIPS = {
  靈石碎片: "🗡 怪物掉落",
  中品靈石:  "🗡 怪物掉落",
  上品靈石:  "🗡 高階怪物掉落",
  妖核: "🗡 怪物掉落",
  天材地寶:  "🗡 高階怪物 / 宗門商店",
  極境靈石:  "🗡 怪物掉落 / 宗門商店",
};

// 每種商城對應使用的貨幣說明
const SHOP_EARN_TIPS = {
  general: { currency: "spirit_stones", tip: "💡 靈石：擊殺怪物、完成任務、出售物品獲得" },
  realm:   { currency: "spirit_stones", tip: "💡 靈石：擊殺怪物、完成任務、出售物品獲得" },
  pvp:     { currency: "honor_points",  tip: "💡 榮譽：擊殺 Boss 怪物獲得" },
  guild:   { currency: "contribution_points", tip: "💡 貢獻：完成宗門任務獲得" },
};

export default function ShopPage() {
  const { player, refreshPlayer } = useAuth();
  const shops = useApi(shopApi.getShops);
  const inventory = useApi(inventoryApi.getAll);
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopItems, setShopItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [buying, setBuying] = useState(null);
  const [selling, setSelling] = useState(null);
  const [tab, setTab] = useState("buy"); // buy | sell | use

  useEffect(() => {
    shops.execute();
    inventory.execute();
  }, []);

  const notify = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const loadShop = async (shopId) => {
    setSelectedShop(shopId);
    setLoading(true);
    try {
      const res = await shopApi.getItems(shopId);
      setShopItems(res.data.items || []);
    } catch { notify("載入商城失敗", false); }
    finally { setLoading(false); }
  };

  const buy = async (item) => {
    setBuying(item.id);
    try {
      const r = await shopApi.buy(item.id, 1);
      notify(`✦ 購買 ${item.item_name}，花費 ${formatNumber(r.data.totalCost)} ${CURRENCY_LABEL[item.currency_type] || "靈石"}`);
      setShopItems((prev) => prev.map((si) =>
        si.id === item.id && si.total_limit > 0
          ? { ...si, total_sold: (si.total_sold || 0) + 1 }
          : si,
      ));
      refreshPlayer();
      inventory.execute();
    } catch (err) {
      notify(err?.response?.data?.error || err.error || "購買失敗", false);
    } finally { setBuying(null); }
  };

  const sell = async (invItem) => {
    setSelling(invItem.id);
    try {
      const r = await shopApi.sell(invItem.id, 1);
      notify(`✦ 出售 ${invItem.item_name}，獲得 ${formatNumber(r.data.spiritStonesGained)} 靈石`);
      refreshPlayer();
      inventory.execute();
    } catch (err) {
      notify(err?.response?.data?.error || err.error || "出售失敗", false);
    } finally { setSelling(null); }
  };

  const useItem = async (invItem) => {
    setSelling(invItem.id);
    try {
      const r = await inventoryApi.useItem(invItem.id);
      const ef = r.data.effects || {};
      const parts = [];
      if (ef.spirit_stones_gain) parts.push(`靈石 +${formatNumber(ef.spirit_stones_gain)}`);
      if (ef.realm_exp_gain)     parts.push(`修為 +${formatNumber(ef.realm_exp_gain)}`);
      if (ef.hp_restore)         parts.push(`HP +${formatNumber(ef.hp_restore)}`);
      if (ef.mp_restore)         parts.push(`MP +${formatNumber(ef.mp_restore)}`);
      if (ef.exp_gain)           parts.push(`境界修為 +${formatNumber(ef.exp_gain)}`);
      notify(`✦ 使用 ${invItem.item_name}：${parts.join(", ") || "完成"}`);
      refreshPlayer();
      inventory.execute();
    } catch (err) {
      notify(err?.response?.data?.error || err.error || "使用失敗", false);
    } finally { setSelling(null); }
  };

  const shopList = shops.data?.shops || [];
  const curShop = shopList.find((s) => s.id === selectedShop);
  const currencies = {
    spirit_stones:       Number(player?.spirit_stones       ?? 0),
    immortal_jade:       Number(player?.immortal_jade       ?? 0),
    honor_points:        Number(player?.honor_points        ?? 0),
    contribution_points: Number(player?.contribution_points ?? 0),
  };

  // 可出售 or 可使用的背包物品
  const invItems = inventory.data?.items || [];
  const sellableItems = invItems.filter((i) => !i.is_equipped && i.sell_price > 0 && i.item_type !== "quest");
  const usableItems = invItems.filter((i) => {
    const ef = i.effects || {};
    return !i.is_equipped && (ef.hp_restore || ef.mp_restore || ef.exp_gain || ef.spirit_stones_gain || ef.realm_exp_gain);
  });

  const earnTip = curShop ? SHOP_EARN_TIPS[curShop.shop_type] : null;

  return (
    <div className="space-y-4">
      {/* 標題 + 貨幣 */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h1 className="text-yellow-400 text-xl font-bold border-l-2 border-yellow-500 pl-3">仙靈商城</h1>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(currencies).map(([key, val]) => (
            val > 0 || key === "spirit_stones" ? (
              <div key={key} className={`flex items-center gap-1 bg-gray-800 rounded px-2 py-1 ${CURRENCY_COLOR[key]}`}>
                <span className="text-gray-500">{CURRENCY_LABEL[key]}</span>
                <span className="font-bold">{formatNumber(val)}</span>
              </div>
            ) : null
          ))}
        </div>
      </div>

      {msg && (
        <div className={`rounded px-3 py-2 text-sm border ${msg.ok ? "bg-yellow-900/20 border-yellow-800 text-yellow-300" : "bg-red-900/20 border-red-800 text-red-300"}`}>
          {msg.text}
        </div>
      )}

      {/* 商城選擇 */}
      <div className="flex gap-2 flex-wrap">
        {shopList.map((s) => (
          <Button key={s.id} onClick={() => { loadShop(s.id); setTab("buy"); }}
            variant={selectedShop === s.id ? "primary" : "secondary"} size="sm">
            {s.shop_name}
          </Button>
        ))}
        {shops.loading && <span className="text-gray-500 text-sm py-1">載入中...</span>}
      </div>

      {/* 標籤頁：買/賣/使用 */}
      {selectedShop && (
        <div className="flex gap-0 border-b border-gray-700">
          {[
            { key: "buy",  label: "購買" },
            { key: "sell", label: `出售（${sellableItems.length}）` },
            { key: "use",  label: `使用材料（${usableItems.length}）` },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 text-sm border-b-2 transition-colors ${tab === t.key ? "border-yellow-500 text-yellow-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── 購買頁 ── */}
      {tab === "buy" && selectedShop && (
        <Card title={curShop?.shop_name}>
          {earnTip && (
            <div className={`text-xs ${CURRENCY_COLOR[earnTip.currency]} bg-gray-800/50 rounded px-3 py-1.5 mb-3`}>
              {earnTip.tip}
            </div>
          )}
          {loading ? (
            <div className="text-gray-500 text-center py-6">載入中...</div>
          ) : shopItems.length === 0 ? (
            <div className="text-gray-500 text-center py-6">此商城暫無商品</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shopItems.map((item) => {
                const remain = item.total_limit > 0 ? item.total_limit - (item.total_sold || 0) : null;
                const soldOut = remain !== null && remain <= 0;
                const canAfford = currencies[item.currency_type] >= Number(item.price);
                const canBuy = item.can_buy && !soldOut;
                const ef = effectLabel(item.effects);

                return (
                  <div key={item.id}
                    className={`bg-gray-800/80 rounded-lg p-3 border ${RARITY_BORDER[item.rarity] || "border-gray-600"} ${soldOut ? "opacity-40" : ""}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-semibold text-sm ${RARITY_TEXT[item.rarity] || "text-gray-300"}`}>{item.item_name}</span>
                          <span className="text-xs text-gray-600 bg-gray-900 px-1.5 rounded">{item.item_type}</span>
                          {item.realm_required_name && (
                            <span className="text-xs text-orange-500/80">{item.realm_required_name}+</span>
                          )}
                        </div>
                        {/* 效果說明 */}
                        {ef && <div className="text-xs text-cyan-400/80 mt-0.5">{ef}</div>}
                        <div className="text-gray-500 text-xs mt-0.5 line-clamp-1">{item.description}</div>

                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`font-bold text-sm ${CURRENCY_COLOR[item.currency_type] || "text-yellow-400"}`}>
                            {formatNumber(item.price)} {CURRENCY_LABEL[item.currency_type] || "靈石"}
                          </span>
                          {remain !== null && (
                            <span className={`text-xs ${remain <= 5 ? "text-red-400" : "text-gray-500"}`}>庫存 {remain}</span>
                          )}
                          {item.daily_limit > 0 && (
                            <span className="text-xs text-gray-600">每日 {item.daily_limit}</span>
                          )}
                        </div>
                        {!item.can_buy && item.realm_required_name && (
                          <div className="text-orange-500 text-xs">需 {item.realm_required_name}</div>
                        )}
                        {!canAfford && canBuy && (
                          <div className="text-red-400 text-xs">{CURRENCY_LABEL[item.currency_type]}不足</div>
                        )}
                      </div>
                      <Button onClick={() => buy(item)} loading={buying === item.id}
                        disabled={!canBuy || !canAfford} size="sm" className="shrink-0">
                        {soldOut ? "售罄" : !item.can_buy ? "未解鎖" : "購買"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ── 出售頁 ── */}
      {tab === "sell" && (
        <Card title="出售物品（賣給商城獲得靈石）">
          <div className="text-xs text-gray-500 mb-3">出售價格為買入價的 25%~50%</div>
          {sellableItems.length === 0 ? (
            <div className="text-gray-500 text-center py-6">背包中沒有可出售的物品</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sellableItems.map((item) => (
                <div key={item.id}
                  className={`bg-gray-800/60 rounded p-2.5 border ${RARITY_BORDER[item.rarity] || "border-gray-700"} flex items-center justify-between gap-2`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-medium ${RARITY_TEXT[item.rarity] || "text-gray-300"}`}>{item.item_name}</span>
                      <span className="text-xs text-gray-600">x{item.quantity}</span>
                    </div>
                    <div className="text-yellow-400/80 text-xs mt-0.5">出售價 {formatNumber(item.sell_price)} 靈石</div>
                  </div>
                  <Button onClick={() => sell(item)} loading={selling === item.id} size="sm" variant="secondary">
                    出售 ×1
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── 使用材料頁 ── */}
      {tab === "use" && (
        <Card title="使用材料（靈石、妖核等）">
          <div className="text-xs text-gray-500 mb-3">
            靈石材料兌換為靈石貨幣・妖核提供境界修為・丹藥回復 HP/MP
          </div>
          {usableItems.length === 0 ? (
            <div className="text-gray-500 text-center py-6">沒有可使用的材料或消耗品</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {usableItems.map((item) => {
                const ef = effectLabel(item.effects);
                return (
                  <div key={item.id}
                    className={`bg-gray-800/60 rounded p-2.5 border ${RARITY_BORDER[item.rarity] || "border-gray-700"} flex items-center justify-between gap-2`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-medium ${RARITY_TEXT[item.rarity] || "text-gray-300"}`}>{item.item_name}</span>
                        <span className="text-xs text-gray-600">x{item.quantity}</span>
                      </div>
                      {ef && <div className="text-cyan-400/80 text-xs mt-0.5">{ef}</div>}
                    </div>
                    <Button onClick={() => useItem(item)} loading={selling === item.id} size="sm" variant="secondary">
                      使用
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* 貨幣獲取說明 */}
      {!selectedShop && shopList.length > 0 && (
        <Card title="貨幣獲取途徑">
          <div className="space-y-2 text-sm">
            {[
              { key: "spirit_stones", label: "靈石", tip: "擊殺怪物掉落、完成任務獎勵、出售物品給商城" },
              { key: "immortal_jade", label: "仙玉", tip: "每日登入獎勵（+5仙玉）、特殊活動獎勵" },
              { key: "honor_points",  label: "榮譽", tip: "擊殺 Boss 怪物獲得、高難度戰鬥獎勵" },
              { key: "contribution_points", label: "宗門貢獻", tip: "完成宗門任務、日常任務獲得" },
            ].map(({ key, label, tip }) => (
              <div key={key} className="flex items-start gap-2 bg-gray-800/50 rounded p-2.5">
                <span className={`font-semibold text-xs w-14 shrink-0 ${CURRENCY_COLOR[key]}`}>{label}</span>
                <span className="text-gray-400 text-xs">{tip}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
