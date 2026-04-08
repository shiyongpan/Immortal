export function formatNumber(n) {
  const num = Number(n);
  if (num >= 1e8) return (num / 1e8).toFixed(1) + "億";
  if (num >= 1e4) return (num / 1e4).toFixed(1) + "萬";
  return num.toLocaleString();
}

export function formatPercent(value, total) {
  if (!total) return 0;
  return Math.min(100, Math.floor((Number(value) / Number(total)) * 100));
}

export const RARITY_COLORS = {
  common: "text-gray-300 border-gray-500",
  uncommon: "text-green-400 border-green-500",
  rare: "text-blue-400 border-blue-500",
  epic: "text-purple-400 border-purple-500",
  legendary: "text-yellow-400 border-yellow-500",
};
