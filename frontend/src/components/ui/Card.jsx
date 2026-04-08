export default function Card({ children, className = "", title, action }) {
  return (
    <div className={`bg-gray-900 border border-yellow-900/40 rounded-lg ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-yellow-900/30">
          <h3 className="text-yellow-400 font-semibold text-sm">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
