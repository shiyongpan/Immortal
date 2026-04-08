import { useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";
import { inventoryApi } from "../../api/inventory";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { RARITY_COLORS } from "../../utils/format";

const SLOT_LABELS = {
  weapon: "武器", helmet: "頭盔", armor: "護甲",
  boots: "靴子", accessory_1: "飾品1", accessory_2: "飾品2",
};

export default function InventoryPage() {
  const { refreshPlayer } = useAuth();
  const inventory = useApi(inventoryApi.getAll);
  const [tab, setTab] = useState("bag");
  const [selected, setSelected] = useState(null);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => { inventory.execute(); }, []);

  const notify = (text) => { setActionMsg(text); setTimeout(() => setActionMsg(""), 3000); };

  const useItem = async (id) => {
    try {
      const r = await inventoryApi.useItem(id);
      notify(r.data.message || "使用成功");
      inventory.execute(); refreshPlayer(); setSelected(null);
    } catch (err) { notify(err.error || "使用失敗"); }
  };

  const equipItem = async (id) => {
    try {
      const r = await inventoryApi.equipItem(id);
      notify(r.data.message || "裝備成功");
      inventory.execute(); setSelected(null);
    } catch (err) { notify(err.error || "裝備失敗"); }
  };

  const unequipItem = async (id) => {
    try {
      await inventoryApi.unequipItem(id);
      notify("卸下成功");
      inventory.execute(); setSelected(null);
    } catch (err) { notify(err.error || "卸下失敗"); }
  };

  const discardItem = async (id) => {
    if (!confirm("確定要丟棄這個物品嗎？")) return;
    try {
      await inventoryApi.discardItem(id);
      notify("已丟棄");
      inventory.execute(); setSelected(null);
    } catch (err) { notify(err.error || "丟棄失敗"); }
  };

  const items = inventory.data?.items || [];
  const equippedItems = items.filter((i) => i.is_equipped);
  const displayItems = tab === "equip" ? equippedItems : items;
  const sel = items.find((i) => i.id === selected);

  return (
    <div className="space-y-4">
      <h1 className="text-yellow-400 text-xl font-bold border-l-2 border-yellow-500 pl-3">儲物戒</h1>

      {actionMsg && (
        <div className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200">{actionMsg}</div>
      )}

      <div className="flex gap-2">
        <Button onClick={() => setTab("bag")} variant={tab === "bag" ? "primary" : "secondary"} size="sm">
          全部背包 ({items.length})
        </Button>
        <Button onClick={() => setTab("equip")} variant={tab === "equip" ? "primary" : "secondary"} size="sm">
          已裝備 ({equippedItems.length})
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* 物品格子 */}
        <div className="col-span-2">
          <Card>
            {inventory.loading ? (
              <div className="text-gray-500 text-center py-8">載入中...</div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {displayItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item.id === selected ? null : item.id)}
                    className={`aspect-square rounded border p-1 flex flex-col items-center justify-center text-center transition-colors
                      ${item.id === selected ? "border-yellow-500 bg-yellow-900/30" : "border-gray-700 bg-gray-800 hover:border-gray-600"}
                      ${(RARITY_COLORS[item.rarity] || "").split(" ")[1] || ""}`}
                  >
                    <div className="text-base">{item.is_equipped ? "⚔" : "📦"}</div>
                    <div className="text-xs leading-tight mt-0.5 text-gray-300 line-clamp-2">{item.item_name}</div>
                    {item.quantity > 1 && <div className="text-xs text-yellow-500">×{item.quantity}</div>}
                    {item.slot && <div className="text-xs text-purple-400">{SLOT_LABELS[item.slot] || item.slot}</div>}
                  </button>
                ))}
                {displayItems.length === 0 && (
                  <div className="col-span-6 text-gray-500 text-center py-8">
                    {tab === "equip" ? "尚未裝備任何物品" : "背包空空如也"}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* 物品詳情 */}
        <Card title="物品詳情">
          {sel ? (
            <div className="space-y-3">
              <div className={`font-semibold text-sm ${(RARITY_COLORS[sel.rarity] || "").split(" ")[0]}`}>
                {sel.item_name}
              </div>
              <div className="text-gray-400 text-xs leading-relaxed">{sel.description}</div>
              <div className="text-xs space-y-1.5">
                <div><span className="text-gray-500">類型：</span><span className="text-gray-300">{sel.item_type}</span></div>
                <div><span className="text-gray-500">數量：</span><span className="text-gray-300">{sel.quantity ?? 1}</span></div>
                {sel.slot && <div><span className="text-gray-500">部位：</span><span className="text-purple-300">{SLOT_LABELS[sel.slot] || sel.slot}</span></div>}
                {Number(sel.base_attack) > 0 && <div><span className="text-gray-500">攻擊：</span><span className="text-red-300">+{sel.base_attack}</span></div>}
                {Number(sel.base_defense) > 0 && <div><span className="text-gray-500">防禦：</span><span className="text-blue-300">+{sel.base_defense}</span></div>}
                {Number(sel.base_hp) > 0 && <div><span className="text-gray-500">HP：</span><span className="text-green-300">+{sel.base_hp}</span></div>}
                {Number(sel.base_mp) > 0 && <div><span className="text-gray-500">MP：</span><span className="text-blue-300">+{sel.base_mp}</span></div>}
                <div><span className="text-gray-500">售價：</span><span className="text-yellow-500">{sel.sell_price} 靈石</span></div>
              </div>
              <div className="flex flex-col gap-2 pt-1">
                {sel.item_type === "consumable" && (
                  <Button onClick={() => useItem(sel.id)} size="sm">使用</Button>
                )}
                {sel.item_type === "equipment" && !sel.is_equipped && (
                  <Button onClick={() => equipItem(sel.id)} size="sm">裝備</Button>
                )}
                {sel.is_equipped && (
                  <Button onClick={() => unequipItem(sel.id)} size="sm" variant="secondary">卸下裝備</Button>
                )}
                <Button onClick={() => discardItem(sel.id)} size="sm" variant="danger">丟棄</Button>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm text-center py-6">點選物品查看詳情</div>
          )}
        </Card>
      </div>
    </div>
  );
}
