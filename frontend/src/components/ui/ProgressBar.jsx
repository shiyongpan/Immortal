import { formatPercent } from "../../utils/format";

export default function ProgressBar({ value, max, color = "yellow", label, showText = true }) {
  const pct = formatPercent(value, max);
  const colors = {
    yellow: "bg-yellow-600",
    red: "bg-red-600",
    blue: "bg-blue-600",
    purple: "bg-purple-600",
    green: "bg-green-600",
  };
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{label}</span>{showText && <span>{value}/{max}</span>}</div>}
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className={`${colors[color]} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
